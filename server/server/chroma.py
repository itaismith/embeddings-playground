import uuid

import chromadb
import numpy as np
import umap
from chromadb.api.models.Collection import Collection
from langchain.text_splitter import RecursiveCharacterTextSplitter, SentenceTransformersTokenTextSplitter
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from server.crud import read_embedded_doc
from server.embedding_models import get_embedding_function
from server.file_store import get_path
from server.models import DBDoc, DBPlayground
from server.schemas import Service, Point

client = chromadb.PersistentClient(path="/chroma_path")


def chunk_document(document_name: str):
    file_path = get_path(document_name)
    reader = PdfReader(file_path)
    pdf_texts = [p.extract_text().strip() for p in reader.pages]
    pdf_texts = [text for text in pdf_texts if text]

    character_splitter = RecursiveCharacterTextSplitter(separators=["\n\n", "\n", ".", " ", ""], chunk_size=1000,
                                                        chunk_overlap=0)

    split_texts = character_splitter.split_text("\n\n".join(pdf_texts))
    token_splitter = SentenceTransformersTokenTextSplitter(chunk_overlap=0, tokens_per_chunk=256)

    token_split_texts = []
    for text in split_texts:
        token_split_texts += token_splitter.split_text(text)

    split_texts = character_splitter.split_text("\n\n".join(pdf_texts))
    return split_texts


async def embed_document(session: AsyncSession, document: DBDoc, service: Service, model: str):
    collection_name = str(await read_embedded_doc(session, document.id, service.value, model))
    if collection_name in [c.name for c in client.list_collections()]:
        return client.get_collection(collection_name)
    doc_chunks = chunk_document(document.name)
    ids = [str(uuid.uuid4()) for _ in doc_chunks]
    embedding_function = get_embedding_function(service, model)
    chroma_collection = client.create_collection(collection_name, embedding_function=embedding_function)
    chroma_collection.add(ids=ids, documents=doc_chunks)
    return chroma_collection


async def get_playground_collection(session: AsyncSession, playground: DBPlayground) -> Collection:
    collection_name = str(playground.id)
    if collection_name in [c.name for c in client.list_collections()]:
        return client.get_collection(collection_name)
    embedding_function = get_embedding_function(playground.service, playground.model)
    chroma_collection = client.create_collection(collection_name, embedding_function=embedding_function)
    for doc in playground.documents:
        doc_collection = await embed_document(session, doc, playground.service, playground.model)
        doc_vectors = doc_collection.get(include=['embeddings'])
        chroma_collection.add(ids=doc_vectors['ids'], embeddings=doc_vectors['embeddings'],
                              documents=[doc_collection.name for _ in doc_vectors['ids']])

    return chroma_collection


async def get_playground_points(session: AsyncSession, playground: DBPlayground) -> list[dict]:
    collection = await get_playground_collection(session, playground)
    data = collection.get(include=["embeddings"])
    embeddings, ids = data["embeddings"], data["ids"]
    umap_transform = get_umap_transform(embeddings)
    projected_embeddings = project_embeddings(embeddings, umap_transform)
    return [{"id": ids[i], "x": point[0], "y": point[1]} for i, point in enumerate(projected_embeddings)]


def project_embeddings(embeddings, umap_transform):
    umap_embeddings = np.empty((len(embeddings), 2))
    for i, embedding in enumerate(embeddings):
        umap_embeddings[i] = umap_transform.transform([embedding])
    return umap_embeddings


def get_umap_transform(embeddings):
    return umap.UMAP(random_state=0, transform_seed=0).fit(embeddings)


async def get_chroma_document(session: AsyncSession, playground: DBPlayground, chunk_id: str):
    collection = await get_playground_collection(session, playground)
    doc_collection_id = collection.get(ids=[chunk_id], include=["documents"])["documents"][0]
    doc_collection = client.get_collection(doc_collection_id)
    return doc_collection.get(ids=[chunk_id], include=["documents"])["documents"][0]


async def get_query_results(session: AsyncSession, playground: DBPlayground, query: str) -> list[str]:
    collection = await get_playground_collection(session, playground)
    results = collection.query(query_texts=[query], n_results=5)
    return results['ids'][0]


async def get_query_point(session: AsyncSession, playground: DBPlayground, query: str, query_id: str) -> dict:
    collection = await get_playground_collection(session, playground)
    data = collection.get(include=["embeddings"])
    embeddings = data["embeddings"]
    umap_transform = get_umap_transform(embeddings)
    embedding_function = get_embedding_function(playground.service, playground.model)
    embedded_query = embedding_function([query])[0]
    query_point = project_embeddings([embedded_query], umap_transform)[0]
    return {"id": query_id, "x": query_point[0], "y": query_point[1]}

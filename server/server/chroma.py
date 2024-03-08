import uuid

import chromadb
import numpy as np
import umap
from chromadb import ClientAPI
from chromadb.api.models.Collection import Collection
from langchain.text_splitter import RecursiveCharacterTextSplitter, SentenceTransformersTokenTextSplitter
from pydantic import UUID4
from pypdf import PdfReader
from server.embedding_models import get_embedding_function
from server.file_store import get_path
from server.schemas import Service, Point, Document, Playground, Chunk


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


def embed_document(client: ClientAPI, document_collection: str, document_name: str, service: Service, model: str):
    if document_collection in [c.name for c in client.list_collections()]:
        return client.get_collection(document_collection)

    doc_chunks = chunk_document(document_name)
    ids = [str(uuid.uuid4()) for _ in doc_chunks]
    embedding_function = get_embedding_function(service, model)

    chroma_collection = client.create_collection(document_collection, embedding_function=embedding_function)
    chroma_collection.add(ids=ids, documents=doc_chunks)
    return chroma_collection


def create_playground_collection(client: ClientAPI, playground: Playground, documents: list[Document],
                                 embedded_document_ids: list[UUID4]) -> Collection:
    embedding_function = get_embedding_function(playground.service, playground.model)
    chroma_collection = client.create_collection(str(playground.id), embedding_function=embedding_function)

    for i, doc in enumerate(documents):
        embedded_document_id = embedded_document_ids[i]
        doc_collection = embed_document(client, str(embedded_document_id), doc.name,
                                        playground.service, playground.model)
        doc_vectors = doc_collection.get(include=['embeddings'])
        chroma_collection.add(ids=doc_vectors['ids'], embeddings=doc_vectors['embeddings'],
                              documents=[doc_collection.name for _ in doc_vectors['ids']])
    return chroma_collection


def create_playground_points(client: ClientAPI, playground: Playground) -> list[Point]:
    collection = client.get_collection(str(playground.id))
    data = collection.get(include=["embeddings"])
    embeddings, ids = data["embeddings"], data["ids"]
    umap_transform = get_umap_transform(embeddings)
    projected_embeddings = project_embeddings(embeddings, umap_transform)
    return [
        Point(id=ids[i], x=point[0], y=point[1], z=0)
        for i, point in enumerate(projected_embeddings)
    ]


def project_embeddings(embeddings, umap_transform):
    umap_embeddings = np.empty((len(embeddings), 2))
    for i, embedding in enumerate(embeddings):
        umap_embeddings[i] = umap_transform.transform([embedding])
    return umap_embeddings


def get_umap_transform(embeddings):
    return umap.UMAP(random_state=0, transform_seed=0).fit(embeddings)


def get_chroma_chunk(client: ClientAPI, playground: Playground, chunk_id: str) -> str:
    collection = client.get_collection(str(playground.id))
    doc_collection_id = collection.get(ids=[chunk_id], include=["documents"])["documents"][0]
    doc_collection = client.get_collection(doc_collection_id)
    return doc_collection.get(ids=[chunk_id], include=["documents"])["documents"][0]


def get_query_results(client: ClientAPI, playground: Playground, query: str) -> list[str]:
    collection = client.get_collection(str(playground.id))
    results = collection.query(query_texts=[query], n_results=5)
    return results['ids'][0]


def create_query_point(client: ClientAPI, playground: Playground, query: str, query_id: str) -> Point:
    collection = client.get_collection(str(playground.id))
    data = collection.get(include=["embeddings"])
    embeddings = data["embeddings"]
    umap_transform = get_umap_transform(embeddings)
    embedding_function = get_embedding_function(playground.service, playground.model)
    embedded_query = embedding_function([query])[0]
    query_point = project_embeddings([embedded_query], umap_transform)[0]
    return Point(id=query_id, x=query_point[0], y=query_point[1], z=0)

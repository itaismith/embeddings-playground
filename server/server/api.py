import logging
import mimetypes
import uuid
from typing import Annotated, Any

import chromadb
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from pydantic import UUID4
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse

from server import crud, mongo, chroma
from server.chroma import get_query_results
from server.crud import read_docs, create_doc, delete_doc, create_playground, update_playground_title, \
    read_playgrounds, create_query, read_queries
from server.db import get_connection, release_connection
from server.db_utils import create_tables
from server.embedding_models import get_embedding_models, models
from server.file_store import save_file, delete_file, get_path
from server.mongo import get_mongo_client
from server.schemas import EmbeddingModel, Document, Playground, RenamePlaygroundRequest, Point, Query, \
    QueryResult, NewPlaygroundRequest, Chunk, Service
from psycopg2.extensions import connection as Connection

app = FastAPI()

mongo_client = get_mongo_client()

chroma_client = chromadb.PersistentClient(path="/chroma_path")

logger = logging.getLogger(__name__)

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    conn = get_connection()
    try:
        yield conn
    finally:
        release_connection(conn)


@app.on_event("startup")
async def startup_event():
    conn = get_connection()
    create_tables(conn)
    release_connection(conn)


@app.get("/playgrounds/all", response_model=list[Playground])
async def get_playgrounds(conn: Annotated[Connection, Depends(get_db_connection)]) -> list[Playground]:
    try:
        playgrounds = await read_playgrounds(conn)
        return playgrounds
    except Exception as e:
        logger.error(f"Failed to fetch playgrounds: {e}")
        raise HTTPException(status_code=500, detail="Cannot get playgrounds at this time")


@app.post("/playgrounds/new-playground", response_model=Playground)
async def new_playground(conn: Annotated[Connection, Depends(get_db_connection)],
                         request: NewPlaygroundRequest) -> Playground:
    try:
        playground = await create_playground(conn, request.service,
                                             models[Service(request.service)], request.documents)
        return playground
    except Exception as e:
        logger.error(f"Failed to create a new playground: {e}")
        raise HTTPException(status_code=500, detail="Cannot create a new playground at this time")


@app.get("/models", response_model=list[EmbeddingModel])
async def get_models() -> list[EmbeddingModel]:
    return get_embedding_models()


@app.get("/documents/all", response_model=list[Document])
async def get_docs(conn: Annotated[Connection, Depends(get_db_connection)]) -> list[Document]:
    try:
        docs = await read_docs(conn)
        return docs
    except Exception as e:
        logger.error(f"Failed to get list of all documents: {e}")
        raise HTTPException(status_code=500, detail="Cannot get uploaded documents at this time")


@app.post("/documents/upload", response_model=Document)
async def upload_file(conn: Annotated[Connection, Depends(get_db_connection)],
                      file: UploadFile = File(...)) -> Document:
    try:
        document = await create_doc(conn, file.filename)
        await save_file(file)
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while uploading the file: {e}")


@app.delete("/documents/{document_id}/delete", response_model=list[UUID4])
async def delete_document(conn: Annotated[Connection, Depends(get_db_connection)], document_id: UUID4) -> list[UUID4]:
    try:
        doc, playground_ids = await delete_doc(conn, document_id)
        delete_file(doc.name)
        return playground_ids
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the file: {e}")


@app.get("/documents/{document_id}/download")
async def download_document(conn: Annotated[Connection, Depends(get_db_connection)], document_id: UUID4):
    try:
        doc = (await read_docs(conn, [document_id]))[0]
        document_path = get_path(doc.name)
        mime_type, _ = mimetypes.guess_type(document_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'
        return FileResponse(path=document_path, filename=doc.name, media_type=mime_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")


@app.post("/playgrounds/{playground_id}/rename", response_model=UUID4)
async def rename_playground(conn: Annotated[Connection, Depends(get_db_connection)],
                            playground_id: UUID4, rename: RenamePlaygroundRequest) -> UUID4:
    try:
        playground_id = await update_playground_title(conn, playground_id, rename.new_title)
        return playground_id
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while updating playground title: {e}")


@app.delete("/playgrounds/{playground_id}/delete", response_model=UUID4)
async def delete_playground(conn: Annotated[Connection, Depends(get_db_connection)],
                            playground_id: UUID4) -> UUID4:
    try:
        playground_id = await crud.delete_playground(conn, playground_id)
        return playground_id
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting playground: {e}")


@app.get("/playgrounds/{playground_id}/docs", response_model=list[Document])
async def get_playground_documents(conn: Annotated[Connection, Depends(get_db_connection)],
                                   playground_id: UUID4) -> list[Document]:
    try:
        document_ids = await crud.read_playground_docs(conn, playground_id)
        documents = await crud.read_docs(conn, document_ids)
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching playground {playground_id}: {e}")


@app.get("/playgrounds/{playground_id}/plot-points", response_model=list[Point])
async def get_plot(conn: Annotated[Connection, Depends(get_db_connection)], playground_id: UUID4) -> list[Point]:
    try:
        playground = (await read_playgrounds(conn, [playground_id]))[0]
        points = await mongo.get_points(mongo_client, str(playground.id))
        if points:
            return await mongo.get_points(mongo_client, str(playground.id))

        if str(playground.id) not in [c.name for c in chroma_client.list_collections()]:
            document_ids = await crud.read_playground_docs(conn, playground.id)
            documents = await crud.read_docs(conn, document_ids)
            embedded_document_ids = [
                await crud.read_or_create_embedded_doc(conn, doc.id, playground.service.value, playground.model)
                for doc in documents
            ]
            chroma.create_playground_collection(chroma_client, playground, documents, embedded_document_ids)

        playground_points = chroma.create_playground_points(chroma_client, playground)
        await mongo.create_points_collection(mongo_client, str(playground_id), playground_points)
        return await mongo.get_points(mongo_client, str(playground.id))

    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while fetching playground plot points {playground_id}: {e}")


@app.get("/playgrounds/{playground_id}/chunks/{chunk_id}")
async def get_chunk(conn: Annotated[Connection, Depends(get_db_connection)],
                    playground_id: UUID4, chunk_id: UUID4) -> Chunk:
    try:
        playground = (await read_playgrounds(conn, [playground_id]))[0]
        return Chunk(id=chunk_id, text=chroma.get_chroma_chunk(chroma_client, playground, str(chunk_id)))
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while fetching chunk {chunk_id}: {e}")


@app.post("/playgrounds/{playground_id}/query", response_model=QueryResult)
async def query_playground(conn: Annotated[Connection, Depends(get_db_connection)],
                           playground_id: UUID4, query: Query) -> QueryResult:
    try:
        playground = (await read_playgrounds(conn, [playground_id]))[0]
        results = get_query_results(chroma_client, playground, query.text)
        results = [uuid.UUID(result) for result in results]
        query = await create_query(conn, playground_id, query.text, results)
        query_point = chroma.create_query_point(chroma_client, playground, query.text, str(query.id))
        await mongo.insert_query_point(mongo_client, query_point)
        return QueryResult(id=query.id,
                           point=query_point, results=results, text=query.text)
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while submitting query {query}: {e}")


@app.get("/playgrounds/{playground_id}/query/all", response_model=list[QueryResult])
async def get_queries(conn: Annotated[Connection, Depends(get_db_connection)],
                      playground_id: UUID4) -> list[QueryResult]:
    try:
        queries = await read_queries(conn, playground_id)
        for query in queries:
            query.point = await mongo.get_mongo_query_point(mongo_client, str(query.id))
        return queries
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while getting queries: {e}")

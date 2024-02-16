import logging
import mimetypes
import uuid
from typing import Annotated

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse

from server.chroma import get_playground_points, get_chroma_document, get_query_results, get_query_point
from server.crud import read_docs, create_doc, delete_doc, read_doc, create_playground, update_playground_title, \
    delete_pg, read_playgrounds, read_playground, create_query, read_queries
from server.db import SessionLocal, engine
from server.embedding_models import get_embedding_models
from server.file_store import save_file, delete_file, get_path
from server.models import Base, DBDoc, DBPlayground
from server.mongo import has_playground, get_mongo_client, create_points_collection, get_points, insert_query_point, \
    get_mongo_query_point
from server.schemas import EmbeddingModel, Document, NewPlayground, Playground, RenamePlayground, Point, Query, \
    QueryResult

app = FastAPI()
mongo_client = get_mongo_client()

logger = logging.getLogger(__name__)

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_session() -> AsyncSession:
    session = SessionLocal()
    try:
        yield session
    finally:
        await session.close()


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/playgrounds/all", response_model=list[Playground])
async def get_playgrounds(session: Annotated[AsyncSession, Depends(get_session)]) -> list[DBPlayground]:
    try:
        playgrounds = await read_playgrounds(session)
        return playgrounds
    except Exception as e:
        logger.error(f"Failed to create a new playground: {e}")
        raise HTTPException(status_code=500, detail="Cannot get playgrounds at this time")


@app.post("/playgrounds/new-playground", response_model=Playground)
async def new_playground(session: Annotated[AsyncSession, Depends(get_session)],
                         playground: NewPlayground) -> DBPlayground:
    try:
        playground = await create_playground(session, playground)
        return playground
    except Exception as e:
        logger.error(f"Failed to create a new playground: {e}")
        raise HTTPException(status_code=500, detail="Cannot create a new playground at this time")


@app.get("/models", response_model=list[EmbeddingModel])
async def get_models():
    return get_embedding_models()


@app.get("/documents/all", response_model=list[Document])
async def get_docs(session: Annotated[AsyncSession, Depends(get_session)]) -> list[DBDoc]:
    try:
        docs = await read_docs(session)
        return docs
    except Exception as e:
        logger.error(f"Failed to get list of all documents: {e}")
        raise HTTPException(status_code=500, detail="Cannot get uploaded documents at this time")


@app.post("/documents/upload", response_model=Document)
async def upload_file(session: Annotated[AsyncSession, Depends(get_session)], file: UploadFile = File(...)) -> Document:
    try:
        document = await create_doc(session, file.filename)
        await save_file(file)
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while uploading the file: {e}")


@app.delete("/documents/{document_id}/delete", response_model=list[UUID4])
async def delete_document(document_id: UUID4, session: Annotated[AsyncSession, Depends(get_session)]) -> list[UUID4]:
    try:
        doc, playground_ids = await delete_doc(session, document_id)
        delete_file(doc.name)
        return playground_ids
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the file: {e}")


@app.get("/documents/{document_id}/download")
async def download_document(document_id: UUID4, session: Annotated[AsyncSession, Depends(get_session)]):
    try:
        doc = await read_doc(session, document_id)
        document_path = get_path(doc.name)
        mime_type, _ = mimetypes.guess_type(document_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'
        return FileResponse(path=document_path, filename=doc.name, media_type=mime_type)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")


@app.post("/playgrounds/{playground_id}/rename", response_model=Playground)
async def rename_playground(playground_id: UUID4, rename: RenamePlayground,
                            session: Annotated[AsyncSession, Depends(get_session)]) -> DBPlayground:
    try:
        playground = await update_playground_title(session, playground_id, rename.new_title)
        return playground
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while updating playground title: {e}")


@app.delete("/playgrounds/{playground_id}/delete", response_model=Playground)
async def delete_playground(playground_id: UUID4,
                            session: Annotated[AsyncSession, Depends(get_session)]) -> DBPlayground:
    try:
        playground = await delete_pg(session, playground_id)
        return playground
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting playground title: {e}")


@app.get("/playgrounds/{playground_id}/docs", response_model=list[str])
async def get_playground(playground_id: UUID4, session: Annotated[AsyncSession, Depends(get_session)]) -> list[str]:
    try:
        db_playground = await read_playground(session, playground_id, load_docs=True)
        return [doc.name for doc in db_playground.documents]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching playground {playground_id}: {e}")


@app.get("/playgrounds/{playground_id}/plot-points", response_model=list[Point])
async def get_plot(playground_id: UUID4, session: Annotated[AsyncSession, Depends(get_session)]) -> list[Point]:
    try:
        print("========ENTER=========")
        playground = await read_playground(session, playground_id, load_docs=True)
        print("========GOT PLAYGROUND=========")
        if not (await has_playground(mongo_client, str(playground.id))):
            print("========NO POINTS FOUND=========")
            playground_points = await get_playground_points(session, playground)
            print("========CREATED POINTS=========")
            await create_points_collection(mongo_client, str(playground_id), playground_points)
            print("========POINTS IN MONGO=========")
        await session.refresh(playground)
        return await get_points(mongo_client, str(playground.id))

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"An error occurred while fetching playground plot points {playground_id}: {e}")


@app.get("/playgrounds/{playground_id}/chunks/{chunk_id}")
async def get_chunk(playground_id: UUID4, chunk_id: UUID4,
                    session: Annotated[AsyncSession, Depends(get_session)]) -> dict:
    try:
        playground = await read_playground(session, playground_id)
        return {
            "id": chunk_id,
            "text": await get_chroma_document(session, playground, str(chunk_id))
        }
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while fetching chunk {chunk_id}: {e}")


@app.post("/playgrounds/{playground_id}/query", response_model=QueryResult)
async def query_playground(playground_id: UUID4, query: Query, session: Annotated[AsyncSession, Depends(get_session)]) -> QueryResult:
    try:
        playground = await read_playground(session, playground_id)
        results = await get_query_results(session, playground, query.text)
        results = [uuid.UUID(result) for result in results]
        query = await create_query(session, playground_id, query.text, results)
        playground = await read_playground(session, playground_id)
        query_point = await get_query_point(session, playground, query.text, str(query.id))
        await insert_query_point(mongo_client, query_point)
        return QueryResult(id=query.id,
                           point=Point(**query_point, z=0), results=results, text=query.text)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while submitting query {query}: {e}")


@app.get("/playgrounds/{playground_id}/query/all", response_model=list[QueryResult])
async def get_queries(playground_id: UUID4, session: Annotated[AsyncSession, Depends(get_session)]) -> list[QueryResult]:
    try:
        queries = await read_queries(session, playground_id)
        queries = [QueryResult(id=query.id, results=query.results, text=query.text,
                               point=await get_mongo_query_point(mongo_client, str(query.id))) for query in queries]
        return queries
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500,
                            detail=f"An error occurred while getting queries: {e}")


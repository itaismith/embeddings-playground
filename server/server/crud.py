import logging

from fastapi import HTTPException
from pydantic import UUID4
from sqlalchemy import select, UUID, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from server.embedding_models import models
from server.models import DBDoc, DBPlayground, PlaygroundDocumentAssociation, DBEmbeddedDoc, DBQuery
from server.schemas import NewPlayground, Service

logger = logging.getLogger(__name__)


async def read_docs(session: AsyncSession, doc_ids: list[UUID] = None) -> list[DBDoc]:
    try:
        if doc_ids:
            select_docs = select(DBDoc).where(DBDoc.id.in_(doc_ids))
        else:
            select_docs = select(DBDoc)
        docs = (await session.execute(select_docs)).scalars().all()
        return list(docs)
    except Exception as e:
        logger.error(f"DB failure to get documents list: {e}")
        raise e


async def create_doc(session: AsyncSession, name: str) -> DBDoc:
    try:
        new_doc = DBDoc(name=name)
        session.add(new_doc)
        await session.commit()
        await session.refresh(new_doc)
        return new_doc
    except Exception as e:
        logger.error(f"DB failed to record document: {e}")
        raise e


async def read_doc(session: AsyncSession, doc_id: UUID4) -> DBDoc:
    try:
        select_doc = select(DBDoc).where(DBDoc.id == doc_id)
        result = await session.execute(select_doc)
        doc = result.scalars().first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc
    except Exception as e:
        logger.error(f"DB failure to query document {doc_id}: {e}")
        raise e


async def delete_doc(session: AsyncSession, doc_id: UUID4) -> tuple[DBDoc, list[UUID]]:
    try:
        doc = await read_doc(session, doc_id)

        select_associated_playgrounds = select(DBPlayground).join(
            PlaygroundDocumentAssociation).where(PlaygroundDocumentAssociation.c.document_id == doc.id)
        result = await session.execute(select_associated_playgrounds)
        associated_playgrounds = result.scalars().all()

        playground_ids = [playground.id for playground in associated_playgrounds]

        await session.execute(
            delete(PlaygroundDocumentAssociation)
            .where(PlaygroundDocumentAssociation.c.document_id == doc.id)
        )

        await session.execute(
            delete(DBEmbeddedDoc).where(DBEmbeddedDoc.document_id == doc.id)
        )

        for playground in associated_playgrounds:
            await session.delete(playground)

        await session.delete(doc)
        await session.commit()
        return doc, playground_ids
    except Exception as e:
        logger.error(f"DB failed to delete document {doc_id}: {e}")
        raise e


async def create_playground(session: AsyncSession, new_playground: NewPlayground) -> DBDoc:
    try:
        docs = await read_docs(session, new_playground.documents)
        playground = DBPlayground(service=new_playground.service, model=models[Service(new_playground.service)],
                                  documents=docs, title="New Playground")
        session.add(playground)
        await session.commit()
        await session.refresh(playground)
        return playground
    except Exception as e:
        logger.error(f"DB failed to create playground: {e}")
        raise e


async def read_playground(session: AsyncSession, playground_id: UUID4, load_docs: bool = False) -> DBPlayground:
    try:
        select_playground = select(DBPlayground)
        if load_docs:
            select_playground = select_playground.options(selectinload(DBPlayground.documents))
        select_playground = select_playground.where(DBPlayground.id == playground_id)
        result = await session.execute(select_playground)
        playground = result.scalars().first()
        if not playground:
            raise HTTPException(status_code=404, detail="Playground not found")
        return playground
    except Exception as e:
        logger.error(f"DB failure to query playground {playground_id}: {e}")
        raise e


async def update_playground_title(session: AsyncSession, playground_id: UUID4, new_title: str) -> DBPlayground:
    try:
        playground = await read_playground(session, playground_id)
        playground.title = new_title
        await session.commit()
        await session.refresh(playground)
        return playground
    except Exception as e:
        logger.error(f"DB failure to update playground title {playground_id}: {e}")
        raise e


async def delete_pg(session: AsyncSession, playground_id: UUID4) -> DBPlayground:
    try:
        playground = await read_playground(session, playground_id)
        await session.execute(
            delete(PlaygroundDocumentAssociation)
            .where(PlaygroundDocumentAssociation.c.playground_id == playground.id)
        )
        await session.delete(playground)
        await session.commit()
        return playground
    except Exception as e:
        logger.error(f"DB failure to update playground title {playground_id}: {e}")
        raise e


async def read_playgrounds(session: AsyncSession) -> list[DBPlayground]:
    try:
        select_playgrounds = select(DBPlayground)
        result = await session.execute(select_playgrounds)
        playgrounds = list(result.scalars().all())
        return playgrounds
    except Exception as e:
        logger.error(f"DB failure to read playgrounds: {e}")
        raise e


async def read_playground_docs(session: AsyncSession, playground_id: str) -> list[DBDoc]:
    try:
        select_docs = select(PlaygroundDocumentAssociation).where(PlaygroundDocumentAssociation.c.playground_id == playground_id)
        result = await session.execute(select_docs)
        ids = [doc.document_id for doc in result.scalars().all()]
        return await read_docs(session, ids)
    except Exception as e:
        logger.error(f"DB failure to read docs: {e}")
        raise e


async def read_embedded_doc(session: AsyncSession, document_id: UUID, service: str, model: str) -> UUID:
    try:
        select_doc = select(DBEmbeddedDoc).where(DBEmbeddedDoc.document_id == document_id and
                                                 DBEmbeddedDoc.service == service and DBEmbeddedDoc.model == model)
        result = await session.execute(select_doc)
        doc = result.scalars().first()
        if not doc:
            doc = await create_embedded_doc(session, document_id, service, model)
        return doc.id

    except Exception as e:
        logger.error(f"DB failure to read embedded doc: {e}")
        raise e


async def create_embedded_doc(session: AsyncSession, document_id: UUID, service: str, model: str) -> DBEmbeddedDoc:
    try:
        new_doc = DBEmbeddedDoc(document_id=document_id, service=service, model=model)
        session.add(new_doc)
        await session.commit()
        await session.refresh(new_doc)
        return new_doc
    except Exception as e:
        logger.error(f"DB failed to record document: {e}")
        raise e


async def create_query(session: AsyncSession, playground_id: UUID, query_text: str, results: list[UUID]):
    try:
        new_query = DBQuery(text=query_text, playground_id=playground_id, results=results)
        session.add(new_query)
        await session.commit()
        await session.refresh(new_query)
        return new_query
    except Exception as e:
        logger.error(f"DB failed to record query: {e}")
        raise e


async def read_queries(session: AsyncSession, playground_id: UUID) -> list[DBQuery]:
    try:
        select_queries = select(DBQuery).where(DBQuery.playground_id == playground_id)
        result = await session.execute(select_queries)
        queries = result.scalars().all()
        return list(queries)
    except Exception as e:
        logger.error(f"DB failed to get queries: {e}")
        raise e

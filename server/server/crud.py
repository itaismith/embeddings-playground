import logging

from fastapi import HTTPException
from pydantic import UUID4

from server.db_utils import execute_query
from server.schemas import Document, Playground, QueryResult
from psycopg2.extensions import connection as Connection

logger = logging.getLogger(__name__)


async def read_docs(conn: Connection, doc_ids: list[UUID4] = None) -> list[Document]:
    if doc_ids:
        doc_ids = [str(uuid) for uuid in doc_ids]

        query = "SELECT * FROM document WHERE id = ANY(%s::UUID[])"
        result = await execute_query(conn, query, (doc_ids,))
        if not result:
            raise HTTPException(status_code=404, detail="Document(s) not found")
    else:
        query = "SELECT * FROM document"
        result = await execute_query(conn, query, (doc_ids,))
    return [Document(**document) for document in result]


async def read_playground_docs(conn: Connection, playground_id: UUID4) -> list[UUID4]:
    query = "SELECT document_id FROM playground_document_association where playground_id = %s"
    document_ids = await execute_query(conn, query, (str(playground_id),))
    return [document_id['document_id'] for document_id in document_ids]


async def create_doc(conn: Connection, name: str) -> Document:
    query = "INSERT INTO document (name) VALUES (%s) RETURNING *;"
    params = (name,)
    return await execute_query(conn, query, params, fetch_one=True)


async def delete_doc(conn: Connection, doc_id: UUID4) -> tuple[Document, list[UUID4]]:
    params = (str(doc_id),)

    delete_playgrounds_query = """
    DELETE FROM playground WHERE id IN (
        SELECT playground_id FROM playground_document_association 
        WHERE document_id = %s
    )
    RETURNING id
    """
    playground_ids = await execute_query(conn, delete_playgrounds_query, params)

    delete_document_query = "DELETE FROM document WHERE id = %s RETURNING *;"

    document = await execute_query(conn, delete_document_query, params, fetch_one=True)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return Document(**document), [playground_id['id'] for playground_id in playground_ids]


async def create_playground(conn: Connection, service: str, model: str, documents: list[UUID4]) -> Playground:
    docs = await read_docs(conn, documents)

    insert_playground_query = "INSERT INTO playground (service, model) VALUES (%s, %s) RETURNING *"
    playground = await execute_query(conn, insert_playground_query, (service, model), fetch_one=True)

    associate_documents_query = """
    INSERT INTO playground_document_association (playground_id, document_id)
    VALUES (%s, %s);
    """

    for doc in docs:
        await execute_query(conn, associate_documents_query, (str(playground['id']), str(doc.id)), fetch_all=False)

    return playground


async def read_playgrounds(conn: Connection, playground_ids: list[UUID4] = None) -> list[Playground]:
    if playground_ids:
        playground_ids = [str(playground_id) for playground_id in playground_ids]
        query = "SELECT * FROM playground WHERE id = ANY(%s::UUID[])"
        result = await execute_query(conn, query, (playground_ids,))
        if not result:
            raise HTTPException(status_code=404, detail="Playground(s) not found")
    else:
        query = "SELECT * FROM playground"
        result = await execute_query(conn, query, (playground_ids,))
    return [Playground(**playground) for playground in result]


async def update_playground_title(conn: Connection, playground_id: UUID4, new_title: str) -> UUID4:
    update_query = """
            UPDATE playground
            SET title = %s
            WHERE id = %s
            RETURNING id;
        """
    updated = await execute_query(conn, update_query, (new_title, str(playground_id)), fetch_one=True)
    if not updated:
        raise HTTPException(status_code=404, detail="Playground not found")
    return updated['id']


async def delete_playground(conn: Connection, playground_id: UUID4) -> UUID4:
    params = (str(playground_id),)

    delete_playground_query = "DELETE FROM playground WHERE id = %s RETURNING id;"
    playground_id = await execute_query(conn, delete_playground_query, params, fetch_one=True)

    if not playground_id:
        raise HTTPException(status_code=404, detail="Playground not found")
    return playground_id['id']


async def read_embedded_doc(conn: Connection, document_id: UUID4, service: str, model: str) -> UUID4:
    query = "SELECT id FROM embedded_document WHERE document_id = %s AND service = %s AND model = %s;"
    result = await execute_query(conn, query, (str(document_id), service, model), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="Embedded document not found")
    return result['id']


async def create_embedded_doc(conn: Connection, document_id: UUID4, service: str, model: str) -> UUID4:
    query = "INSERT INTO embedded_document (document_id, service, model) VALUES (%s, %s, %s) RETURNING id;"
    return (await execute_query(conn, query, (str(document_id), service, model), fetch_one=True))['id']


async def read_or_create_embedded_doc(conn: Connection, document_id: UUID4, service: str, model: str) -> UUID4:
    try:
        return await read_embedded_doc(conn, document_id, service, model)
    except HTTPException:
        return await create_embedded_doc(conn, document_id, service, model)


async def create_query(conn: Connection, playground_id: UUID4, query_text: str, results: list[UUID4]) -> QueryResult:
    query = "INSERT INTO query (playground_id, text, results) VALUES (%s, %s, %s::UUID[]) RETURNING *;"
    result = await execute_query(conn, query, (str(playground_id),
                                               query_text, [str(r) for r in results]), fetch_one=True)
    return QueryResult(**result)


async def read_queries(conn: Connection, playground_id: UUID4) -> list[QueryResult]:
    query = "SELECT * FROM query WHERE playground_id = %s"
    result = await execute_query(conn, query, (str(playground_id),))
    return [QueryResult(**query) for query in result]

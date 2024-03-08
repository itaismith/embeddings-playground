from typing import Any, Optional, Union, Tuple, List
from psycopg2.extensions import connection as Connection

import psycopg2.extras
import logging

logger = logging.getLogger(__name__)

Params = Optional[Union[Any, Tuple[Any, ...], List[Any]]]


async def execute_query(conn: Connection, query: str, params: Params = None, fetch_all: bool = True,
                        fetch_one: bool = False):
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute(query, params)
            conn.commit()
            if fetch_one:
                result = cursor.fetchone()
                return dict(result) if result else None
            if fetch_all:
                return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise


CREATE_TABLES_SQL = [
    """
    CREATE TABLE IF NOT EXISTS playground (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'New Playground',
    created TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    service VARCHAR(255),
    model VARCHAR(255)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS playground_document_association (
    playground_id UUID REFERENCES playground(id) ON DELETE CASCADE,
    document_id UUID REFERENCES document(id) ON DELETE CASCADE,
    PRIMARY KEY (playground_id, document_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS embedded_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES document(id) ON DELETE CASCADE,
    service VARCHAR(255),
    model VARCHAR(255)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS query (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playground_id UUID REFERENCES playground(id) ON DELETE CASCADE,
    text VARCHAR(255),
    results UUID[]
    );
    """
]


def create_tables(conn: Connection):
    with conn.cursor() as cursor:
        for sql in CREATE_TABLES_SQL:
            cursor.execute(sql)
    conn.commit()

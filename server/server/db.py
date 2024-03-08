import os

from psycopg2 import pool
from psycopg2.extensions import connection as Connection
import psycopg2.extras

PG_USER = os.getenv("POSTGRES_USER")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD")
PG_DB = os.getenv("POSTGRES_DB")
PG_HOST = "db"


psycopg2.extras.register_uuid()

connection_pool = pool.SimpleConnectionPool(1, 10,
                                            user=PG_USER,
                                            password=PG_PASSWORD,
                                            database=PG_DB,
                                            host=PG_HOST)


def get_connection() -> Connection:
    return connection_pool.getconn()


def release_connection(conn):
    connection_pool.putconn(conn)

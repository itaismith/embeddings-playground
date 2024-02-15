import os

from motor.motor_asyncio import AsyncIOMotorClient

from server.schemas import Point

DB_NAME = "points"


def get_mongo_client():
    user = os.getenv("POINTSTORE_USER")
    password = os.getenv("POINTSTORE_PASSWORD")
    host = "point-store"
    mongo_details = f"mongodb://{user}:{password}@{host}:27017"
    client = AsyncIOMotorClient(mongo_details)
    return client


async def has_playground(client: AsyncIOMotorClient, playground_id: str) -> bool:
    collections = [collection['name'] async for collection in await client[DB_NAME].list_collections()]
    return playground_id in collections


async def create_points_collection(client: AsyncIOMotorClient, playground_id: str, points: list[dict]):
    collection = client[DB_NAME][playground_id]
    mongo_points = [{**point, "_id": point["id"]} for point in points]
    result = await collection.insert_many(mongo_points)
    return result.inserted_ids


async def get_points(client: AsyncIOMotorClient, collection_name: str) -> list[Point]:
    collection = client[DB_NAME][collection_name]
    points = []
    async for document in collection.find():
        point = Point(id=document["_id"], x=document["x"], y=document["y"], z=0)
        points.append(point)

    return points


async def insert_query_point(client: AsyncIOMotorClient, point: dict) -> Point:
    collection = client[DB_NAME]["queries"]
    mongo_point = {**point, "_id": point["id"], "z": 0}
    result = await collection.insert_one(mongo_point)
    return result.inserted_id

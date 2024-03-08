import os

from bson import ObjectId
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


async def create_points_collection(client: AsyncIOMotorClient, playground_id: str, points: list[Point]):
    collection = client[DB_NAME][playground_id]
    mongo_points = [{**point.dict(exclude={"id"}), "_id": str(point.id)} for point in points]
    result = await collection.insert_many(mongo_points)
    return result.inserted_ids


async def get_points(client: AsyncIOMotorClient, collection_name: str) -> list[Point]:
    collection = client[DB_NAME][collection_name]
    points = []
    async for document in collection.find():
        point = Point(id=document["_id"], x=document["x"], y=document["y"], z=0)
        points.append(point)

    return points


async def insert_query_point(client: AsyncIOMotorClient, point: Point) -> Point:
    collection = client[DB_NAME]["queries"]
    mongo_point = {**point.dict(exclude={"id"}), "_id": str(point.id)}
    result = await collection.insert_one(mongo_point)
    return result.inserted_id


async def get_mongo_query_point(client: AsyncIOMotorClient, query_id: str) -> Point:
    collection = client[DB_NAME]["queries"]
    document = await collection.find_one({'_id': query_id})
    del document['_id']
    return Point(**document, id=query_id)

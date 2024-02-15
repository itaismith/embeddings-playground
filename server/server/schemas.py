import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, UUID4, ConfigDict, Extra


class Service(str, Enum):
    sentenceTransformers = "Sentence Transformers",
    openAI = "OpenAI",
    cohere = "Cohere",
    google = "Google Generative AI"


class EmbeddingModel(BaseModel):
    service: Service
    model: str
    apiKey: bool


class Document(BaseModel):
    id: UUID4
    name: str


class Playground(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: UUID4
    title: str
    created: datetime.datetime
    service: Service
    model: str
    documentNames: Optional[list[str]] = []


class NewPlayground(BaseModel):
    service: str
    documents: list[UUID4]


class RenamePlayground(BaseModel):
    new_title: str


class Point(BaseModel):
    id: UUID4
    x: float
    y: float
    z: float


class Query(BaseModel):
    text: str


class QueryResult(BaseModel):
    id: UUID4
    point: Point
    results: list[UUID4]
    text: str

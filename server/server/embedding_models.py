import os
from enum import Enum
from typing import Callable

import chromadb.utils.embedding_functions as embedding_functions

from server.schemas import EmbeddingModel, Service


class ModelConfig(str, Enum):
    model_name = "model_name"
    api_key = "api_key"


keys: dict[Service, str] = {
    Service.openAI: os.getenv("OPENAI_API_KEY") or "",
    Service.google: os.getenv("COHERE_API_KEY") or "",
    Service.cohere: os.getenv("GOOGLE_API_KEY") or ""
}

models: dict[Service, str] = {
    Service.sentenceTransformers: "all-MiniLM-L6-v2",
    Service.openAI: "text-embedding-ada-002",
    Service.cohere: "large",
    Service.google: ""
}

functions: dict[Service, Callable] = {
    Service.sentenceTransformers: embedding_functions.SentenceTransformerEmbeddingFunction,
    Service.openAI: embedding_functions.OpenAIEmbeddingFunction,
    Service.cohere: embedding_functions.CohereEmbeddingFunction,
    Service.google: embedding_functions.GoogleGenerativeAiEmbeddingFunction
}


configs: dict[Service, list[ModelConfig]] = {
    Service.sentenceTransformers: [],
    Service.openAI: [ModelConfig.model_name, ModelConfig.api_key],
    Service.cohere: [ModelConfig.model_name, ModelConfig.api_key],
    Service.google: [ModelConfig.api_key]
}

config_dicts: dict[ModelConfig, dict] = {
    ModelConfig.api_key: keys,
    ModelConfig.model_name: models
}


def get_embedding_function(service: Service, model: str = ""):
    if model:
        models[service] = model
    kwargs = {c.value: config_dicts[c][service] for c in configs[service]}
    return functions[service](**kwargs)


def need_api_key(service: Service) -> bool:
    if service not in keys:
        return False
    return len(keys[service]) == 0


def get_embedding_models() -> list[EmbeddingModel]:
    return [
        EmbeddingModel(service=service, model=model, apiKey=need_api_key(service))
        for service, model in models.items()
    ]

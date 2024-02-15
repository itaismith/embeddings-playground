FROM python:3.12

WORKDIR /app

COPY ./pyproject.toml ./poetry.lock* /app/

RUN apt-get update && apt-get install -y \
    cmake \
    pkg-config \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry
RUN poetry config virtualenvs.create false
RUN poetry install

COPY ./server /app

CMD ["uvicorn", "server.api:app", "--host", "0.0.0.0", "--port", "8000"]

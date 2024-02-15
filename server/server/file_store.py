import os

import aiofiles
from fastapi import File

file_store_path = "/files"


async def save_file(file: File):
    os.makedirs(file_store_path, exist_ok=True)
    file_path = os.path.join(file_store_path, file.filename)
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await file.read(1024):
            await out_file.write(content)


def delete_file(file: str):
    file_path = os.path.join(file_store_path, file)
    os.remove(file_path)


def get_path(file_name: str):
    return os.path.join(file_store_path, file_name)

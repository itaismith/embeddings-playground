import axios, { Axios, AxiosRequestConfig, ResponseType } from "axios";
import EmbeddingsModel from "./models/EmbeddingsModel";
import DocumentModel from "./models/DocumentModel";
import PlaygroundModel from "./models/PlaygroundModel";
import PointModel from "./models/PointModel";
import QueryModel from "./models/QueryModel";
import { a } from "react-spring";
import ChunkModel from "./models/ChunkModel";

const host: string = process.env.APP_ENV ? "server" : "localhost";

const request = async (
  method: Axios["get"] | Axios["post"] | Axios["delete"] | Axios["put"],
  endpoint: string,
  config?: AxiosRequestConfig,
  body?: any,
) => {
  try {
    const response = await method(
      `http://${host}:8000/${endpoint}`,
      body,
      config,
    );
    return response.data;
  } catch (e) {
    console.error("An error occurred: ", e);
    throw e;
  }
};

const getModels = async (): Promise<EmbeddingsModel[]> => {
  return await request(axios.get, "models");
};

export const getDocs = async (): Promise<DocumentModel[]> => {
  return await request(axios.get, "documents/all");
};

export const uploadDocument = async (
  data: FormData,
): Promise<DocumentModel> => {
  const doc = await request(axios.post, "documents/upload", {}, data);
  console.error(doc);
  return doc;
};

export const deleteDocument = async (doc: DocumentModel): Promise<string[]> => {
  try {
    return await request(axios.delete, `documents/${doc.id}/delete`);
  } catch (e) {
    return [];
  }
};

export const downloadDocument = async (doc: DocumentModel) => {
  try {
    const response = await axios.get(
      `http://${host}:8000/documents/${doc.id}/download`,
      {
        responseType: "blob",
      },
    );

    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    let fileName = doc.name;

    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed", error);
  }
};

export const createNewPlayground = async (
  service: string,
  documents: string[],
): Promise<PlaygroundModel> => {
  console.log(service);
  return await request(
    axios.post,
    "playgrounds/new-playground",
    {},
    {
      service,
      documents,
    },
  );
};

export const renamePlayground = async (
  playground: PlaygroundModel,
  newTitle: string,
): Promise<PlaygroundModel> => {
  try {
    return await request(
      axios.post,
      `playgrounds/${playground.id}/rename`,
      {},
      { new_title: newTitle },
    );
  } catch (e) {
    return playground;
  }
};

export const deletePlayground = async (
  playground: PlaygroundModel,
): Promise<PlaygroundModel> => {
  try {
    return await request(axios.delete, `playgrounds/${playground.id}/delete`);
  } catch (e) {
    return playground;
  }
};

export const getPlaygrounds = async (): Promise<PlaygroundModel[]> => {
  return await request(axios.get, "playgrounds/all");
};

export const getPlaygroundDocs = async (
  playgroundId: string,
): Promise<string[]> => {
  if (!playgroundId) {
    return [];
  }
  return await request(axios.get, `playgrounds/${playgroundId}/docs`);
};

export const getPlaygroundPoints = async (
  playgroundId: string,
): Promise<PointModel[]> => {
  return await request(axios.get, `playgrounds/${playgroundId}/plot-points`);
};

export const getChunk = async (
  playgroundId: string,
  chunkId: string,
): Promise<ChunkModel> => {
  return await request(
    axios.get,
    `playgrounds/${playgroundId}/chunks/${chunkId}`,
  );
};

export const submitQuery = async (
  playgroundId: string,
  query: string,
): Promise<QueryModel> => {
  return await request(
    axios.post,
    `playgrounds/${playgroundId}/query`,
    {},
    { text: query },
  );
};

export default getModels;

import React, { ReactNode, useState } from "react";
import PlaygroundModel from "../models/PlaygroundModel";
import QueryModel from "../models/QueryModel";
import ChunkModel from "../models/ChunkModel";

export interface PlaygroundContextValue {
  playgrounds: PlaygroundModel[];
  setPlaygrounds: React.Dispatch<React.SetStateAction<PlaygroundModel[]>>;
  activePlayground: string;
  setActivePlayground: React.Dispatch<React.SetStateAction<string>>;
  getPlayground: (playgroundId: string) => PlaygroundModel | undefined;
  chunks: ChunkModel[];
  setChunks: React.Dispatch<React.SetStateAction<ChunkModel[]>>;
  chunkIndex: { [id: string]: number };
  setChunkIndex: React.Dispatch<React.SetStateAction<{ [id: string]: number }>>;
  nextChunkIndex: () => number;
  queries: QueryModel[];
  setQueries: React.Dispatch<React.SetStateAction<QueryModel[]>>;
  activeQuery: string;
  setActiveQuery: React.Dispatch<React.SetStateAction<string>>;
}

export interface PlaygroundContextProviderProps {
  children?: ReactNode;
}

const PlaygroundContextDefaultValue = {
  playgrounds: [],
  setPlaygrounds: () => {},
  activePlayground: "",
  setActivePlayground: () => {},
  getPlayground: (playgroundId: string) => undefined,
  chunks: [],
  setChunks: () => {},
  chunkIndex: {},
  setChunkIndex: () => {},
  nextChunkIndex: () => 1,
  queries: [],
  setQueries: () => {},
  activeQuery: "",
  setActiveQuery: () => {},
};

const PlaygroundContext = React.createContext<PlaygroundContextValue>(
  PlaygroundContextDefaultValue,
);

export const PlaygroundContextProvider: React.FC<
  PlaygroundContextProviderProps
> = (props) => {
  const [playgrounds, setPlaygrounds] = useState<PlaygroundModel[]>([]);
  const [activePlayground, setActivePlayground] = useState<string>("");
  const [chunks, setChunks] = useState<ChunkModel[]>([]);
  const [chunkIndex, setChunkIndex] = useState<{ [id: string]: number }>({});
  const [queries, setQueries] = useState<QueryModel[]>([]);
  const [activeQuery, setActiveQuery] = useState<string>("");

  const getPlayground = (playgroundId: string) => {
    return playgrounds.find((playground) => playground.id === playgroundId);
  };

  const nextChunkIndex = () => {
    const indices = Object.values(chunkIndex);
    indices.sort();
    if (indices.length === 0 || indices[0] > 1) {
      return 1;
    }
    for (let i = 1; i < indices.length; i += 1) {
      if (indices[i] - indices[i - 1] !== 1) {
        return indices[i - 1] + 1;
      }
    }
    return indices[indices.length - 1] + 1;
  };

  return (
    <PlaygroundContext.Provider
      value={{
        playgrounds,
        setPlaygrounds,
        activePlayground,
        setActivePlayground,
        getPlayground,
        chunks,
        setChunks,
        chunkIndex,
        setChunkIndex,
        nextChunkIndex,
        queries,
        setQueries,
        activeQuery,
        setActiveQuery,
      }}
    >
      {props.children}
    </PlaygroundContext.Provider>
  );
};

export default PlaygroundContext;

import React, { useContext, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import PlaygroundContext from "../../context/PlaygroundContext";
import { getChunk } from "../../api";

const ChunksList: React.FC = () => {
  const {
    activePlayground,
    activeQuery,
    queries,
    chunks,
    chunkIndex,
    setChunks,
    setChunkIndex,
  } = useContext(PlaygroundContext);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!activeQuery) {
      return;
    }
    const query = queries.find((q) => q.id === activeQuery);
    if (!query) {
      return;
    }
    const chunks = Promise.all(
      query.results.map(
        async (result) => await getChunk(activePlayground, result),
      ),
    );
    chunks
      .then((data) => {
        const index: { [id: string]: number } = {};
        data.forEach((chunk) => {
          chunk.type = "query";
          index[chunk.id] = Object.keys(index).length + 1;
        });
        setChunks(data.reverse());
        setChunkIndex(index);
      })
      .catch((e) => {});
  }, [activeQuery]);

  const removeChunk = async (id: string) => {
    setChunks((prev) => prev.filter((c) => c.id !== id));
    setChunkIndex((prev) => {
      delete prev[id];
      return { ...prev };
    });
  };

  return (
    <div
      className={`flex-shrink-0 px-5 overflow-y-scroll h-[90%] transition-width ease-in-out duration-500  ${
        chunks.length > 0 ? "w-1/3" : "w-0"
      }`}
      onTransitionEnd={() => setOpen((prev) => !prev)}
    >
      {open &&
        chunks.map((chunk) => (
          <div
            key={chunkIndex[chunk.id]}
            className={`relative max-h-36 p-2 rounded-xl my-2 border overflow-y-scroll text-xs ${chunk.type === "query" ? "border-yellow-600" : "border-blue-600"}`}
          >
            <div
              className="absolute top-1 right-1 p-1 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300"
              onClick={() => removeChunk(chunk.id)}
            >
              <XMarkIcon className="w-2 h-2 text-gray-900" />
            </div>
            <div className="mr-3 select-none">
              <div
                className={`inline-block select-none w-5 h-5 text-xs text-center mr-1 rounded-full border ${chunk.type === "query" ? "bg-yellow-600/25 border-yellow-600 text-yellow-600" : "bg-blue-600/25 border-blue-600 text-blue-600"}`}
              >
                {chunkIndex[chunk.id]}
              </div>
              {chunk.text}
            </div>
          </div>
        ))}
    </div>
  );
};

export default ChunksList;

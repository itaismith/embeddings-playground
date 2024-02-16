import React, { useContext, useEffect, useState } from "react";
import PlaygroundModel from "../../models/PlaygroundModel";
import useAPI from "../../hooks/useAPI";
import {
  getChunk,
  getPlaygroundDocs,
  getPlaygroundPoints,
  getQueries,
} from "../../api";
import PointModel from "../../models/PointModel";
import Scatterplot from "../scatterplot/Scatterplot";
import ErrorBanner from "../../layouts/ErrorBanner";
import Spinner from "../../layouts/Spinner";
import PlaygroundTags from "./PlaygroundTags";
import PlaygroundContext from "../../context/PlaygroundContext";
import ChunksList from "./ChunksList";
import QueryInput from "./QueryInput";
import QueryModel from "../../models/QueryModel";

const Playground: React.FC<{ playground: PlaygroundModel }> = (props) => {
  const [docs, loadingDocs, docsError] = useAPI(
    getPlaygroundDocs.bind(null, props.playground.id),
  );
  const [points, loadingPoints, pointsError] = useAPI<PointModel[]>(
    getPlaygroundPoints.bind(null, props.playground.id),
  );
  const [serverQueries, loadingQueries, queriesError] = useAPI<QueryModel[]>(
    getQueries.bind(null, props.playground.id),
  );

  const {
    activeQuery,
    setActiveQuery,
    queries,
    chunkIndex,
    setChunks,
    setChunkIndex,
    nextChunkIndex,
    setQueries,
  } = useContext(PlaygroundContext);

  useEffect(() => {
    if (serverQueries) {
      setQueries(serverQueries);
    }
  }, [serverQueries]);

  const onPointClick = async (id: string) => {
    if (id in chunkIndex) {
      return;
    }
    const chunk = await getChunk(props.playground.id, id);
    setChunks((prev) => [chunk, ...prev]);
    const newChunkIndex = nextChunkIndex();
    setChunkIndex((prev) => {
      return { ...prev, [chunk.id]: newChunkIndex };
    });
  };

  if (docsError || pointsError || queriesError) {
    return (
      <ErrorBanner
        message={docsError || pointsError}
        className="self-center justify-self-center"
      />
    );
  }

  if (loadingDocs || loadingPoints || loadingQueries) {
    return (
      <div className="w-full self-center justify-self-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex max-h-full w-full flex-col m-5">
      <p className="text-2xl font-bold text-gray-800">
        {props.playground.title}
      </p>
      <PlaygroundTags
        service={props.playground.service}
        model={props.playground.model}
        docs={docs}
      />
      <div className="flex w-full items-center justify-center h-[400px] mt-5 bg-white rounded-2xl border border-dashed">
        {points && <Scatterplot points={points} onClick={onPointClick} />}
        <ChunksList />
      </div>
      <QueryInput />
      <div className="flex gap-3 pb-10 flex-grow w-full h-fit flex-wrap overflow-y-scroll mt-3">
        {queries.map((query) => (
          <div
            className={`p-3 h-fit rounded-lg shadow cursor-pointer ${query.id === activeQuery ? "bg-orange-400 text-gray-100" : "bg-white text-gray-900"}`}
            onClick={() =>
              setActiveQuery((prev) => {
                if (prev === query.id) {
                  return "";
                } else {
                  return query.id;
                }
              })
            }
          >
            <p className="text-sm">{query.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playground;

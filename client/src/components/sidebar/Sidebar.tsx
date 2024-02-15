import React, { useContext, useEffect } from "react";
import SidebarToggleButton from "./SidebarToggleButton";
import UIContext from "../../context/UIContext";
import { PlusIcon } from "@heroicons/react/24/solid";
import PlaygroundList from "./PlaygroundList";
import PlaygroundContext from "../../context/PlaygroundContext";
import getModels, { getPlaygrounds } from "../../api";
import useAPI from "../../hooks/useAPI";
import EmbeddingsModel from "../../models/EmbeddingsModel";
import ErrorBanner from "../../layouts/ErrorBanner";
import Spinner from "../../layouts/Spinner";
import PlaygroundModel from "../../models/PlaygroundModel";
import { useNavigate } from "react-router-dom";

const Title: React.FC = () => {
  const navigate = useNavigate();
  return (
    <p
      className="m-4 text-3xl text-white select-none cursor-pointer"
      onClick={() => navigate("/")}
    >
      <span className="text-blue-500">Embeddings</span>{" "}
      <span className="text-orange-600 font-bold">Play</span>
      <span className="text-yellow-400">ground</span>
    </p>
  );
};

const NewPlaygroundButton: React.FC = () => {
  const { sideBarCollapsed, setNewPlaygroundModalOpen } = useContext(UIContext);
  return (
    <div
      className="mx-4 mt-4 p-2 flex justify-center rounded-lg bg-gray-800 text-white cursor-pointer hover:bg-gray-700 active:bg-gray-600"
      onClick={() => setNewPlaygroundModalOpen(true)}
    >
      <PlusIcon className="w-4 h-4" />
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { sideBarCollapsed } = useContext(UIContext);
  const { setPlaygrounds } = useContext(PlaygroundContext);
  const [serverPlaygrounds, loading, error] =
    useAPI<PlaygroundModel[]>(getPlaygrounds);

  useEffect(() => {
    if (serverPlaygrounds) {
      setPlaygrounds(serverPlaygrounds);
    }
  }, [serverPlaygrounds]);

  return (
    <div className="flex-shrink-0 flex">
      <div
        className={`flex-shrink-0 transition-width ease-in-out duration-500 bg-gray-900 ${
          sideBarCollapsed ? "w-0" : "w-64"
        }`}
      >
        <div
          className={`${
            sideBarCollapsed ? "opacity-0" : "opacity-100 delay-100"
          } flex flex-col gap-5 h-full transition-opacity ease-in duration-200`}
        >
          <div className="flex-shrink-0 h-16">
            <Title />
          </div>
          <NewPlaygroundButton />
          {loading && !error && <Spinner />}
          {!loading && error && (
            <ErrorBanner message={error} className={"text-white"} />
          )}
          {!loading && !error && <PlaygroundList />}
          <div className="flex-shrink-0 h-20"></div>
        </div>
      </div>
      <SidebarToggleButton />
    </div>
  );
};

export default Sidebar;

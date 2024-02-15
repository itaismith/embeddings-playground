import React, { useContext, useEffect, useState } from "react";
import Modal from "../../layouts/Modal";
import UIContext from "../../context/UIContext";
import EmbeddingsForm from "../new-playground/EmbeddingsForm";
import NewPlaygroundModal from "../new-playground/NewPlaygroundModal";
import DocsList from "../documents/DocsList";
import { useParams } from "react-router-dom";
import PlaygroundContext from "../../context/PlaygroundContext";
import PlaygroundModel from "../../models/PlaygroundModel";
import {
  ArrowsPointingOutIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import useAPI from "../../hooks/useAPI";
import { getPlaygroundDocs } from "../../api";
import Playground from "./Playground";

const PlaygroundArea: React.FC = () => {
  const { playgroundId } = useParams();
  const { activePlayground, setActivePlayground, getPlayground, playgrounds } =
    useContext(PlaygroundContext);
  const [playground, setPlayground] = useState<PlaygroundModel>();

  useEffect(() => {
    if (playgroundId !== activePlayground) {
      setActivePlayground(playgroundId || "");
    }
  }, [playgroundId]);

  useEffect(() => {
    if (activePlayground && playgrounds) {
      setPlayground(getPlayground(activePlayground));
    }
  }, [activePlayground, playgrounds]);

  return (
    <div className="relative flex w-full max-h-full h-full">
      <NewPlaygroundModal />
      {playground && <Playground playground={playground} />}
    </div>
  );
};

export default PlaygroundArea;

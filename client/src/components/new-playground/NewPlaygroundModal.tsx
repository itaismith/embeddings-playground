import React, { useContext, useEffect, useState } from "react";
import EmbeddingsForm from "./EmbeddingsForm";
import Modal from "../../layouts/Modal";
import UIContext from "../../context/UIContext";
import Paginate from "../../layouts/Paginate";
import DocsManager from "../documents/DocsManager";
import { createNewPlayground, deleteDocument } from "../../api";
import DocumentModel from "../../models/DocumentModel";
import PlaygroundContext from "../../context/PlaygroundContext";
import { useNavigate } from "react-router-dom";

const NewPlaygroundModal: React.FC = () => {
  const { newPlaygroundModalOpen, setNewPlaygroundModalOpen, setDeletingDoc } =
    useContext(UIContext);
  const { setPlaygrounds, activePlayground, setActivePlayground } =
    useContext(PlaygroundContext);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [reset, setReset] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (newPlaygroundModalOpen && reset) {
      setReset(false);
    }
  }, [newPlaygroundModalOpen, reset]);

  const clear = () => {
    if (!newPlaygroundModalOpen) {
      setSelectedModel("");
      setSelectedDocs([]);
      setDeletingDoc("");
      setReset(true);
    }
  };

  const onDocSelect = (doc: DocumentModel) => {
    setSelectedDocs((prev) => {
      if (prev.includes(doc.id)) {
        return prev.filter((d) => d !== doc.id);
      } else {
        return [...prev, doc.id];
      }
    });
  };

  const onDocRemove = async (doc: DocumentModel) => {
    const playgroundIds = await deleteDocument(doc);
    console.log(playgroundIds);
    setSelectedDocs((prev) => prev.filter((id) => id !== doc.id));
    setPlaygrounds((prev) =>
      prev.filter((pg) => !playgroundIds.includes(pg.id)),
    );
    if (playgroundIds.includes(activePlayground)) {
      setActivePlayground("");
      navigate("/");
    }
  };

  const onSubmit = async () => {
    try {
      const newPlayground = await createNewPlayground(
        selectedModel,
        selectedDocs,
      );
      setPlaygrounds((prev) => [newPlayground, ...prev]);
      setNewPlaygroundModalOpen(false);
      navigate(`/playgrounds/${newPlayground.id}`);
    } catch (e) {}
  };

  return (
    <Modal
      open={newPlaygroundModalOpen}
      onClose={() => setNewPlaygroundModalOpen(false)}
      onTransitionEnd={clear}
    >
      <Paginate
        reset={reset}
        pages={[
          {
            content: (
              <EmbeddingsForm
                selected={selectedModel}
                onSelect={(m: string) => setSelectedModel(m)}
              />
            ),
            advance: selectedModel.length > 0,
          },
          {
            content: (
              <DocsManager
                selectedDocs={selectedDocs}
                onSelect={onDocSelect}
                onRemove={onDocRemove}
              />
            ),
            advance: selectedDocs.length > 0,
            action: onSubmit,
          },
        ]}
      />
    </Modal>
  );
};

export default NewPlaygroundModal;

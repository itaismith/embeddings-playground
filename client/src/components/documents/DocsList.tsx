import React, { useContext, useEffect, useState } from "react";
import { useTransition, animated } from "react-spring";
import {
  ArrowDownTrayIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import UIContext from "../../context/UIContext";
import DocumentModel from "../../models/DocumentModel";
import { downloadDocument } from "../../api";
import Spinner from "../../layouts/Spinner";

const Document: React.FC<{
  doc: DocumentModel;
  selected: boolean;
  onClick?: (doc: DocumentModel) => void;
  onRemove: () => void;
}> = (props) => {
  const { deletingDoc, setDeletingDoc, downloadingDoc, setDownloadingDoc } =
    useContext(UIContext);

  const handleSelect = () => {
    setDeletingDoc("");
    if (props.onClick) {
      props.onClick(props.doc);
    }
  };

  const handleDownload = async () => {
    setDownloadingDoc(props.doc.id);
    await downloadDocument(props.doc);
    setDownloadingDoc("");
  };

  const handleDelete = () => {
    setDeletingDoc("");
    props.onRemove();
  };

  return (
    <div
      className={`flex justify-between items-center w-full rounded-lg p-2 px-4 shadow cursor-pointer ${props.selected ? "bg-orange-400 text-white" : "bg-white text-gray-900"}`}
    >
      <div
        className="whitespace-nowrap overflow-hidden flex-grow"
        onClick={handleSelect}
      >
        <p className="text-sm select-none">{props.doc.name}</p>
      </div>
      <div
        className={`flex flex-shrink-0 gap-2 ml-2 ${props.selected ? "text-gray-300" : "text-gray-500"}`}
      >
        {deletingDoc !== props.doc.name && (
          <>
            {downloadingDoc !== props.doc.id && (
              <ArrowDownTrayIcon
                className={`w-4 h-4 ${props.selected ? "hover:text-white" : "hover:text-gray-900"}`}
                onClick={handleDownload}
              />
            )}
            {downloadingDoc === props.doc.id && <Spinner className="w-3 h-3" />}
            <TrashIcon
              className={`w-4 h-4 ${props.selected ? "hover:text-white" : "hover:text-gray-900"}`}
              onClick={() => setDeletingDoc(props.doc.name)}
            />
          </>
        )}
        {deletingDoc === props.doc.name && (
          <>
            <CheckIcon
              className={`w-4 h-4 ${props.selected ? "hover:text-white" : "hover:text-gray-900"}`}
              onClick={handleDelete}
            />
            <XMarkIcon
              className={`w-4 h-4 ${props.selected ? "hover:text-white" : "hover:text-gray-900"}`}
              onClick={() => setDeletingDoc("")}
            />
          </>
        )}
      </div>
    </div>
  );
};

const DocsList: React.FC<{
  docs: DocumentModel[];
  onRemove: (doc: DocumentModel) => void;
  selected?: string[];
  onSelect?: (doc: DocumentModel) => void;
}> = (props) => {
  const height = 17;

  const transitions = useTransition<DocumentModel, { y: number }>(
    props.docs.map((doc, i) => ({ ...doc, y: i * height })),
    {
      keys: (doc: { name: string }) => doc.name,
      from: { height, opacity: 0 },
      leave: { height: 0, opacity: 0 },
      enter: ({ y }: { y: number }) => ({
        delay: 200,
        y,
        opacity: 1,
      }),
      update: ({ y }: { y: number }) => ({ delay: 100, y }),
      config: {
        duration: 250,
      },
    },
  );

  return (
    <div className="w-full h-full overflow-y-scroll scroll-smooth">
      {transitions((style, doc) => {
        return (
          <animated.div
            key={doc.name}
            style={{
              transform: style.y.to((y) => `translate3d(0,${y}px,0)`),
              ...style,
            }}
          >
            {doc.name !== "empty" && (
              <Document
                doc={doc}
                selected={props.selected?.includes(doc.id) || false}
                onClick={props.onSelect}
                onRemove={() => props.onRemove(doc)}
              />
            )}
          </animated.div>
        );
      })}
    </div>
  );
};

export default DocsList;

import React, { useContext, useEffect, useRef, useState } from "react";
import PlaygroundModel from "../../models/PlaygroundModel";
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import UIContext from "../../context/UIContext";
import PlaygroundContext from "../../context/PlaygroundContext";
import { useNavigate, useParams } from "react-router-dom";
import { deletePlayground, renamePlayground } from "../../api";
import { TypeAnimation } from "react-type-animation";

const PlaygroundButton: React.FC<{ playground: PlaygroundModel }> = (props) => {
  const {
    renamingPlayground,
    setRenamingPlayground,
    deletingPlayground,
    setDeletingPlayground,
    showPlaygroundButtonMenu,
    setShowPlaygroundButtonMenu,
  } = useContext(UIContext);
  const { activePlayground, setActivePlayground, setPlaygrounds } =
    useContext(PlaygroundContext);
  const [title, setTitle] = useState<string>(props.playground.title);
  const [animate, setAnimate] = useState<string>("");
  const navigate = useNavigate();
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingPlayground === props.playground.id && renameRef.current) {
      renameRef.current.focus();
    }
  }, [renamingPlayground]);

  // useEffect(() => {
  //   if (
  //     activePlayground === props.playground.id &&
  //     playgrounds.length > 1 &&
  //     title === "New Playground"
  //   ) {
  //     getChatTitle(props.chat.id, messages[0].content)
  //       .then((t) => setAnimate(t))
  //       .catch((e) => {});
  //   }
  // }, [messages]);

  const handleRenameEnter = () => {
    setShowPlaygroundButtonMenu("");
    setRenamingPlayground(props.playground.id);
  };

  const handleRenameExit = async () => {
    if (renameRef.current) {
      const newTitle = renameRef.current.value;
      setTitle(newTitle);
      setPlaygrounds((prev) => {
        const pg = prev.find((pg) => pg.id === props.playground.id);
        if (pg) {
          pg.title = newTitle;
          return [...prev];
        } else {
          return prev;
        }
      });
      setRenamingPlayground("");
      await renamePlayground(props.playground, newTitle);
    }
  };

  const handleClick = () => {
    setActivePlayground(props.playground.id);
    navigate(`/playgrounds/${props.playground.id}`);
  };

  const handleDelete = async () => {
    setDeletingPlayground("");
    setShowPlaygroundButtonMenu("");
    navigate("/");
    await deletePlayground(props.playground);
    setPlaygrounds((prev) => prev.filter((p) => p.id !== props.playground.id));
  };

  return (
    <div
      className={`absolute group mx-4 flex flex-shrink-0 w-56 justify-between p-2 my-1 rounded-lg text-gray-200 text-sm select-none cursor-pointer hover:bg-gray-800 whitespace-nowrap ${
        activePlayground === props.playground.id &&
        "bg-gray-700 hover:bg-gray-700"
      }`}
      onClick={handleClick}
    >
      {activePlayground === props.playground.id && animate ? (
        <div className="overflow-x-hidden">
          <TypeAnimation
            sequence={[
              `${animate}`,
              () => {
                setAnimate((prev) => {
                  setTitle(prev);
                  return "";
                });
              },
            ]}
            wrapper="span"
            cursor={true}
            repeat={0}
            speed={40}
            style={{ fontSize: "0.875rem", display: "inline-block" }}
          />
        </div>
      ) : renamingPlayground !== props.playground.id ? (
        <div className="overflow-x-hidden">{title}</div>
      ) : (
        <input
          className="w-[80%] bg-transparent"
          defaultValue={title}
          ref={renameRef}
          onBlur={handleRenameExit}
        />
      )}
      {activePlayground !== props.playground.id ? (
        <div className="absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-gray-900 from-10% to-transparent rounded-r-lg group-hover:from-gray-800" />
      ) : (
        <div className="absolute flex justify-end items-center  top-0 right-0 h-full w-16 bg-gradient-to-l from-gray-700 from-50% to-transparent rounded-r-lg group-hover:from-gray-800">
          <EllipsisHorizontalIcon
            className="w-5 h-5 mr-2 text-gray-200"
            onClick={() =>
              setShowPlaygroundButtonMenu((prev) =>
                prev ? "" : props.playground.id,
              )
            }
          />
        </div>
      )}
      {showPlaygroundButtonMenu === props.playground.id && (
        <div className="absolute flex flex-col gap-3 p-4 h-20 rounded-xl z-20 right-0 top-9 bg-gray-900">
          <div
            className="flex items-center justify-start gap-2 text-gray-200 text-xs cursor-pointer"
            onClick={handleRenameEnter}
          >
            <PencilIcon className="w-5 h-5" />
            <p>Rename</p>
          </div>
          {deletingPlayground !== props.playground.id && (
            <div
              className="flex items-center justify-start gap-2 text-red-500 text-xs cursor-pointer"
              onClick={() => setDeletingPlayground(props.playground.id)}
            >
              <TrashIcon className="w-5 h-5" />
              <p>Delete</p>
            </div>
          )}
          {deletingPlayground === props.playground.id && (
            <div className="flex items-center justify-center gap-2 cursor-pointer">
              <div
                className="p-1 rounded-lg border border-gray-400 hover:border-gray-300"
                onClick={handleDelete}
              >
                <CheckIcon className="w-3 h-3 text-red-500" />
              </div>
              <div
                className="p-1 rounded-lg border border-gray-400 hover:border-gray-300"
                onClick={() => setDeletingPlayground("")}
              >
                <XMarkIcon className="w-3 h-3 text-gray-300" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaygroundButton;

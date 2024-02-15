import React, { useContext, useRef, useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import Spinner from "../../layouts/Spinner";
import PlaygroundContext from "../../context/PlaygroundContext";
import { submitQuery } from "../../api";

const SendButton: React.FC<{
  enabled: boolean;
  onClick: () => void;
  loading: boolean;
}> = (props) => {
  const enabledStyle: string =
    "bg-orange-400 text-white hover:bg-orange-500 active:bg-orange-600";
  const disabledStyle: string =
    "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400";

  return (
    <div
      className={`flex items-center justify-center p-2 rounded-lg cursor-pointer ${props.enabled ? enabledStyle : disabledStyle}`}
      onClick={props.onClick}
    >
      {!props.loading && <ArrowRightIcon className="w-4 h-4" />}
      {props.loading && <Spinner className="w-4 h-4" />}
    </div>
  );
};

const QueryInput: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasInput, setHasInput] = useState<boolean>(false);
  const [loadingSubmission, setLoadingSubmission] = useState<boolean>(false);
  const { activePlayground, setActiveQuery, setQueries } =
    useContext(PlaygroundContext);

  const changeHandler = () => {
    if (inputRef) {
      setHasInput(inputRef.current!.value.length > 0);
    }
  };

  const submitHandler = async () => {
    if (!hasInput || !inputRef || loadingSubmission) {
      return;
    }
    setLoadingSubmission(true);
    try {
      const query = await submitQuery(
        activePlayground,
        inputRef.current!.value,
      );
      setActiveQuery(query.id);
      setQueries((prev) => [query, ...prev]);
    } catch (e) {}
    inputRef.current!.value = "";
    setLoadingSubmission(false);
  };

  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await submitHandler();
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 w-full">
      <div className="px-4 py-2 rounded-lg bg-white flex-grow shadow select-none cursor-text">
        <input
          className="w-full bg-transparent outline-none"
          ref={inputRef}
          placeholder={"Submit your query"}
          onChange={changeHandler}
          onKeyDown={handleKeyDown}
        />
      </div>
      <SendButton
        enabled={hasInput}
        onClick={submitHandler}
        loading={loadingSubmission}
      />
    </div>
  );
};

export default QueryInput;

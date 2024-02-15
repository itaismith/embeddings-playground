import React, { FormEvent, useEffect, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import EmbeddingsModel from "../../models/EmbeddingsModel";
import useAPI from "../../hooks/useAPI";
import getModels from "../../api";
import ErrorBanner from "../../layouts/ErrorBanner";
import Spinner from "../../layouts/Spinner";

const FormOption: React.FC<{
  selected: boolean;
  model: EmbeddingsModel;
  onClick: (e: string) => void;
}> = (props) => {
  return (
    <label
      htmlFor={props.model.service}
      className={`flex items-center w-full h-16 p-3 shadow rounded-lg text-gray-900 cursor-pointer ${props.selected ? "bg-orange-400" : "bg-white"}`}
    >
      <input
        id={props.model.service}
        type="radio"
        name="options"
        value={props.model.service}
        checked={props.selected}
        onChange={(e) => {
          if (!props.model.apiKey) {
            props.onClick(e.target.value);
          }
        }}
        className="appearance-none"
      />
      <div className="flex w-full justify-between items-center">
        <div
          className={
            props.selected
              ? "text-white"
              : props.model.apiKey
                ? "text-gray-500"
                : ""
          }
        >
          <p className="text-sm font-semibold select-none">
            {props.model.service}
          </p>
          <p className="text-xs font-mono select-none">{props.model.model}</p>
        </div>
        {props.selected && (
          <div className="mr-2">
            <CheckCircleIcon className="w-7 h-7 rounded-full text-orange-200" />
          </div>
        )}
        {props.model.apiKey && (
          <p className="text-xs text-gray-500 select-none">API Key Needed</p>
        )}
      </div>
    </label>
  );
};

const EmbeddingsForm: React.FC<{
  selected: string;
  onSelect: (m: string) => void;
}> = (props) => {
  const [models, loading, error] = useAPI<EmbeddingsModel[]>(getModels);

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col py-2 space-y-4">
      <p className="mb-2 text-xl font-semibold">Select you embeddings model</p>
      {models?.map((model, index) => (
        <FormOption
          selected={props.selected === model.service}
          model={model}
          onClick={() => props.onSelect(model.service)}
          key={index}
        />
      ))}
    </div>
  );
};

export default EmbeddingsForm;

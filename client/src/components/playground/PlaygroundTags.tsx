import React from "react";
import {
  ArrowsPointingOutIcon,
  DocumentIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const Tag: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div
      className={`flex gap-1 p-1.5 justify-center items-center rounded-lg border ${props.className}`}
    >
      {props.children}
    </div>
  );
};

const PlaygroundTags: React.FC<{
  service: string;
  model: string;
  docs: string[] | null;
}> = (props) => {
  return (
    <div className="flex flex-wrap mt-3 gap-2 select-none">
      <Tag className="bg-blue-500/20 border-blue-600 text-blue-600">
        <ArrowsPointingOutIcon className="w-3 h-3" />
        <p className="text-xs">{props.service}</p>
      </Tag>
      <Tag className="bg-orange-500/20 border-orange-600 text-orange-600">
        <RocketLaunchIcon className="w-3 h-3" />
        <p className="text-xs">{props.model}</p>
      </Tag>
      {props.docs?.map((doc, index) => (
        <Tag
          className="bg-yellow-500/20 border-yellow-600 text-yellow-600"
          key={index}
        >
          <DocumentIcon className="w-3 h-3" />
          <p className="text-xs">{doc}</p>
        </Tag>
      ))}
    </div>
  );
};

export default PlaygroundTags;

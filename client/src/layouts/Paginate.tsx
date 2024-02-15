import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import Spinner from "./Spinner";

const ModalButton: React.FC<{
  children?: React.ReactNode;
  onClick: () => void;
  className?: string;
  active: boolean;
}> = (props) => {
  const activeStyle: string =
    "bg-orange-200 hover:bg-orange-300 active:bg-orange-400";
  const disabledStyle: string =
    "bg-gray-300 hover:bg-gray-200 active:bg-gray-400";

  return (
    <div
      className={`flex items-center justify-center p-2 rounded-lg cursor-pointer ${props.active ? activeStyle : disabledStyle} ${props.className}`}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
};

const SlidingPage: React.FC<{
  index: number;
  current: number;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div
      className={`absolute inset-0 w-full transform transition-all duration-500 ease-in-out 
      ${props.index === props.current ? "opacity-100 translate-x-0" : props.index < props.current ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full"}`}
    >
      {props.children}
    </div>
  );
};

export interface PaginatePage {
  content: React.ReactNode;
  advance: boolean;
  action?: () => void | Promise<any>;
}

const Paginate: React.FC<{ pages: PaginatePage[]; reset?: boolean }> = (
  props,
) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [canAdvance, setCanAdvance] = useState<boolean>(
    props.pages.length > 0 ? props.pages[0]?.advance : true,
  );
  const [loadAction, setLoadAction] = useState<boolean>(false);

  const numPages = props.pages.length;

  useEffect(() => {
    setCanAdvance(props.pages[currentPage].advance);
  }, [currentPage, props.pages]);

  useEffect(() => {
    if (props.reset) {
      setCurrentPage(0);
    }
  }, [props.reset]);

  const nextPage = () => {
    if (canAdvance) {
      if (props.pages[currentPage].action !== undefined) {
        setLoadAction(true);
        const result = Promise.resolve(props.pages[currentPage].action!());
        result
          .then(() => setLoadAction(false))
          .catch(() => {})
          .finally(() => setLoadAction(false));
      }
      setCurrentPage((prev) => Math.min(currentPage + 1, numPages - 1));
    }
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(currentPage - 1, 0));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-grow">
        {props.pages.map((page, index) => (
          <SlidingPage key={index} current={currentPage} index={index}>
            {page.content}
          </SlidingPage>
        ))}
      </div>
      <div className="flex mb-5 w-full justify-self-end items-center">
        {currentPage > 0 && (
          <ModalButton
            onClick={prevPage}
            active={true}
            className="justify-self-start"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </ModalButton>
        )}
        <div className="flex-grow" />
        <ModalButton
          onClick={nextPage}
          active={canAdvance}
          className="justify-self-end"
        >
          {!loadAction && <ArrowRightIcon className="w-4 h-4" />}
          {loadAction && <Spinner className="w-3 h-3" />}
        </ModalButton>
      </div>
    </div>
  );
};

export default Paginate;

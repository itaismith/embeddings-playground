import React, { useEffect, useState } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import Overlay from "./Overlay";

export interface ModalProps {
  children?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  onTransitionEnd?: () => void;
}

const Modal: React.FC<ModalProps> = (props) => {
  return (
    <>
      {props.open && <Overlay onClick={props.onClose} />}
      <div
        className={`absolute z-30 w-[400px] h-[500px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-gray-100 rounded-lg shadow ${props.open ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}
        onTransitionEnd={props.onTransitionEnd}
      >
        <div className="flex justify-end">
          <XCircleIcon
            className="w-5 h-5 cursor-pointer"
            onClick={props.onClose}
          />
        </div>
        <div className="relative flex flex-col h-full justify-between mx-2 overflow-hidden">
          {props.children}
        </div>
      </div>
    </>
  );
};

export default Modal;

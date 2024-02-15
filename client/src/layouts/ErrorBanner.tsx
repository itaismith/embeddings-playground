import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const ErrorBanner: React.FC<{ message: string; className?: string }> = (
  props,
) => {
  return (
    <div
      className={`flex flex-col w-full justify-center items-center text-gray-800 ${props.className}`}
    >
      <ExclamationTriangleIcon className="w-7 h-7" />
      <p>{props.message}</p>
    </div>
  );
};

export default ErrorBanner;

import React, { useCallback, useState } from "react";
import Spinner from "../../layouts/Spinner";

const FileDrop: React.FC<{
  onDrop: (files: FileList) => void;
  error?: string;
  loading?: boolean;
}> = (props) => {
  const [dragging, setDragging] = useState(false);

  const handleDragIn = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        props.onDrop(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [props.onDrop],
  );

  return (
    <div
      className={`flex justify-center items-center border-2 border-dashed rounded-lg w-full h-52 ${dragging ? "border-orange-500 bg-orange-100" : "border-gray-300"}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!props.loading && (
        <div>
          <p className="text-center text-gray-500 select-none">Drag and drop</p>
          <p className="text-center text-red-500 text-xs select-none">
            {props.error}
          </p>
        </div>
      )}
      {props.loading && <Spinner />}
    </div>
  );
};

export default FileDrop;

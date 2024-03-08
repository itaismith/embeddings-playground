import React from "react";

const Overlay: React.FC<{ onClick: () => void; className?: string }> = (
  props,
) => {
  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-transparent z-10 ${props.className}`}
      onClick={props.onClick}
    />
  );
};

export default Overlay;

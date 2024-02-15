import React from "react";

const Overlay: React.FC<{ onClick: () => void }> = (props) => {
  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-transparent"
      onClick={props.onClick}
    />
  );
};

export default Overlay;

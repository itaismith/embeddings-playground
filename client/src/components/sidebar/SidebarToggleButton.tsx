import React, { useContext, useState } from "react";
import UIContext from "../../context/UIContext";

const LeftChevron: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
      className="w-5 h-5 text-inherit"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.75 19.5 10.25 12l3.5-7.5"
      />
    </svg>
  );
};

const RightChevron: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
      className="w-5 h-5 text-inherit"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 5.25 7.5-5.25 7.5"
      />
    </svg>
  );
};

const Pointy: React.FC<{ className?: string }> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`w-3 h-3 text-gray-900 ${props.className}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5 8.25 12 15.75 4.5 15.75 19.5"
        fill="currentColor"
      />
    </svg>
  );
};

const Banner: React.FC<{ collapsed: boolean }> = (props) => {
  return (
    <>
      <div className="absolute z-20 top-1/2 left-9 transform -translate-y-1/2 w-24 h-8 p-2 rounded bg-gray-900 text-center">
        <p className="text-gray-200 text-xs select-none">
          {props.collapsed ? "Open Sidebar" : "Close Sidebar"}
        </p>
      </div>
      <Pointy className="absolute top-1/2 left-7 transform -translate-y-1/2 text-gray-900" />
    </>
  );
};

const SidebarToggleButton: React.FC = () => {
  const { sideBarCollapsed, setSideBarCollapsed } = useContext(UIContext);
  const [activeHover, setActiveHover] = useState<boolean>(false);
  return (
    <div
      className="relative self-center py-3 pr-0.5 text-gray-400 hover:text-gray-300 cursor-pointer"
      onMouseOver={() => setActiveHover(true)}
      onMouseLeave={() => setActiveHover(false)}
      onClick={() => setSideBarCollapsed((prev) => !prev)}
    >
      {activeHover && <Banner collapsed={sideBarCollapsed} />}
      {sideBarCollapsed && <RightChevron />}
      {!sideBarCollapsed && <LeftChevron />}
    </div>
  );
};

export default SidebarToggleButton;

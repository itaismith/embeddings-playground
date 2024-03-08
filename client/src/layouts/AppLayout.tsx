import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import UIContext from "../context/UIContext";
import Overlay from "./Overlay";

const AppLayout: React.FC = () => {
  const { showPlaygroundButtonMenu, setShowPlaygroundButtonMenu } =
    useContext(UIContext);
  return (
    <div className="relative flex h-screen bg-amber-50">
      {showPlaygroundButtonMenu && (
        <Overlay onClick={() => setShowPlaygroundButtonMenu("")} />
      )}
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default AppLayout;

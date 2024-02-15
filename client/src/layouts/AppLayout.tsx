import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";

const AppLayout: React.FC = () => {
  return (
    <div className="relative flex h-screen bg-amber-50">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default AppLayout;

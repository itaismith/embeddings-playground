import React, { ReactNode, useEffect, useState } from "react";

export interface UIContextValue {
  sideBarCollapsed: boolean;
  setSideBarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  newPlaygroundModalOpen: boolean;
  setNewPlaygroundModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deletingDoc: string;
  setDeletingDoc: React.Dispatch<React.SetStateAction<string>>;
  downloadingDoc: string;
  setDownloadingDoc: React.Dispatch<React.SetStateAction<string>>;
  deletingPlayground: string;
  setDeletingPlayground: React.Dispatch<React.SetStateAction<string>>;
  renamingPlayground: string;
  setRenamingPlayground: React.Dispatch<React.SetStateAction<string>>;
  showPlaygroundButtonMenu: string;
  setShowPlaygroundButtonMenu: React.Dispatch<React.SetStateAction<string>>;
}

export interface UIContextProviderProps {
  children?: ReactNode;
}

const UIContextDefaultValue = {
  sideBarCollapsed: false,
  setSideBarCollapsed: () => {},
  newPlaygroundModalOpen: false,
  setNewPlaygroundModalOpen: () => {},
  deletingDoc: "",
  setDeletingDoc: () => {},
  downloadingDoc: "",
  setDownloadingDoc: () => {},
  deletingPlayground: "",
  setDeletingPlayground: () => {},
  renamingPlayground: "",
  setRenamingPlayground: () => {},
  showPlaygroundButtonMenu: "",
  setShowPlaygroundButtonMenu: () => {},
};

const UIContext = React.createContext<UIContextValue>(UIContextDefaultValue);

export const UIContextProvider: React.FC<UIContextProviderProps> = (props) => {
  const [sideBarCollapsed, setSideBarCollapsed] = useState<boolean>(false);
  const [newPlaygroundModalOpen, setNewPlaygroundModalOpen] =
    useState<boolean>(false);
  const [deletingDoc, setDeletingDoc] = useState<string>("");
  const [downloadingDoc, setDownloadingDoc] = useState<string>("");
  const [renamingPlayground, setRenamingPlayground] = useState<string>("");
  const [deletingPlayground, setDeletingPlayground] = useState<string>("");
  const [showPlaygroundButtonMenu, setShowPlaygroundButtonMenu] =
    useState<string>("");

  return (
    <UIContext.Provider
      value={{
        sideBarCollapsed,
        setSideBarCollapsed,
        newPlaygroundModalOpen,
        setNewPlaygroundModalOpen,
        deletingDoc,
        setDeletingDoc,
        downloadingDoc,
        setDownloadingDoc,
        deletingPlayground,
        setDeletingPlayground,
        renamingPlayground,
        setRenamingPlayground,
        showPlaygroundButtonMenu,
        setShowPlaygroundButtonMenu,
      }}
    >
      {props.children}
    </UIContext.Provider>
  );
};

export default UIContext;

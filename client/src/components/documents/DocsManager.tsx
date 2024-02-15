import React, { useEffect, useState } from "react";
import FileDrop from "./FileDrop";
import DocsList from "./DocsList";
import useAPI from "../../hooks/useAPI";
import { downloadDocument, getDocs, uploadDocument } from "../../api";
import ErrorBanner from "../../layouts/ErrorBanner";
import Spinner from "../../layouts/Spinner";
import DocumentModel from "../../models/DocumentModel";

const DocsManager: React.FC<{
  selectedDocs: string[];
  onSelect?: (doc: DocumentModel) => void;
  onRemove?: (doc: DocumentModel) => void;
}> = (props) => {
  const [serverDocs, loading, error] = useAPI<DocumentModel[]>(getDocs);
  const [docs, setDocs] = useState<DocumentModel[]>([]);
  const [fileDropError, setFileDropError] = useState<string>("");
  const [fileDropLoading, setFileDropLoading] = useState<boolean>(false);

  useEffect(() => {
    if (docs.length === 0 && serverDocs) {
      setDocs([...serverDocs, { id: "empty", name: "empty" }]);
    }
  }, [serverDocs]);

  const onDrop = (files: FileList) => {
    if (loading || fileDropLoading) {
      return;
    }

    setFileDropError("");

    const fileList = Array.from(files);

    for (const file of fileList) {
      if (docs.filter((doc) => doc.name === file.name).length > 0) {
        setFileDropError(`File ${file.name} already exists`);
        return;
      }
    }

    setFileDropLoading(true);

    const uploadRequests = fileList.map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadDocument(formData).then((res) =>
        setDocs((prev) => [res, ...prev]),
      );
    });

    Promise.all(uploadRequests)
      .catch((e) => setFileDropError("Failed to upload some files"))
      .finally(() => setFileDropLoading(false));
  };

  const onRemove = (removed: DocumentModel) => {
    setDocs((prev) => prev.filter((doc) => doc.id !== removed.id));
    if (props.onRemove !== undefined) {
      props.onRemove(removed);
    }
  };

  if (error) {
    return <ErrorBanner message={error} />;
  }

  return (
    <div className="flex flex-col h-full pt-2 pb-4 space-y-4">
      <p className="mb-2 text-xl font-semibold">Select you documents</p>
      <FileDrop
        onDrop={onDrop}
        error={fileDropError}
        loading={fileDropLoading}
      />
      {loading && <Spinner />}
      {!loading && (
        <DocsList
          onRemove={onRemove}
          docs={docs}
          selected={props.selectedDocs}
          onSelect={props.onSelect}
        />
      )}
    </div>
  );
};

export default DocsManager;

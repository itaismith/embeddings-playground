import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { UIContextProvider } from "./context/UIContext";
import { PlaygroundContextProvider } from "./context/PlaygroundContext";
import PlaygroundArea from "./components/playground/PlaygroundArea";

function App() {
  useEffect(() => {
    document.body.classList.add("overscroll-none");
  }, []);

  return (
    <BrowserRouter>
      <UIContextProvider>
        <PlaygroundContextProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<PlaygroundArea />} />
              <Route
                path="/playgrounds/:playgroundId"
                element={<PlaygroundArea />}
              />
            </Route>
          </Routes>
        </PlaygroundContextProvider>
      </UIContextProvider>
    </BrowserRouter>
  );
}

export default App;

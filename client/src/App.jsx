import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import SelectDateTime from "./pages/SelectDateTime";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:username/meeting" element={<SelectDateTime />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

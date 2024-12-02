

import React  from "react"; 
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./pages/Layout";
import Home from "./pages/home";
import Planning from "./pages/planning";
import Accounts from "./pages/accounts";
import Test from "./pages/test";
import NoPage from "./pages/NoPage";





export default function App2() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="home"  element={<Home />} />
          <Route path="planning"  element={<Planning />} />
          <Route path="mapeditor"  element={<Planning />} />
          <Route path="accounts"  element={<Accounts />} />
          <Route path="test"  element={<Test />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App2 />);
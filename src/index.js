

import React  from "react"; 
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";


import { I18nextProvider } from 'react-i18next';
import i18n from './js/i18n';

import Layout from "./pages/Layout";
import Home from "./pages/home";
import Planning from "./pages/planning";
import Accounts from "./pages/accounts";
import NoPage from "./pages/NoPage";
import GamePadTesterPage from "./pages/gamepadTester";
import DebugPage from "./pages/debug";




export default function App2() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="index.html"  element={<Home />} />
          <Route path="index"  element={<Home />} />
          <Route path="home"  element={<Home />} />
          <Route path="webclient"  element={<Home />} />
          <Route path="planner"  element={<Planning />} />
          <Route path="planning"  element={<Planning />} />
          <Route path="mapeditor"  element={<Planning />} />
          <Route path="accounts"  element={<Accounts />} />
          <Route path="gamepad"  element={<GamePadTesterPage />} />
          <Route path="debug"  element={<DebugPage />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <I18nextProvider i18n={i18n}>
    <App2 />  
  </I18nextProvider>
);

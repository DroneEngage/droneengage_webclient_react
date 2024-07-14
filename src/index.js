
import React , { useEffect } from "react"; 
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/home";
import Planning from "./pages/Planning";
import NoPage from "./pages/NoPage";
import {fn_on_ready} from './js/js_main'


import './css/css_styles.css';
import './css/css_styles2.css';



export default function App() {

  useEffect(() => {
    fn_on_ready();
  }
  );
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="planning"  element={<Planning />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
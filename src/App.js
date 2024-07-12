import React from 'react';
import ReactDOM from "react-dom/client";

import logo from './logo.svg';
import './css/App.css';

import { CFieldChecked } from './jsc_module_1';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
          <CFieldChecked></CFieldChecked>
        </a>
      </header>
    </div>
  );
}

export default App;

import React from 'react';

import { Outlet, Link } from "react-router-dom";
import {CLSS_HeaderControl} from '../components/jsc_header'
const Layout = () => {
  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="planning">Planning</Link>
          </li>
        </ul>
      </nav>

      <Outlet />
    </>
  )
};

export default Layout;

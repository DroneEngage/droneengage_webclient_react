import { fn_loadConfig } from './js/js_siteConfig.js';


async function fn_startApp() {

  await fn_loadConfig();

  const React = (await import('react')).default;
  const ReactDOM = await import('react-dom/client');
  const { BrowserRouter, Routes, Route } = await import('react-router-dom');
  const { I18nextProvider } = await import('react-i18next');
  const i18n = (await import('./js/i18n')).default;

  const Layout = (await import('./pages/Layout')).default;
  const Home = (await import('./pages/home')).default;
  const Planning = (await import('./pages/planning')).default;
  const Accounts = (await import('./pages/accounts')).default;
  const NoPage = (await import('./pages/NoPage')).default;
  const GamePadTesterPage = (await import('./pages/gamepadTester')).default;
  const DebugPage = (await import('./pages/debug')).default;
  const { ThemeProvider } = await import('./js/js_theme_context');


  function App2() {

    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="index.html" element={<Home />} />
            <Route path="index" element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="webclient" element={<Home />} />
            <Route path="planner" element={<Planning />} />
            <Route path="planning" element={<Planning />} />
            <Route path="mapeditor" element={<Planning />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="gamepad" element={<GamePadTesterPage />} />
            <Route path="debug" element={<DebugPage />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }


  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <App2 />
      </ThemeProvider>
    </I18nextProvider>
  );
}


fn_startApp();

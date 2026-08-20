import { fn_loadConfig } from './js/js_siteConfig.js';


// Detects mobile browsers (phone or tablet) so we can route them to the
// mobile login/page by default instead of the desktop home page.
// iPadOS 13+ reports as Macintosh in `platform` but still has MacIntel +
// multi-touch, so we fall back to a touch + MacIntel check for it.
function fn_isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  // iPadOS 13+ spoofing: Macintosh platform with touch support
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
}


async function fn_startApp() {

  await fn_loadConfig();

  const React = (await import('react')).default;
  const ReactDOM = await import('react-dom/client');
  const { BrowserRouter, Routes, Route, Navigate } = await import('react-router-dom');
  const { I18nextProvider } = await import('react-i18next');
  const i18n = (await import('./js/i18n')).default;

  const Layout = (await import('./pages/Layout')).default;
  const Home = (await import('./pages/home')).default;
  const Planning = (await import('./pages/planning')).default;
  const Accounts = (await import('./pages/accounts')).default;
  const NoPage = (await import('./pages/NoPage')).default;
  const GamePadTesterPage = (await import('./pages/gamepadTester')).default;
  const DebugPage = (await import('./pages/debug')).default;
  const Mobile = (await import('./pages/mobile')).default;
  const { ThemeProvider } = await import('./js/js_theme_context');


  // Index route: send mobile devices to /mobile, everyone else to Home.
  const IndexRoute = () => {
    if (fn_isMobileDevice()) {
      return <Navigate to="/mobile" replace />;
    }
    return <Home />;
  };


  function App2() {

    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<IndexRoute />} />
            <Route path="index.html" element={<IndexRoute />} />
            <Route path="index" element={<IndexRoute />} />
            <Route path="home" element={<Home />} />
            <Route path="webclient" element={<Home />} />
            <Route path="planner" element={<Planning />} />
            <Route path="planning" element={<Planning />} />
            <Route path="mapeditor" element={<Planning />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="gamepad" element={<GamePadTesterPage />} />
            <Route path="debug" element={<DebugPage />} />
            <Route path="mobile" element={<Mobile />} />
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

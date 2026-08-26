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


// Simple full-screen spinner shown by <Suspense> while a lazy page chunk is
// downloading. Mirrors the #initial-loader placeholder in public/index.html so
// the transition from pre-React loader to React Suspense fallback is seamless.
function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#222', color: '#cfd8e3',
      fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid rgba(255,255,255,0.2)',
          borderTopColor: '#4db8ff',
          borderRadius: '50%',
          margin: '0 auto 12px',
          animation: 'de-spin 0.9s linear infinite',
        }} />
        <div style={{ fontSize: 14, letterSpacing: '0.04em' }}>
          DroneEngage WebClient
        </div>
      </div>
    </div>
  );
}


async function fn_startApp() {

  // Load runtime config first. The #initial-loader placeholder in
  // public/index.html is visible during this await, so the user sees a
  // spinner instead of a blank screen.
  await fn_loadConfig();

  const React = (await import('react')).default;
  const ReactDOM = await import('react-dom/client');
  const { BrowserRouter, Routes, Route, Navigate } = await import('react-router-dom');
  const { I18nextProvider } = await import('react-i18next');
  const i18n = (await import('./js/i18n')).default;
  const { Suspense, lazy } = React;

  // Pages are lazy-loaded: only the chunk for the page being visited is
  // downloaded. <Suspense fallback={<PageLoader/>}> shows the spinner while
  // a chunk loads on navigation. This is what makes home/planning/mobile
  // feel fast on first visit — the other pages' bundles are no longer
  // downloaded upfront.
  const Layout = lazy(() => import('./pages/Layout').then(m => ({ default: m.default })));
  const Home = lazy(() => import('./pages/home').then(m => ({ default: m.default })));
  const Planning = lazy(() => import('./pages/planning').then(m => ({ default: m.default })));
  const Accounts = lazy(() => import('./pages/accounts').then(m => ({ default: m.default })));
  const NoPage = lazy(() => import('./pages/NoPage').then(m => ({ default: m.default })));
  const GamePadTesterPage = lazy(() => import('./pages/gamepadTester').then(m => ({ default: m.default })));
  const DebugPage = lazy(() => import('./pages/debug').then(m => ({ default: m.default })));
  const Mobile = lazy(() => import('./pages/mobile').then(m => ({ default: m.default })));
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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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

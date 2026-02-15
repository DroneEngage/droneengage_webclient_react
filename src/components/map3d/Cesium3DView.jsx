import React, { useEffect, useRef, useState } from 'react';

import {
  CONST_CESIUM_CSS_URL,
  CONST_CESIUM_ION_TOKEN,
  CONST_CESIUM_SCRIPT_URL
} from '../../js/js_siteConfig';

const CESIUM_SCRIPT_ID = 'de-cesium-script';
const CESIUM_STYLE_ID = 'de-cesium-style';

function fn_loadStyle(url) {
  if (!url) return;
  if (document.getElementById(CESIUM_STYLE_ID)) return;

  const link = document.createElement('link');
  link.id = CESIUM_STYLE_ID;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

function fn_loadScript(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing Cesium script URL'));
      return;
    }

    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    const existing = document.getElementById(CESIUM_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cesium), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Cesium script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = CESIUM_SCRIPT_ID;
    script.src = url;
    script.async = true;
    script.onload = () => resolve(window.Cesium);
    script.onerror = () => reject(new Error('Unable to load Cesium script'));
    document.body.appendChild(script);
  });
}

const Cesium3DView = ({ className = '' }) => {
  const mapRef = useRef(null);
  const viewerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fn_init = async () => {
      try {
        fn_loadStyle(CONST_CESIUM_CSS_URL);
        const Cesium = await fn_loadScript(CONST_CESIUM_SCRIPT_URL);

        if (cancelled || !mapRef.current || !Cesium) return;

        if (CONST_CESIUM_ION_TOKEN) {
          Cesium.Ion.defaultAccessToken = CONST_CESIUM_ION_TOKEN;
        }

        viewerRef.current = new Cesium.Viewer(mapRef.current, {
          animation: false,
          timeline: false,
          fullscreenButton: false,
          sceneModePicker: true,
          baseLayerPicker: true,
          geocoder: false,
          homeButton: true,
          navigationHelpButton: false,
          shouldAnimate: true
        });

        viewerRef.current.scene.globe.enableLighting = true;
      } catch (ex) {
        if (!cancelled) {
          setError(ex.message || 'Unable to initialize 3D view.');
        }
      }
    };

    fn_init();

    return () => {
      cancelled = true;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className={`alert alert-warning m-2 ${className}`}>
        <strong>3D view unavailable:</strong> {error}
      </div>
    );
  }

  return <div ref={mapRef} className={`css_map_3d ${className}`} />;
};

export default Cesium3DView;

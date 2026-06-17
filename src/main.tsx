import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';

const PWA_CACHE_NAME = 'riderlog-v3';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => cacheCurrentAppShell())
      .catch(() => undefined);
  });
}

async function cacheCurrentAppShell() {
  if (!('caches' in window)) {
    return;
  }

  const assetUrls = [
    window.location.href,
    './manifest.json',
    './icons/riderlog-icon.svg',
    ...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).map((script) => script.src),
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')).map((link) => link.href),
  ];

  const cache = await caches.open(PWA_CACHE_NAME);
  await cache.addAll(assetUrls);
}

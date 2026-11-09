import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './app/App';
import './styles/index.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
if ('serviceWorker' in navigator) {
  const update = registerSW({ immediate: true, onNeedRefresh() { window.dispatchEvent(new CustomEvent('sakinah-update', { detail: update })); }, onOfflineReady() { window.dispatchEvent(new CustomEvent('sakinah-offline-ready')); } });
}
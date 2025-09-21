import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const splashScreen = document.getElementById('splash-screen');
if (splashScreen) {
  setTimeout(() => {
    splashScreen.style.opacity = '0';
    splashScreen.addEventListener('transitionend', () => {
      splashScreen.remove();
    });
  }, 5000);
}
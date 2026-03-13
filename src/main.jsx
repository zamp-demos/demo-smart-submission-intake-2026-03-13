import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Expose any runtime crash to the DOM so it can be read by automated tools
window.onerror = function(msg, src, line, col, err) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="color:red;font-family:monospace;padding:24px;white-space:pre-wrap" id="pace-error">' +
      'RUNTIME ERROR:\n' + msg + '\n\n' +
      (err && err.stack ? err.stack : '') +
      '\n\nSource: ' + src + ':' + line + ':' + col +
      '</div>';
  }
};

window.addEventListener('unhandledrejection', function(e) {
  const root = document.getElementById('root');
  if (root && !root.querySelector('#pace-error')) {
    root.innerHTML = '<div style="color:red;font-family:monospace;padding:24px;white-space:pre-wrap" id="pace-error">' +
      'UNHANDLED REJECTION:\n' + (e.reason && e.reason.stack ? e.reason.stack : String(e.reason)) +
      '</div>';
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

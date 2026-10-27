import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { TerminalProvider } from './store/terminalStore';
import './styles/terminal.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TerminalProvider>
        <App />
      </TerminalProvider>
    </React.StrictMode>
  );
} else {
  console.error('[AuRA Terminal] Fatal: root container #root not found.');
}

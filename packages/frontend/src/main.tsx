import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DanceProvider } from './hooks/useDanceStore';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DanceProvider>
      <App />
    </DanceProvider>
  </React.StrictMode>
);

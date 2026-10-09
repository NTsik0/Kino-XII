import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// Strip the trailing slash so the router basename works under /<repo>/ too.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

// Hosts without SPA fallback can opt into hash URLs with VITE_ROUTER=hash.
const useHash = import.meta.env.VITE_ROUTER === 'hash';
const Router = useHash ? HashRouter : BrowserRouter;
const routerProps = useHash ? {} : { basename: basename === '.' ? undefined : basename };

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <App />
    </Router>
  </React.StrictMode>,
);

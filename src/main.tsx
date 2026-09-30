import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { CrmProvider } from './state/store';
import { ToastProvider } from './components/Toast';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CrmProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </CrmProvider>
    </BrowserRouter>
  </StrictMode>,
);

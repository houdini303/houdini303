import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { HassProvider } from './ha/HassProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HassProvider>
      <App />
    </HassProvider>
  </StrictMode>,
);

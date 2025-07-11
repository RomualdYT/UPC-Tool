import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { SEOProvider } from './contexts/SEOContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SEOProvider>
          <App />
        </SEOProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
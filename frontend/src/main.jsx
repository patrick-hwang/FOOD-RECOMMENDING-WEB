// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';
import { NotificationProvider } from './Context/NotificationContext'; // Import mới

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider> 
          <App />
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
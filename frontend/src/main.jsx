// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext'; // Import mới

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider> {/* Bọc thêm ThemeProvider */}
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
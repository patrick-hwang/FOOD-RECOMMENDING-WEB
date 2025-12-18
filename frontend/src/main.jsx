// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- ADD THIS
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext'; // Import mới

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './Context/LanguageContext'; // Import mới

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>  {/* Bọc App lại */}
      <App />
    </LanguageProvider>
  </StrictMode>,
)
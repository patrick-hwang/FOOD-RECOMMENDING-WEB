import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import SplashScreen from './Components/SplashScreen';
import OnboardingPage from './Pages/Onboarding';
import logo from './assets/images/logo.png';
import LoginPage from './LoginPage';
import { Routes, Route, useNavigate } from 'react-router-dom';
import TasteMode from './TasteMode';

// --- IMPORT FILE MỚI TẠI ĐÂY ---
import RandomModeCard from './RandomModeCard'; 

// --- 1. HIỆU ỨNG MỞ MÀN (Giữ nguyên) ---
function AppEntranceEffect({ onDone }) {
  const [entered, setEntered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [hideRects, setHideRects] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setEntered(true), 50);
    const textTimer = setTimeout(() => setShowText(true), 500);
    const exitStart = 1500;
    const exitTimer = setTimeout(() => setEntered(false), exitStart);
    const hideTimer = setTimeout(() => setHideRects(true), exitStart + 1000);
    return () => { clearTimeout(enterTimer); clearTimeout(textTimer); clearTimeout(exitTimer); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => { if (hideRects && typeof onDone === 'function') onDone(); }, [hideRects, onDone]);

  return (
    <div className="EntranceEffect">
      {!hideRects && (
        <>
          <div className={`entrance-slide-rect top ${entered ? 'in' : ''}`}><span className={`entrance-text ${showText ? 'in' : ''}`}>NEW DESTINATIONS</span></div>
          <div className={`entrance-slide-rect bottom ${entered ? 'in' : ''}`}><span className={`entrance-text ${showText ? 'in' : ''}`}>NEW CRAVINGS</span></div>
        </>
      )}
    </div>
  );
}

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

// --- 2. MÀN HÌNH CHỌN CHẾ ĐỘ (Giữ nguyên) ---
function AppChooseMode({ onRandom, onTaste, onLogout }) {
  return (
    <div className="choose-mode-container" style={{position: 'relative'}}>
      <button className="logout-btn-absolute" onClick={onLogout} title="Logout">
        <LogoutIcon />
      </button>

      <header className="header">
        <div className="logo-container">
          <img src={logo} className="logo" alt="Logo" />
          <span className="logo-text">FoodRec</span>
        </div>
      </header>

      <main className="choose-mode-content-container">
        <h1 className="choose-mode-title">How do you want to search for food?</h1>
        <h2 className="choose-mode-subtitle">Choose your option</h2>

        <div className="options-grid">
          <div className="option-card random-card" onClick={onRandom}>
            <h2 className="card-title">Quick & Random</h2>
            <div className="card-icon"><span role="img" aria-label="Dice">🎲</span></div>
            <p className="card-description">Filters & random 3 spots</p>
          </div>
          <div className="option-card taste-card" onClick={onTaste}>
            <h2 className="card-title">Test your Taste</h2>
            <div className="card-icon"><span role="img" aria-label="Quiz">❓</span></div>
            <p className="card-description">Quizzes for personalized recommendations</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="choose-mode-footer">
          <a href="#help" className="help-link">Help?</a>
        </div>
      </footer>
    </div>
  );
}

function IntroSequence() {
  const [introStep, setIntroStep] = useState('splash');
  const navigate = useNavigate();

  return (
    <>
      {introStep === 'splash' && <SplashScreen onFinish={() => setIntroStep('entrance')} />}
      {introStep === 'entrance' && <AppEntranceEffect onDone={() => setIntroStep('onboarding')} />}
      {introStep === 'onboarding' && <OnboardingPage onFinish={() => navigate('/login')} />}
    </>
  );
}

// --- 3. APP MAIN (Đã xóa RandomModeCard cũ) ---
function App() {
  // const [mode, setMode] = useState('splash'); 
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com'; 
  const navigate = useNavigate(); // Hook to change URL

  // Helper function to handle Logout
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) { 
        navigate('/login'); 
    }
  };
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        <Routes>
          {/* URL: / (Intro Flow) */}
          <Route path="/" element={<IntroSequence />} />

          {/* URL: /login */}
          <Route path="/login" element={<LoginPage onLoginSuccess={() => navigate('/home')} />} />

          {/* URL: /home */}
          <Route path="/home" element={
             <AppChooseMode 
                onRandom={() => navigate('/random')} 
                onTaste={() => navigate('/taste')} 
                onLogout={handleLogout} 
             />
          } />

          {/* URL: /random */}
          <Route path="/random" element={<RandomModeCard onBack={() => navigate('/home')} />} />

          {/* URL: /taste */}
          <Route path="/taste" element={<TasteMode onBack={() => navigate('/home')} />} />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import SplashScreen from './Components/SplashScreen';
import OnboardingPage from './Pages/Onboarding';
import logo from './assets/images/logo.png';
import LoginPage from './LoginPage';

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

// --- 3. APP MAIN (Đã xóa RandomModeCard cũ) ---
function App() {
  const [mode, setMode] = useState('splash'); 
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com'; 
  
  function handleLoginSuccess() { setMode('choosing'); }
  function handleLogout() {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) { setMode('login'); }
  }
  function handleFinishOnboarding() { setMode('login'); }
  function taste() { console.log('enter taste mode'); setMode('taste'); }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        {mode === 'splash' && <SplashScreen onFinish={() => setMode('entrance')} />}
        {mode === 'entrance' && <AppEntranceEffect onDone={() => setMode('onboarding')} />} 
        {mode === 'onboarding' && <OnboardingPage onFinish={handleFinishOnboarding} />}
        {mode === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}

        {mode === 'choosing' && (
          <AppChooseMode 
            onRandom={() => setMode('random')} 
            onTaste={() => setMode('taste')} 
            onLogout={handleLogout} 
          />
        )}
        
        {/* Render RandomModeCard mới từ file đã tách */}
        {mode === 'random' && <RandomModeCard onBack={() => setMode('choosing')} />}
        
        {mode === 'taste' && (
          <div className="mode-container">
            <h2>Taste Quiz</h2>
            <p>Starting taste quiz...</p>
            <button className="back-button" onClick={() => setMode('choosing')}>Back</button>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
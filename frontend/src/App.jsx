import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import SplashScreen from './Components/SplashScreen';
import OnboardingPage from './Pages/Onboarding';
import logo from './assets/images/logo.png';
import LoginPage from './LoginPage';
import { Routes, Route, useNavigate } from 'react-router-dom';
import TasteMode from './TasteMode';
import diceIMG from './assets/images/Mode-Icon/dice.png'
import compassIMG from './assets/images/Mode-Icon/akinator.png'

// --- IMPORT FILE MỚI TẠI ĐÂY ---
import RandomModeCard from './RandomModeCard';
import BottomNavigation from './Components/BottomNavigation';
import ProfilePage from './ProfilePage';
import axios from 'axios';

// --- 1. HIỆU ỨNG MỞ MÀN ---
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
  {/*const handleClear = () => {
    setText("");
  };*/}

  return (
    <div className="choose-mode-container" style={{ position: 'relative' }}>
      {/* Đã xóa nút logout ở đây */}

      <header className="header">
        <div className="logo-container">
          <img src={logo} className="logo" alt="Logo" />
          <span className="logo-text">FoodRec</span>
        </div>
      </header>

      <main className="choose-mode-content-container">
        {/*<h1 className="choose-mode-title">How do you want to search for food?</h1>
        <h2 className="choose-mode-subtitle">Choose your option</h2>
*/}
        <div className="input-container">
          <span className="input-icon">🔍</span>
          {/*<span className="clear-icon" onClick={handleClear}>X</span>*/}
          <input type="text" placeholder='What are you in the mood for?' />
        </div>

        <div className="Quick-pick-container">
          <h1 className='Quick-pick'>Quick Picks for You</h1>
          <div className='Keyword-container'>
            <div className='Keyword'>sticky rice1</div>
            <div className='Keyword'>sticky rice2</div>
            <div className='Keyword'>sticky rice3</div>
            <div className='Keyword'>sticky rice4</div>
          </div>
        </div>


        <div className="options-grid">
          <div className="option-card random-card" onClick={onRandom}>
            <div className="card-icon">
              <img src={diceIMG} alt="Dice" className="dice-icon" />
            </div>
            <h2 className="card-title">Quick & Random</h2>
            <p className="card-description">Filters & random 3 spots</p>
          </div>
          <div className="option-card taste-card" onClick={onTaste}>
            <div className="card-icon">
              <img src={compassIMG} alt="Compass" className="compass-icon" />
            </div>
            <h2 className="card-title">Test your Taste</h2>
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

// --- 3. APP MAIN ---
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com';
  const navigate = useNavigate();

  function handleLoginSuccess(user) {
    const userObj = user || { phone: "0123456789", username: "Demo User" };
    setCurrentUser(userObj);
    navigate('/home');
  }

  function handleLogout() {
    if (window.confirm("Log out?")) {
      setCurrentUser(null);
      navigate('/login');
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        <Routes>
          {/* URL: / (Intro Flow) */}
          <Route path="/" element={<IntroSequence />} />

          {/* URL: /login */}
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />

          {/* URL: /home */}
          <Route path="/home" element={
            <>
              <AppChooseMode
                onRandom={() => navigate('/random')}
                onTaste={() => navigate('/taste')}
              />
              <BottomNavigation activeTab="home" onTabChange={(tab) => navigate(`/${tab}`)} />
            </>
          } />

          {/* URL: /random */}
          <Route path="/random" element={
            <>
              <RandomModeCard onBack={() => navigate('/home')} currentUser={currentUser} onDetailViewChange={setIsDetailViewOpen} />
              {!isDetailViewOpen && <BottomNavigation activeTab="home" onTabChange={(tab) => navigate(`/${tab}`)} />}
            </>
          } />

          {/* URL: /taste */}
          <Route path="/taste" element={
            <>
              <TasteMode onBack={() => navigate('/home')} currentUser={currentUser} onDetailViewChange={setIsDetailViewOpen} />
              {!isDetailViewOpen && <BottomNavigation activeTab="home" onTabChange={(tab) => navigate(`/${tab}`)} />}
            </>
          } />

          {/* URL: /profile */}
          <Route path="/profile" element={
            <>
              <ProfilePage currentUser={currentUser} onLogout={handleLogout} />
              <BottomNavigation activeTab="profile" onTabChange={(tab) => navigate(`/${tab}`)} />
            </>
          } />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
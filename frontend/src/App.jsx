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
import Toast from './Components/Toast';
import defaultAvatar from './assets/images/logo.png';
import { LanguageProvider } from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';
import { NotificationProvider } from './Context/NotificationContext';
import { useLanguage } from './Context/LanguageContext';

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
function AppChooseMode({ onRandom, onTaste, currentUser }) { // Accept currentUser prop
  const { t } = useLanguage(); // Hook for translations
  const username = currentUser?.username || "HeppiHehe";
  const avatar = currentUser?.avatar || logo; // Fallback to logo if no avatar

  return (
    <div className="choose-mode-container">
      {/* 1. Header */}
      <div className="home-header">
        <div className="header-user">
          <img 
            src={avatar} 
            className="header-avatar" 
            alt="User" 
            referrerPolicy="no-referrer" // <--- ADD THIS LINE
          />
          <span>{t('hi')} {username}!</span>
        </div>
        <img src={logo} style={{width: 30}} alt="Logo" />
      </div>

      {/* 2. Search */}
      <div style={{position:'relative'}}>
        <span style={{position:'absolute', left:15, top:13}}>🔍</span>
        <input className="home-search" placeholder={t('search_placeholder')} />
      </div>

      {/* 3. Chips */}
      <h3>{t('quick_picks_title')}</h3>
      <div className="chips-container">
        <div className="chip">Sticky Rice</div>
        <div className="chip">Pho</div>
        <div className="chip">Banh Mi</div>
        <div className="chip">Coffee</div>
      </div>

      {/* 4. Cards */}
      <div className="mode-card-new card-green" onClick={onRandom}>
        <img src={diceIMG} className="card-3d-icon" alt="Random" />
        <h2>{t('quick_pick_card')}</h2>
        <p>{t('quick_pick_desc')}</p>
      </div>

      <div className="mode-card-new card-yellow" onClick={onTaste}>
        <img src={compassIMG} className="card-3d-icon" alt="Taste" />
        <h2>{t('taste_card')}</h2>
        <p>{t('taste_desc')}</p>
      </div>
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

// --- APP MAIN (Tích hợp Guest Mode, Language, Theme) ---
function App() {
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com'; 
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Xử lý đăng nhập thành công (User thật)
  const handleLoginSuccess = (user) => {
    const userObj = user || { phone: "0123456789", username: "Demo User" }; 
    setCurrentUser(userObj);
    navigate('/home');
  };

  // Xử lý đăng nhập Guest
  const handleGuestLogin = () => {
    const guestUser = {
      isGuest: true,
      username: "Guest",
      avatar: defaultAvatar
    };
    setCurrentUser(guestUser);
    navigate('/home');
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    if (currentUser?.isGuest) {
      // Guest logout không cần confirm
      setCurrentUser(null);
      navigate('/login');
    } else {
      if (window.confirm("Bạn có chắc muốn đăng xuất?")) { 
        setCurrentUser(null);
        navigate('/login'); 
      }
    }
  };
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <NotificationProvider>
        <LanguageProvider>
          <ThemeProvider>
            <div className="App">
              <Toast /> 

              <Routes>
                {/* URL: / (Intro Flow) */}
                <Route path="/" element={<IntroSequence />} />

                {/* URL: /login */}
                <Route 
                  path="/login" 
                  element={
                    <LoginPage 
                      onLoginSuccess={handleLoginSuccess}
                      onGuestLogin={handleGuestLogin}
                    />
                  } 
                />

                {/* URL: /home */}
                <Route 
                  path="/home" 
                  element={
                    <>
                      <AppChooseMode 
                        onRandom={() => navigate('/random')} 
                        onTaste={() => navigate('/taste')} 
                        currentUser={currentUser} /* <--- ADD THIS PROP */
                      />
                      <BottomNavigation 
                        activeTab="home" 
                        onTabChange={(tab) => navigate(tab === 'profile' ? '/profile' : '/home')} 
                      />
                    </>
                  } 
                />

                {/* URL: /random */}
                <Route 
                  path="/random" 
                  element={
                    <>
                      <RandomModeCard 
                        onBack={() => navigate('/home')} 
                        currentUser={currentUser}
                        onLogout={handleLogout}
                      />
                      <BottomNavigation 
                        activeTab="home" 
                        onTabChange={(tab) => navigate(tab === 'profile' ? '/profile' : '/home')} 
                      />
                    </>
                  } 
                />

                {/* URL: /taste */}
                <Route 
                  path="/taste" 
                  element={
                    <>
                      <TasteMode 
                        onBack={() => navigate('/home')}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                      />
                      <BottomNavigation 
                        activeTab="home" 
                        onTabChange={(tab) => navigate(tab === 'profile' ? '/profile' : '/home')} 
                      />
                    </>
                  } 
                />

                {/* URL: /profile */}
                <Route 
                  path="/profile" 
                  element={
                    <>
                      <ProfilePage 
                        currentUser={currentUser} 
                        onLogout={handleLogout}
                      />
                      <BottomNavigation 
                        activeTab="profile" 
                        onTabChange={(tab) => navigate(tab === 'profile' ? '/profile' : '/home')} 
                      />
                    </>
                  } 
                />
              </Routes>
            </div>
          </ThemeProvider>
        </LanguageProvider>
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

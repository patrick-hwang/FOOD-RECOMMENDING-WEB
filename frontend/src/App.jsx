import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import SplashScreen from './Components/SplashScreen';
import OnboardingPage from './Pages/Onboarding';
import logo from './assets/images/logo.png';
import LoginPage from './LoginPage';
import { Routes, Route, useNavigate } from 'react-router-dom';
import TasteMode from './TasteMode';
import RandomModeCard from './RandomModeCard'; 
import BottomNavigation from './Components/BottomNavigation'; 
import ProfilePage from './ProfilePage'; 
import Toast from './Components/Toast';
import defaultAvatar from './assets/images/logo.png';
import { LanguageProvider } from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';
import { NotificationProvider } from './Context/NotificationContext';

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

function AppChooseMode({ onRandom, onTaste }) {
  return (
    <div className="choose-mode-container" style={{position: 'relative'}}>
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

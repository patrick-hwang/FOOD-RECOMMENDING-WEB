import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import SplashScreen from './Components/SplashScreen';
import OnboardingPage from './Pages/Onboarding';
import logo from './assets/images/logo.png';
import LoginPage from './LoginPage';
import RandomModeCard from './RandomModeCard'; 
import BottomNavigation from './Components/BottomNavigation'; 
import ProfilePage from './ProfilePage'; 
import Toast from './Components/Toast';
import defaultAvatar from './assets/images/logo.png'; // Import ảnh avatar mặc định

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

// --- APP MAIN ---
function App() {
  const [mode, setMode] = useState('splash'); 
  const [mainTab, setMainTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);

  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com'; 
  
  function handleLoginSuccess(user) {
      const userObj = user || { phone: "0123456789", username: "Demo User" }; 
      setCurrentUser(userObj);
      setMode('main_app'); 
  }

  // --- HÀM XỬ LÝ CHẾ ĐỘ KHÁCH ---
  function handleGuestLogin() {
      const guestUser = {
          isGuest: true,
          username: "Guest",
          avatar: defaultAvatar
      };
      setCurrentUser(guestUser);
      setMode('main_app');
  }

  function handleLogout() {
    if (currentUser?.isGuest) {
        // Guest logout không cần confirm
        setMode('login'); 
        setCurrentUser(null);
        setMainTab('home'); 
    } else {
        if (window.confirm("Log out?")) { 
            setMode('login'); 
            setCurrentUser(null);
            setMainTab('home'); 
        }
    }
  }
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        <Toast /> 

        {mode === 'splash' && <SplashScreen onFinish={() => setMode('entrance')} />}
        {mode === 'entrance' && <AppEntranceEffect onDone={() => setMode('onboarding')} />} 
        {mode === 'onboarding' && <OnboardingPage onFinish={() => setMode('login')} />}
        
        {/* --- FIX LỖI TẠI ĐÂY: Truyền thêm onGuestLogin --- */}
        {mode === 'login' && (
            <LoginPage 
                onLoginSuccess={handleLoginSuccess} 
                onGuestLogin={handleGuestLogin} 
            />
        )}

        {mode === 'main_app' && (
            <>
                <div style={{width: '100%', height: '100%'}}>
                    {mainTab === 'home' && (
                        <RandomModeWrapper 
                             currentUser={currentUser} 
                        />
                    )}
                    
                    {mainTab === 'profile' && (
                        <ProfilePage currentUser={currentUser} onLogout={handleLogout} />
                    )}
                </div>

                <BottomNavigation activeTab={mainTab} onTabChange={setMainTab} />
            </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

function RandomModeWrapper({ currentUser }) {
    const [subMode, setSubMode] = useState('choosing'); 

    if (subMode === 'choosing') {
        return <AppChooseMode onRandom={() => setSubMode('random')} onTaste={() => setSubMode('taste')} />;
    }
    if (subMode === 'random') {
        return <RandomModeCard onBack={() => setSubMode('choosing')} currentUser={currentUser} />;
    }
    if (subMode === 'taste') {
        return <div>Taste Quiz (Coming soon) <button onClick={()=>setSubMode('choosing')}>Back</button></div>;
    }
    return null;
}

export default App;
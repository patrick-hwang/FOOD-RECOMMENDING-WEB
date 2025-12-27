import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Import CSS
import './App.css';

// Import Components & Pages
import SplashScreen from './Components/SplashScreen';
import OnboardingPage from './Pages/Onboarding';
import LoginPage from './LoginPage';
import TasteMode from './TasteMode';
import RandomModeCard from './RandomModeCard';
import AppChooseMode from './AppChooseMode';
import ProfilePage from './ProfilePage';

// Import Contexts & Utils
import Toast from './Components/Toast';
import defaultAvatar from './assets/images/logo.png';
import { LanguageProvider } from './Context/LanguageContext';
import { ThemeProvider } from './Context/ThemeContext';
import { NotificationProvider } from './Context/NotificationContext';

// --- HIỆU ỨNG CHUYỂN CẢNH (ENTRANCE) ---
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
    return () => { 
      clearTimeout(enterTimer); 
      clearTimeout(textTimer); 
      clearTimeout(exitTimer); 
      clearTimeout(hideTimer); 
    };
  }, []);

  useEffect(() => { 
    if (hideRects && typeof onDone === 'function') onDone(); 
  }, [hideRects, onDone]);

  return (
    <div className="EntranceEffect">
      {!hideRects && (
        <>
          <div className={`entrance-slide-rect top ${entered ? 'in' : ''}`}>
            <span className={`entrance-text ${showText ? 'in' : ''}`}>NEW DESTINATIONS</span>
          </div>
          <div className={`entrance-slide-rect bottom ${entered ? 'in' : ''}`}>
            <span className={`entrance-text ${showText ? 'in' : ''}`}>NEW CRAVINGS</span>
          </div>
        </>
      )}
    </div>
  );
}

// --- LUỒNG GIỚI THIỆU (INTRO FLOW) ---
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

// --- APP MAIN ---
function App() {
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com';
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser'); // Matches the key used above
    return saved ? JSON.parse(saved) : { isGuest: true };
  });

  const handleUserUpdate = (updatedData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  };

  // Xử lý đăng nhập thành công (User thật)
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    navigate('/home');
  };

  // Xử lý đăng nhập Guest (Chế độ khách)
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
              {/* Toast thông báo hiển thị toàn cục */}
              <Toast />

              <Routes>
                {/* 1. Trang Intro (Splash -> Entrance -> Onboarding) */}
                <Route path="/" element={<IntroSequence />} />

                {/* 2. Trang Đăng nhập */}
                <Route
                  path="/login"
                  element={
                    <LoginPage
                      onLoginSuccess={handleLoginSuccess}
                      onGuestLogin={handleGuestLogin}
                    />
                  }
                />

                {/* 3. Trang chủ (Chọn chế độ) - Đã bỏ BottomNavigation */}
                <Route
                  path="/home"
                  element={
                    <AppChooseMode
                      onRandom={() => navigate('/random')}
                      onTaste={() => navigate('/taste')}
                      currentUser={currentUser}
                      onLogout={handleLogout} // <--- ADD THIS LINE
                    />
                  }
                />

                {/* 4. Chế độ Chọn nhanh (Random) */}
                <Route
                  path="/random"
                  element={
                    <RandomModeCard
                      onBack={() => navigate('/home')}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                    />
                  }
                />

                {/* 5. Chế độ Khẩu vị (Taste Quiz) */}
                <Route
                  path="/taste"
                  element={
                    <TasteMode
                      onBack={() => navigate('/home')}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                    />
                  }
                />

                {/* 6. Trang cá nhân - Nút Back dẫn về Home thay vì dùng Bottom Nav */}
                <Route
                  path="/profile"
                  element={
                    <ProfilePage
                      currentUser={currentUser}
                      onLogout={handleLogout}
                      onBack={() => navigate('/home')}
                      onUserUpdate={handleUserUpdate} // <--- ADD PROP
                    />
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
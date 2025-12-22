import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import axios from 'axios';
import './Login.css';
import { useLanguage } from './Context/LanguageContext';
import { useTheme } from './Context/ThemeContext';

// --- ICONS ---
const UserIcon = () => <span>👤</span>;
const PhoneIcon = () => <span>📞</span>;
const LockIcon = () => <span>🔒</span>;
const FbIcon = () => <span style={{color: '#1877F2', fontSize: '1.4rem', fontWeight: 'bold'}}>f</span>;
const GoogleIcon = () => <span style={{color: '#EA4335', fontSize: '1.4rem', fontWeight: 'bold'}}>G</span>;
const GmailIcon = () => <span style={{color: '#DB4437', fontSize: '1.4rem', fontWeight: 'bold'}}>M</span>;
const EyeOpen = () => <span style={{fontSize: '1.2rem'}}>👁️</span>;
const EyeClosed = () => <span style={{fontSize: '1.2rem'}}>🙈</span>;

function LoginPage({ onLoginSuccess, onGuestLogin }) {
  // const { t } = useLanguage();
  const [view, setView] = useState('welcome'); // welcome | login | signup | forgot
  const [formData, setFormData] = useState({ username: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const { lang, switchLanguage, t } = useLanguage(); // Update destructuring
  const { isDarkMode, toggleTheme } = useTheme();    // Get theme hook

  const API_URL = "http://127.0.0.1:8000/api/auth";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(''); 
  };

  // --- GOOGLE LOGIN ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await axios.post(`${API_URL}/google`, { token: tokenResponse.access_token });
        onLoginSuccess(res.data.user);
      } catch (err) { setErrorMsg("Google Login Failed"); } finally { setLoading(false); }
    },
    onError: () => setErrorMsg("Google Login Failed"),
  });

  // --- FACEBOOK LOGIN ---
  const responseFacebook = async (response) => {
    if (response.accessToken) {
      setLoading(true);
      try {
        const res = await axios.post(`${API_URL}/facebook`, {
            accessToken: response.accessToken, userID: response.userID,
            email: response.email, picture: response.picture?.data?.url
        });
        onLoginSuccess(res.data.user);
      } catch (err) { setErrorMsg("Facebook Login Failed"); } finally { setLoading(false); }
    }
  };

  // --- MANUAL LOGIN ---
  const handleLoginSubmit = async () => {
    if (!formData.phone || !formData.password) return setErrorMsg("Missing info");
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/login`, { phone: formData.phone, password: formData.password });
        onLoginSuccess(res.data.user);
    } catch (err) { setErrorMsg(err.response?.data?.detail || "Login Failed"); } finally { setLoading(false); }
  };

  // --- SIGNUP ---
  const handleSignupSubmit = async () => {
    if (!formData.username || !formData.phone || !formData.password) return setErrorMsg("Missing info");
    setLoading(true);
    try {
        await axios.post(`${API_URL}/register`, { username: formData.username, phone: formData.phone, password: formData.password });
        alert(t('sign_up') + " Success!"); setView('login');
    } catch (err) { setErrorMsg(err.response?.data?.detail || "Signup Failed"); } finally { setLoading(false); }
  };

  // --- RESET PASSWORD ---
  const handleResetSubmit = async () => {
      if (!formData.phone || !formData.password || !formData.confirmPassword) return setErrorMsg("Missing info");
      if (formData.password !== formData.confirmPassword) return setErrorMsg("Passwords do not match");
      setLoading(true);
      try {
          await axios.post(`${API_URL}/reset-password`, { phone: formData.phone, new_password: formData.password });
          alert(t('updated')); setView('login');
      } catch (err) { setErrorMsg("Failed to reset"); } finally { setLoading(false); }
  };

  const renderPasswordInput = (ph, name="password") => (
    <div className="input-group">
      <div className="input-icon"><LockIcon /></div>
      <div className="password-container">
        <input type={showPassword?"text":"password"} className="custom-input" placeholder={t(ph)} name={name} value={formData[name]} onChange={handleChange}/>
        <button type="button" className="toggle-password-icon" onClick={()=>setShowPassword(!showPassword)} tabIndex="-1">{showPassword?<EyeOpen/>:<EyeClosed/>}</button>
      </div>
    </div>
  );

  // --- RENDER VIEWS ---

  if (view === 'welcome') {
    return (
      <div className="login-container">
        <div style={{position: 'absolute', top: 20, right: 20, display:'flex', gap: 8, zIndex: 10}}>
          <button className="rm-mini-btn" onClick={toggleTheme}>{isDarkMode ? '☀️' : '🌙'}</button>
          <button className={`rm-mini-btn ${lang==='vi'?'active':''}`} onClick={() => switchLanguage('vi')}>VI</button>
          <button className={`rm-mini-btn ${lang==='en'?'active':''}`} onClick={() => switchLanguage('en')}>EN</button>
        </div>
        
        <div className="login-illustration"><img src="https://placehold.co/200x200/e2e8f0/10b981?text=FoodRec" style={{borderRadius:'50%'}} alt=""/></div>
        <h1 className="login-title">{t('lets_in')}</h1>
        
        <FacebookLogin appId="1575289767221956" autoLoad={false} fields="name,email,picture" callback={responseFacebook} 
          render={({onClick})=>(<button className="social-btn" onClick={onClick}><FbIcon/> {t('continue_fb')}</button>)} />
        
        <button className="social-btn" onClick={()=>googleLogin()}><GoogleIcon/> {t('continue_gg')}</button>
        
        <div className="divider"><span>{t('or')}</span></div>
        
        <button className="primary-btn" onClick={()=>setView('login')}>{t('sign_in_phone')}</button>
        
        {/* Nút Chế độ Khách */}
        <div style={{marginTop: '15px', cursor: 'pointer', color: '#666', fontSize: '0.9rem', textDecoration:'underline'}} onClick={() => setShowGuestModal(true)}>
            {t('continue_guest')}
        </div>

        <div className="bottom-text">{t('dont_have_acc')} <span className="highlight-link" onClick={()=>setView('signup')}>{t('sign_up')}</span></div>

        {/* Modal Cảnh báo Guest */}
        {showGuestModal && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', padding:20, borderRadius:15, width:'80%', maxWidth:300, textAlign:'center'}}>
                    <h3 style={{margin:'0 0 10px 0', color:'#333'}}>{t('guest_warning_title')}</h3>
                    <p style={{color:'#666', fontSize:14}}>{t('guest_warning_body')}</p>
                    <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:20}}>
                        <button onClick={onGuestLogin} style={{background:'#4CAF50', color:'white', border:'none', padding:'10px 20px', borderRadius:20, fontWeight:'bold'}}>{t('guest_confirm')}</button>
                        <button onClick={() => setShowGuestModal(false)} style={{background:'#eee', color:'#333', border:'none', padding:'10px 20px', borderRadius:20}}>{t('cancel')}</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="login-container">
        <button className="back-icon" onClick={()=>setView('welcome')}>←</button>
        <h1 className="login-title">{t('login_title')}</h1>
        {errorMsg && <div style={{color:'red',marginBottom:10}}>{errorMsg}</div>}
        <div className="input-group"><div className="input-icon"><PhoneIcon/></div><input type="text" className="custom-input" placeholder={t('phone_ph')} name="phone" value={formData.phone} onChange={handleChange}/></div>
        {renderPasswordInput('pass_ph')}
        <div className="form-options">
          <label className="remember-me"><input type="checkbox"/> {t('remember_me')}</label>
          <span className="forgot-pass" style={{cursor:'pointer'}} onClick={()=>{setErrorMsg(''); setView('forgot')}}>{t('forgot_pass')}</span>
        </div>
        <button className="primary-btn" onClick={handleLoginSubmit}>{loading?t('signing_in'):t('sign_in')}</button>
        <div className="bottom-text">{t('dont_have_acc')} <span className="highlight-link" onClick={()=>setView('signup')}>{t('sign_up')}</span></div>
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <div className="login-container">
        <button className="back-icon" onClick={()=>setView('welcome')}>←</button>
        <h1 className="login-title">{t('create_acc')}</h1>
        {errorMsg && <div style={{color:'red',marginBottom:10}}>{errorMsg}</div>}
        <div className="input-group"><div className="input-icon"><UserIcon/></div><input type="text" className="custom-input" placeholder={t('name_ph')} name="username" value={formData.username} onChange={handleChange}/></div>
        <div className="input-group"><div className="input-icon"><PhoneIcon/></div><input type="text" className="custom-input" placeholder={t('phone_ph')} name="phone" value={formData.phone} onChange={handleChange}/></div>
        {renderPasswordInput('pass_ph')}
        <button className="primary-btn" onClick={handleSignupSubmit}>{loading?t('signing_up'):t('sign_up')}</button>
        <div className="bottom-text">{t('already_have_acc')} <span className="highlight-link" onClick={()=>setView('login')}>{t('sign_in')}</span></div>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <div className="login-container">
        <button className="back-icon" onClick={()=>setView('login')}>←</button>
        <h1 className="login-title">{t('reset_pass')}</h1>
        <p style={{marginBottom:20,color:'#666',textAlign:'center',fontSize:'0.9rem'}}>{t('reset_desc')}</p>
        <div className="input-group"><div className="input-icon"><PhoneIcon/></div><input type="tel" className="custom-input" placeholder={t('phone_ph')} name="phone" value={formData.phone} onChange={handleChange}/></div>
        {renderPasswordInput('new_pass_ph', "password")}
        {renderPasswordInput('confirm_pass_ph', "confirmPassword")}
        <button className="primary-btn" onClick={handleResetSubmit} disabled={loading}>{loading?t('update_loading'):t('reset_pass')}</button>
      </div>
    );
  }
  return null;
}

export default LoginPage;
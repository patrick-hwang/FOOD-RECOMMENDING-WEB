import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import axios from 'axios';
import './Login.css';
import { useLanguage } from './Context/LanguageContext'; // Import Context

// --- ICONS (Giữ nguyên) ---
const UserIcon = () => <span>👤</span>;
const PhoneIcon = () => <span>📞</span>;
const LockIcon = () => <span>🔒</span>;
const FbIcon = () => <span style={{color: '#1877F2', fontSize: '1.4rem', fontWeight: 'bold'}}>f</span>;
const GoogleIcon = () => <span style={{color: '#EA4335', fontSize: '1.4rem', fontWeight: 'bold'}}>G</span>;
const GmailIcon = () => <span style={{color: '#DB4437', fontSize: '1.4rem', fontWeight: 'bold'}}>M</span>;
const EyeOpen = () => <span style={{fontSize: '1.2rem'}}>👁️</span>;
const EyeClosed = () => <span style={{fontSize: '1.2rem'}}>🙈</span>;

function LoginPage({ onLoginSuccess }) {
  const { t } = useLanguage(); // Lấy hàm dịch
  const [view, setView] = useState('welcome');
  const [formData, setFormData] = useState({ username: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = "http://127.0.0.1:8000/api/auth";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(''); 
  };

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

  const handleLoginSubmit = async () => {
    if (!formData.phone || !formData.password) return setErrorMsg("Missing info");
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/login`, { phone: formData.phone, password: formData.password });
        onLoginSuccess(res.data.user);
    } catch (err) { setErrorMsg(err.response?.data?.detail || "Login Failed"); } finally { setLoading(false); }
  };

  const handleSignupSubmit = async () => {
    if (!formData.username || !formData.phone || !formData.password) return setErrorMsg("Missing info");
    setLoading(true);
    try {
        await axios.post(`${API_URL}/register`, { username: formData.username, phone: formData.phone, password: formData.password });
        alert(t('sign_up') + " Success!"); setView('login');
    } catch (err) { setErrorMsg(err.response?.data?.detail || "Signup Failed"); } finally { setLoading(false); }
  };

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

  if (view === 'welcome') {
    return (
      <div className="login-container">
        <div className="login-illustration"><img src="https://placehold.co/200x200/e2e8f0/10b981?text=FoodRec" style={{borderRadius:'50%'}} alt=""/></div>
        <h1 className="login-title">{t('lets_in')}</h1>
        <FacebookLogin appId="1575289767221956" autoLoad={false} fields="name,email,picture" callback={responseFacebook} 
          render={({onClick})=>(<button className="social-btn" onClick={onClick}><FbIcon/> {t('continue_fb')}</button>)} />
        <button className="social-btn" onClick={()=>googleLogin()}><GoogleIcon/> {t('continue_gg')}</button>
        <div className="divider"><span>{t('or')}</span></div>
        <button className="primary-btn" onClick={()=>setView('login')}>{t('sign_in_phone')}</button>
        <div className="bottom-text">{t('dont_have_acc')} <span className="highlight-link" onClick={()=>setView('signup')}>{t('sign_up')}</span></div>
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
        {errorMsg && <div style={{color:'red',marginBottom:10,textAlign:'center'}}>{errorMsg}</div>}
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
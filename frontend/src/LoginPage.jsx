import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
// import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import FacebookLogin from '@greatsumini/react-facebook-login';
import axios from 'axios';
import './Login.css';

// --- BỘ ICON SVG (Giữ nguyên để không bị lỗi thiếu ảnh) ---
const UserIcon = () => <span>👤</span>;
const PhoneIcon = () => <span>📞</span>;
const LockIcon = () => <span>🔒</span>;
const FbIcon = () => <span style={{color: '#1877F2', fontSize: '1.4rem', fontWeight: 'bold'}}>f</span>;
const GoogleIcon = () => <span style={{color: '#EA4335', fontSize: '1.4rem', fontWeight: 'bold'}}>G</span>;
const GmailIcon = () => <span style={{color: '#DB4437', fontSize: '1.4rem', fontWeight: 'bold'}}>M</span>;
const EyeOpen = () => <span style={{fontSize: '1.2rem'}}>👁️</span>;
const EyeClosed = () => <span style={{fontSize: '1.2rem'}}>🙈</span>;

function LoginPage({ onLoginSuccess }) {
  // Quản lý các màn hình: 'welcome' | 'login' | 'signup' | 'forgot'
  const [view, setView] = useState('welcome');
  
  // State chứa dữ liệu form
  const [formData, setFormData] = useState({ 
    username: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Đường dẫn API (Đảm bảo backend python app.py đang chạy)
  const API_URL = "http://127.0.0.1:8000/api/auth";

  // --- HÀM XỬ LÝ NHẬP LIỆU ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(''); // Xóa thông báo lỗi khi người dùng gõ lại
  };

  // =========================================================
  // 1. XỬ LÝ ĐĂNG NHẬP GOOGLE
  // =========================================================
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google Token:', tokenResponse);
      setLoading(true);
      setErrorMsg('');
      try {
        // Gửi token về backend để xác thực
        const res = await axios.post(`${API_URL}/google`, { token: tokenResponse.access_token });
        console.log("Backend Google Response:", res.data);
        
        // QUAN TRỌNG: Gọi hàm này để App.jsx chuyển sang trang chính
        onLoginSuccess();
        
      } catch (err) {
        console.error("Google Login Error:", err);
        setErrorMsg("Lỗi kết nối Backend khi đăng nhập Google. Kiểm tra lại server Python!");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setErrorMsg("Đăng nhập Google thất bại (Client side)."),
  });

  // =========================================================
  // 2. XỬ LÝ ĐĂNG NHẬP FACEBOOK
  // =========================================================
  const responseFacebook = async (response) => {
    console.log('Facebook Response:', response);
    if (response.accessToken) {
      setLoading(true);
      setErrorMsg('');
      try {
        // Gửi thông tin về backend
        const res = await axios.post(`${API_URL}/facebook`, {
            accessToken: response.accessToken,
            userID: response.userID,
            name: response.name,
            email: response.email,
            picture: response.picture?.data?.url
        });
        console.log("Backend FB Response:", res.data);

        // QUAN TRỌNG: Gọi hàm này để chuyển trang
        onLoginSuccess();

      } catch (err) {
        console.error("Facebook Login Error:", err);
        setErrorMsg("Lỗi kết nối Backend khi đăng nhập Facebook.");
      } finally {
        setLoading(false);
      }
    }
  };

  // =========================================================
  // 3. XỬ LÝ ĐĂNG NHẬP (PHONE + PASS)
  // =========================================================
  const handleLoginSubmit = async () => {
    if (!formData.phone || !formData.password) {
        setErrorMsg("Vui lòng điền số điện thoại và mật khẩu.");
        return;
    }
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/login`, {
            phone: formData.phone,
            password: formData.password
        });
        if(res.status === 200) {
            console.log("Login Success:", res.data);
            onLoginSuccess();
        }
    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || "Không thể kết nối tới Server.";
        setErrorMsg(msg);
    } finally {
        setLoading(false);
    }
  };

  // =========================================================
  // 4. XỬ LÝ ĐĂNG KÝ (PHONE + PASS)
  // =========================================================
  const handleSignupSubmit = async () => {
    if (!formData.username || !formData.phone || !formData.password) {
        setErrorMsg("Vui lòng điền đầy đủ thông tin.");
        return;
    }
    setLoading(true);
    try {
        await axios.post(`${API_URL}/register`, {
            username: formData.username,
            phone: formData.phone,
            password: formData.password
        });
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setView('login');
        setFormData({ username: '', phone: '', password: '', confirmPassword: '' });
    } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || "Đăng ký thất bại.";
        setErrorMsg(msg);
    } finally {
        setLoading(false);
    }
  };

  // =========================================================
  // 5. XỬ LÝ QUÊN MẬT KHẨU (RESET PASSWORD)
  // =========================================================
  const handleResetSubmit = async () => {
      if (!formData.phone || !formData.password || !formData.confirmPassword) {
          setErrorMsg("Vui lòng điền đầy đủ thông tin.");
          return;
      }
      if (formData.password !== formData.confirmPassword) {
          setErrorMsg("Mật khẩu xác nhận không khớp!");
          return;
      }

      setLoading(true);
      try {
          await axios.post(`${API_URL}/reset-password`, {
              phone: formData.phone,
              new_password: formData.password
          });
          alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
          setView('login');
          setFormData({ username: '', phone: '', password: '', confirmPassword: '' });
      } catch (err) {
          if (err.response && err.response.status === 404) {
              setErrorMsg("Số điện thoại này chưa đăng ký.");
          } else {
              setErrorMsg("Lỗi hệ thống hoặc mất kết nối Server.");
          }
      } finally {
          setLoading(false);
      }
  };

  // --- Helper để render ô nhập mật khẩu có mắt ---
  const renderPasswordInput = (placeholder = "Password", name = "password") => (
    <div className="input-group">
      <div className="input-icon"><LockIcon /></div>
      <div className="password-container">
        <input 
            type={showPassword ? "text" : "password"} 
            className="custom-input" 
            placeholder={placeholder}
            name={name}
            value={formData[name]}
            onChange={handleChange}
        />
        <button 
            type="button" 
            className="toggle-password-icon" 
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
        >
            {showPassword ? <EyeOpen /> : <EyeClosed />}
        </button>
      </div>
    </div>
  );

  // =========================================================
  // GIAO DIỆN (UI)
  // =========================================================

  // --- VIEW 1: WELCOME SCREEN ---
  if (view === 'welcome') {
    return (
      <div className="login-container">
        <button className="back-icon" style={{visibility: 'hidden'}}>←</button>
        <div className="login-illustration">
           <img src="https://placehold.co/200x200/e2e8f0/10b981?text=FoodRec" alt="Welcome" style={{borderRadius: '50%'}} />
        </div>
        <h1 className="login-title">Let’s you in</h1>

        {/* Nút Facebook đã sửa lỗi Scopes */}
        <FacebookLogin
            appId="1575289767221956"
            autoLoad={false}
            fields="name,email,picture" 
            
            // 1. Log the user in
            onSuccess={(response) => {
                console.log('Login Success!', response);
            }}

            // 2. GET DATA HERE (Important!)
            onProfileSuccess={(response) => {
                console.log('Profile Data:', response); 
                
                // Construct the data object manually to ensure fields match
                const userData = {
                    accessToken: "token_placeholder", // Backend doesn't verify this yet, so placeholder is fine
                    userID: response.id,              // Library uses 'id', your backend wants 'userID'
                    name: response.name,
                    email: response.email,
                    picture: response.picture?.data?.url // Extract the URL safely
                };

                // 3. Call your existing handler with the correct data
                responseFacebook(userData);
            }}

            onFail={(error) => {
                console.log('Login Failed!', error);
                setErrorMsg("Facebook login failed.");
            }}

            render={({ onClick }) => (
                <button className="social-btn" onClick={onClick}>
                    <FbIcon /> Continue with Facebook
                </button>
            )}
        />

        <button className="social-btn" onClick={() => googleLogin()}>
          <GoogleIcon /> Continue with Google
        </button>

        <button className="social-btn" onClick={() => googleLogin()}>
          <GmailIcon /> Continue with Gmail
        </button>

        <div className="divider"><span>or</span></div>

        <button className="primary-btn" onClick={() => {setErrorMsg(''); setView('login');}}>
          Sign in with Phone number
        </button>

        <div className="bottom-text">
          Don’t have an account? 
          <span className="highlight-link" onClick={() => {setErrorMsg(''); setView('signup');}}>Sign up</span>
        </div>
      </div>
    );
  }

  // --- VIEW 2: LOGIN SCREEN ---
  if (view === 'login') {
    return (
      <div className="login-container">
        <button className="back-icon" onClick={() => setView('welcome')}>←</button>
        <div className="logo-large"><span style={{fontSize: '4rem'}}>🥗</span></div>
        <h1 className="login-title" style={{fontSize: '1.5rem'}}>Login to your account</h1>

        {errorMsg && <div style={{color: 'red', marginBottom: '10px', fontSize: '0.9rem'}}>{errorMsg}</div>}

        <div className="input-group">
          <div className="input-icon"><PhoneIcon /></div>
          <input 
            type="text" 
            className="custom-input" 
            placeholder="Phone number" 
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {renderPasswordInput("Password", "password")}

        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" /> Remember me
          </label>
          <span 
            className="forgot-pass" 
            style={{cursor: 'pointer'}} 
            onClick={() => {setErrorMsg(''); setFormData({...formData, password:'', confirmPassword:''}); setView('forgot');}}
          >
            Forget password?
          </span>
        </div>

        <button className="primary-btn" onClick={handleLoginSubmit} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="bottom-text">
          Don’t have an account? 
          <span className="highlight-link" onClick={() => {setErrorMsg(''); setView('signup');}}>Sign up</span>
        </div>
      </div>
    );
  }

  // --- VIEW 3: SIGNUP SCREEN ---
  if (view === 'signup') {
    return (
      <div className="login-container">
        <button className="back-icon" onClick={() => setView('welcome')}>←</button>
        <div className="logo-large"><span style={{fontSize: '4rem'}}>🥗</span></div>
        <h1 className="login-title" style={{fontSize: '1.5rem'}}>Create new account</h1>

        {errorMsg && <div style={{color: 'red', marginBottom: '10px', fontSize: '0.9rem'}}>{errorMsg}</div>}

        <div className="input-group">
          <div className="input-icon"><UserIcon /></div>
          <input 
            type="text" 
            className="custom-input" 
            placeholder="Username" 
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <div className="input-icon"><PhoneIcon /></div>
          <input 
            type="tel" 
            className="custom-input" 
            placeholder="Phone number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {renderPasswordInput("Password", "password")}

        <div className="form-options">
           <label className="remember-me">
            <input type="checkbox" /> Remember me
          </label>
        </div>

        <button className="primary-btn" onClick={handleSignupSubmit} disabled={loading}>
           {loading ? "Signing up..." : "Sign up"}
        </button>

        <div className="bottom-text">
          Already have an account? 
          <span className="highlight-link" onClick={() => {setErrorMsg(''); setView('login');}}>Sign in</span>
        </div>
      </div>
    );
  }

  // --- VIEW 4: FORGOT PASSWORD SCREEN ---
  if (view === 'forgot') {
    return (
      <div className="login-container">
        <button className="back-icon" onClick={() => setView('login')}>←</button>
        <div className="logo-large"><span style={{fontSize: '4rem'}}>🔐</span></div>
        <h1 className="login-title" style={{fontSize: '1.5rem'}}>Reset Password</h1>
        <p style={{marginBottom: '20px', color: '#666', textAlign: 'center', fontSize: '0.9rem'}}>
            Enter your phone number and new password below.
        </p>

        {errorMsg && <div style={{color: 'red', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center'}}>{errorMsg}</div>}

        <div className="input-group">
          <div className="input-icon"><PhoneIcon /></div>
          <input 
            type="tel" 
            className="custom-input" 
            placeholder="Phone number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {renderPasswordInput("New Password", "password")}
        {renderPasswordInput("Confirm Password", "confirmPassword")}

        <button className="primary-btn" onClick={handleResetSubmit} disabled={loading}>
           {loading ? "Updating..." : "Reset Password"}
        </button>
      </div>
    );
  }

  return null;
}

export default LoginPage;
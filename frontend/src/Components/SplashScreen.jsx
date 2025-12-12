// src/components/SplashScreen.jsx
import React, { useEffect, useState } from 'react';
import './SplashScreen.css'; 

// Import ảnh Logo từ thư mục assets
// Lưu ý: Dấu ../ nghĩa là lùi ra khỏi thư mục components để tìm thư mục assets
import logo from '../assets/images/logo.png'; 

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Chờ 4 giây cho người dùng ngắm logo
    const timerWait = setTimeout(() => {
      setIsFadingOut(true); 
    }, 3000); 

    // 2. Chờ thêm 0.8 giây cho hiệu ứng mờ dần (CSS transition) chạy xong
    // Tổng cộng là 3.8 giây
    const timerFinish = setTimeout(() => {
      if (onFinish) {
        onFinish(); 
      }
    }, 3800);

    return () => {
      clearTimeout(timerWait);
      clearTimeout(timerFinish);
    };
  }, [onFinish]);

  return (
    <div className={`splash-container ${isFadingOut ? 'hidden' : ''}`}>
      <div className="splash-content">
        
        {/* Ảnh Logo */}
        <img src={logo} alt="FoodRec Logo" className="splash-logo" />

        {/* Chữ Code */}
        <h1 className="splash-title">FoodRec</h1>

      </div>
    </div>
  );
}
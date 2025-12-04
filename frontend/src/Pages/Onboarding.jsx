// src/pages/OnboardingPage.jsx
import React, { useState } from 'react';
import './Onboarding.css'; // File CSS vẫn để chung thư mục pages

// Import Component nút bấm từ thư mục components
import CommonButton from '../Components/CommonButton';

// Import ảnh từ thư mục assets
import img1 from '../assets/images/onboarding/intro_1.png';
import img2 from '../assets/images/onboarding/intro_2.png';
import img3 from '../assets/images/onboarding/intro_2.png'; // Nếu có gif thì đổi đuôi .gif
import img4 from '../assets/images/onboarding/intro_2.png';

export default function OnboardingPage({ onFinish }) {
  const [step, setStep] = useState(0);

  const stepsData = [
    {
      // TRANG 0: WELCOME
      image: img1,
      title: "WELCOME TO\nFoodRec!👋",
      desc: "\"Welcome to FoodRec. We turn your cravings into concrete plans. Whether you need a Quick Pick or a personalized Flavor Profile match, your perfect meal is just a tap away.\"",
      btnText: "" 
    },
    {
      // TRANG 1
      image: img2,
      title: "Explore Local Flavors",
      desc: "Unlock a world of authentic tastes! FoodRec helps you discover hidden culinary gems and popular local eateries wherever your travels take you.",
      btnText: "Next"
    },
    {
      // TRANG 2
      image: img3,
      title: "Personalized Picks",
      desc: "No more endless scrolling! Get instant recommendations tailored to your mood, cravings, and dietary preferences. Your perfect meal, found in seconds.",
      btnText: "Next"
    },
    {
      // TRANG 3
      image: img4,
      title: "Decide with Ease",
      desc: "Whether you're after a Quick Pick or a detailed Flavor Profile, we make choosing where to eat effortless. Spend less time planning, more time enjoying.",
      btnText: "Get started!"
    }
  ];

  // Hàm chuyển bước tiếp theo
  const handleNext = () => {
    if (step < stepsData.length - 1) {
      setStep(step + 1);
    } else {
      // Nếu là bước cuối (Trang 4) -> Gọi onFinish để vào Random
      onFinish(); 
    }
  };

  // Hàm Skip: Bấm phát là gọi onFinish luôn
  const handleSkip = () => {
    onFinish();
  };

  const currentData = stepsData[step];

  // --- RENDER TRANG 0 (WELCOME - Click màn hình để next) ---
  if (step === 0) {
    return (
      <div 
        className="onboarding-container step-0" 
        onClick={handleNext} 
        style={{ backgroundImage: `url(${currentData.image})` }}
      >
        <div className="overlay"></div>
        <div className="content-step-0">
          <h1 className="title-step-0">
            {currentData.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br/></span>
            ))}
          </h1>
          <p className="desc-step-0">{currentData.desc}</p>
        </div>
      </div>
    );
  }

  // --- RENDER TRANG 2, 3, 4 (Có nút Next và Skip) ---
  return (
    <div className="onboarding-container step-common">
      <div className="bubble b1"></div>
      <div className="bubble b2"></div>
      <div className="bubble b3"></div>

      <div className="image-area">
        <img src={currentData.image} alt="Onboarding" className="main-image" />
      </div>

      <div className="text-area">
        <h2 className="title-common">{currentData.title}</h2>
        <p className="desc-common">{currentData.desc}</p>

        {/* Nút Next / Get Started */}
        <CommonButton 
          text={currentData.btnText} 
          onClick={handleNext} 
        />

        {/* Nút Skip -> Bay thẳng tới Random */}
        <button className="btn-skip" onClick={handleSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import './Onboarding.css'; 
import CommonButton from '../Components/CommonButton';
import img1 from '../assets/images/onboarding/intro_1.png';
import img2 from '../assets/images/onboarding/intro_2.png';
import img3 from '../assets/images/onboarding/intro_2.png';
import img4 from '../assets/images/onboarding/intro_2.png';
import { useLanguage } from '../Context/LanguageContext'; // Import Context

export default function OnboardingPage({ onFinish }) {
  const [step, setStep] = useState(0);
  const { t } = useLanguage(); // Lấy hàm dịch

  const stepsData = [
    { image: img1, title: t('ob_title_0'), desc: t('ob_desc_0'), btnText: "" },
    { image: img2, title: t('ob_title_1'), desc: t('ob_desc_1'), btnText: t('next') },
    { image: img3, title: t('ob_title_2'), desc: t('ob_desc_2'), btnText: t('next') },
    { image: img4, title: t('ob_title_3'), desc: t('ob_desc_3'), btnText: t('get_started') }
  ];

  const handleNext = () => { if (step < stepsData.length - 1) setStep(step + 1); else onFinish(); };
  const handleSkip = () => { onFinish(); };
  const currentData = stepsData[step];

  if (step === 0) {
    return (
      <div className="onboarding-container step-0" onClick={handleNext} style={{ backgroundImage: `url(${currentData.image})` }}>
        <div className="overlay"></div>
        <div className="content-step-0">
          <h1 className="title-step-0">{currentData.title.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</h1>
          <p className="desc-step-0">{currentData.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container step-common">
      <div className="bubble b1"></div><div className="bubble b2"></div><div className="bubble b3"></div>
      <div className="image-area"><img src={currentData.image} alt="Onboarding" className="main-image" /></div>
      <div className="text-area">
        <h2 className="title-common">{currentData.title}</h2>
        <p className="desc-common">{currentData.desc}</p>
        <CommonButton text={currentData.btnText} onClick={handleNext} />
        <button className="btn-skip" onClick={handleSkip}>{t('skip')}</button>
      </div>
    </div>
  );
}
// src/AppChooseMode.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './Context/LanguageContext';

// Import Assets
import logo from './assets/images/logo.png';
import diceIMG from './assets/images/Mode-Icon/dice.png';
import compassIMG from './assets/images/Mode-Icon/akinator.png';

// Import CSS
import './AppChooseMode.css';

function AppChooseMode({ onRandom, onTaste, currentUser }) {
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Lấy thông tin user, nếu không có (Guest) thì mặc định là "Guest"
    const username = currentUser?.username || "Guest";
    const avatar = currentUser?.avatar || logo;

    return (
        <div className="choose-mode-container">
            {/* 1. Header Area - Click vào User Info để đi tới Profile */}
            <div className="home-header">
                <div 
                    className="header-user" 
                    onClick={() => navigate('/profile')} 
                    style={{ cursor: 'pointer' }}
                    title="View Profile"
                >
                    <img
                        src={avatar}
                        className="header-avatar"
                        alt="User"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.target.src = logo; }}
                    />
                    <span>{t('hi')} {username}!</span>
                </div>
                
                {/* Logo App ở góc phải */}
                <img src={logo} style={{ width: 30 }} alt="FoodRec Logo" />
            </div>

            {/* 2. Search Bar Section */}
            <div style={{ position: 'relative', marginTop: '10px' }}>
                <span style={{ position: 'absolute', left: 15, top: 13 }}>🔍</span>
                <input 
                    className="home-search" 
                    placeholder={t('search_placeholder')} 
                />
            </div>

            {/* 3. Quick Pick Chips (Horizontal Scroll) */}
            <h3 style={{ marginTop: '20px' }}>{t('quick_picks_title')}</h3>
            <div className="chips-container">
                <div className="chip">Sticky Rice</div>
                <div className="chip">Pho</div>
                <div className="chip">Banh Mi</div>
                <div className="chip">Coffee</div>
                <div className="chip">Broken Rice</div>
            </div>

            {/* 4. Selection Mode Cards */}
            
            {/* Random Mode Card (Quick Pick) */}
            <div className="mode-card-new card-green" onClick={onRandom}>
                <img src={diceIMG} className="card-3d-icon" alt="Random Mode" />
                <div className="card-text-content">
                    <h2>{t('quick_pick_card')}</h2>
                    <p>{t('quick_pick_desc')}</p>
                </div>
            </div>

            {/* Taste Mode Card (Akinator Style) */}
            <div className="mode-card-new card-yellow" onClick={onTaste}>
                <img src={compassIMG} className="card-3d-icon" alt="Taste Mode" />
                <div className="card-text-content">
                    <h2>{t('taste_card')}</h2>
                    <p>{t('taste_desc')}</p>
                </div>
            </div>
        </div>
    );
}

export default AppChooseMode;
import React from 'react';
import { useLanguage } from './Context/LanguageContext';
import logo from './assets/images/logo.png';
import diceIMG from './assets/images/Mode-Icon/dice.png'
import compassIMG from './assets/images/Mode-Icon/akinator.png'
import './AppChooseMode.css';

function AppChooseMode({ onRandom, onTaste, currentUser }) {
    const { t } = useLanguage();
    const username = currentUser?.username || "HeppiHehe";
    const avatar = currentUser?.avatar || logo;

    return (
        <div className="choose-mode-container">
            {/* 1. Header */}
            <div className="home-header">
                <div className="header-user">
                    <img
                        src={avatar}
                        className="header-avatar"
                        alt="User"
                        referrerPolicy="no-referrer"
                    />
                    <span>{t('hi')} {username}!</span>
                </div>
                <img src={logo} style={{ width: 30 }} alt="Logo" />
            </div>

            {/* 2. Search */}
            <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 15, top: 13 }}>🔍</span>
                <input className="home-search" placeholder={t('search_placeholder')} />
            </div>

            {/* 3. Chips */}
            <h3>{t('quick_picks_title')}</h3>
            <div className="chips-container">
                <div className="chip">Sticky Rice</div>
                <div className="chip">Pho</div>
                <div className="chip">Banh Mi</div>
                <div className="chip">Coffee</div>
            </div>

            {/* 4. Cards */}
            <div className="mode-card-new card-green" onClick={onRandom}>
                <img src={diceIMG} className="card-3d-icon" alt="Random" />
                <h2>{t('quick_pick_card')}</h2>
                <p>{t('quick_pick_desc')}</p>
            </div>

            <div className="mode-card-new card-yellow" onClick={onTaste}>
                <img src={compassIMG} className="card-3d-icon" alt="Taste" />
                <h2>{t('taste_card')}</h2>
                <p>{t('taste_desc')}</p>
            </div>
        </div>
    );
}

export default AppChooseMode;

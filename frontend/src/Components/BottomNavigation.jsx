import React from 'react';
import './BottomNavigation.css';

// Icons SVG
const IconHome = () => <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const IconUser = () => <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;

export default function BottomNavigation({ activeTab, onTabChange }) {
    return (
        <div className="btm-nav-container">
            {/* Nút Home */}
            <div 
                className={`btm-nav-item ${activeTab === 'home' ? 'active' : ''}`} 
                onClick={() => onTabChange('home')}
            >
                <div className="btm-nav-pill">
                    <div className="btm-nav-icon"><IconHome /></div>
                </div>
            </div>

            {/* Nút Profile */}
            <div 
                className={`btm-nav-item ${activeTab === 'profile' ? 'active' : ''}`} 
                onClick={() => onTabChange('profile')}
            >
                <div className="btm-nav-pill">
                    <div className="btm-nav-icon"><IconUser /></div>
                </div>
            </div>
        </div>
    );
}
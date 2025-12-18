import React, { useState, useEffect } from 'react';
import './RestaurantDetail.css';
import logo from './assets/images/logo.png';
import axios from 'axios';
import { useLanguage } from './Context/LanguageContext'; // Import Context

// ... (Giữ nguyên phần Icons như cũ) ...
const Icons = {
    Back: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Star: ({ fill = "none" }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
    BookmarkFlag: ({ filled }) => (<svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#00AA00"} strokeWidth="2"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>),
    Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    PinSmall: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Map: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>,
    Refresh: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
};

export default function RestaurantDetail({ item, onBack, onShuffleAgain, onGetDirection, currentUser }) {
    const { t } = useLanguage(); // Dùng t() để dịch
    const [activeTab, setActiveTab] = useState('menu');
    const [sliderIndex, setSliderIndex] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSaved, setIsSaved] = useState(false);

    const userId = currentUser?.phone || currentUser?.email || currentUser?.facebook_id;
    const API_URL = "http://127.0.0.1:8000/api/user";

    const imagesMenu = item.imagesMenu?.length > 0 ? item.imagesMenu : [item.imageUrl];
    const imagesView = item.imagesViews?.length > 0 ? item.imagesViews : [item.imageUrl];
    const currentImages = activeTab === 'menu' ? imagesMenu : imagesView;
    
    // MAP TAGS: Dịch từng tag
    const displayTags = (item.tags || []).map(rawTag => ({
        label: t(rawTag), // Dịch sang ngôn ngữ hiện tại
        val: rawTag
    }));

    useEffect(() => {
        const checkBookmarkStatus = async () => {
            if (!userId) return;
            try {
                const res = await axios.get(`${API_URL}/${userId}`);
                const bookmarks = res.data.bookmark_items || [];
                const found = bookmarks.some(b => b.id === item.id);
                setIsSaved(found);
            } catch (e) { console.error(e); }
        };
        checkBookmarkStatus();
    }, [userId, item.id]);

    const handleBookmark = async () => {
        if (!userId) return alert("Please login first!");
        const previousState = isSaved;
        setIsSaved(!isSaved);
        try {
            const res = await axios.post(`${API_URL}/${userId}/bookmark`, { restaurant_id: item.id });
            if (res.data.status === 'added') setIsSaved(true);
            else if (res.data.status === 'removed') setIsSaved(false);
        } catch (e) { setIsSaved(previousState); }
    };

    const handleStartNav = () => {
        if (userId) {
            axios.post(`${API_URL}/${userId}/history`, { restaurant_id: item.id }).catch(e => console.error(e));
        }
        onGetDirection();
    };

    useEffect(() => {
        const timer = setInterval(() => setSliderIndex(prev => (prev + 1) % currentImages.length), 3000);
        return () => clearInterval(timer);
    }, [currentImages]);

    return (
        <div className="rd-container">
            <div className="rd-header">
                <button className="rd-back-btn" onClick={onBack}><Icons.Back /></button>
                <h2 className="rd-header-title">{item.name}</h2>
                <div className="rd-header-logo"><img src={logo} alt="logo" style={{height:'45px'}}/></div>
            </div>

            <div className="rd-tabs">
                <button className={`rd-tab ${activeTab==='menu'?'active':''}`} onClick={()=>{setActiveTab('menu');setSliderIndex(0)}}>{t('menu')}</button>
                <button className={`rd-tab ${activeTab==='view'?'active':''}`} onClick={()=>{setActiveTab('view');setSliderIndex(0)}}>{t('view')}</button>
            </div>

            <div className="rd-slider-container">
                <img src={currentImages[sliderIndex]} className="rd-slider-img" alt="slide" onError={e=>e.target.src='https://placehold.co/400x250'} />
                <div className="rd-dots">{currentImages.map((_, i) => <span key={i} className={`rd-dot ${i===sliderIndex?'active':''}`} onClick={()=>setSliderIndex(i)}></span>)}</div>
            </div>

            <div className="rd-info-section">
                <div className="rd-title-row">
                    <h1 className="rd-name">{item.name}</h1>
                    <div onClick={handleBookmark} style={{cursor:'pointer', transform:'scale(1.1)'}}><Icons.BookmarkFlag filled={isSaved} /></div>
                </div>
                <div className="rd-rating-row">
                    {[1,2,3,4,5].map(s => <Icons.Star key={s} fill={s<=item.rating ? "#FFC107" : "#eee"} />)}
                    <span className="rd-rating-num">{item.rating}</span>
                </div>
                <div className="rd-detail-row"><div className="rd-icon-box"><Icons.PinSmall /></div><span className="rd-detail-text">{item.address}</span></div>
                <div className="rd-detail-row"><div className="rd-icon-box"><Icons.Clock /></div><span className="rd-detail-text">{item.openTime || "07:00 - 22:00"}</span></div>
            </div>

            <div className="rd-tags-box">
                <div className="rd-tags-grid">
                    {displayTags.map((t, i) => (
                        <button key={i} className={`rd-tag-chip ${selectedTags.includes(t.val)?'selected':''}`} onClick={()=>setSelectedTags(prev=>prev.includes(t.val)?prev.filter(x=>x!==t.val):[...prev,t.val])}>#{t.label}</button>
                    ))}
                </div>
            </div>

            <div className="rd-footer">
                <button className="rd-btn-direction" onClick={handleStartNav}>{t('get_direction')} <span style={{marginLeft:'8px', display:'flex'}}><Icons.Map /></span></button>
                <div className="rd-shuffle-again" onClick={onShuffleAgain}><span>{t('shuffle_again')}</span><Icons.Refresh /></div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import './RestaurantDetail.css';
import logo from './assets/images/logo.png'; // Đảm bảo đường dẫn logo đúng

// --- Icons riêng cho trang Detail ---
const Icons = {
    Back: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Star: ({ fill = "none" }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
    BookmarkFilled: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="#00AA00" stroke="#00AA00" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
    Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    PinSmall: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Map: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>,
    Refresh: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
};

export default function RestaurantDetail({ item, onBack, onShuffleAgain, onGetDirection}) {
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'view'
    const [sliderIndex, setSliderIndex] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);

    // Dữ liệu giả lập hình ảnh nếu thiếu
    const imagesMenu = item.imagesMenu && item.imagesMenu.length > 0 ? item.imagesMenu : [item.imageUrl, item.imageUrl];
    const imagesView = item.imagesViews && item.imagesViews.length > 0 ? item.imagesViews : [item.imageUrl];
    const currentImages = activeTab === 'menu' ? imagesMenu : imagesView;

    // Danh sách tag demo (kết hợp tag của món và tag tĩnh như mockup)
    const displayTags = [
        ...(item.tags || []).map(t => ({label: t, val: t})),
        {label: '<1km', val: 'dist'}, 
        {label: 'SaiGon', val: 'loc'}, 
        {label: 'Open24/7', val: 'open'}, 
        {label: '<100.000VND', val: 'cheap'},
        {label: 'Take away', val: 'takeaway'}
    ];

    // Logic chọn tag (Đổi màu nền)
    const toggleTag = (tagVal) => {
        if(selectedTags.includes(tagVal)) {
            setSelectedTags(selectedTags.filter(t => t !== tagVal));
        } else {
            setSelectedTags([...selectedTags, tagVal]);
        }
    };

    // Auto run slider mỗi 3 giây
    useEffect(() => {
        const timer = setInterval(() => {
            setSliderIndex(prev => (prev + 1) % currentImages.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [currentImages]);

    if (!item) return null;

    return (
        <div className="rd-container">
            {/* Header */}
            <div className="rd-header">
                <button className="rd-back-btn" onClick={onBack}><Icons.Back /></button>
                <h2 className="rd-header-title">{item.name}</h2>
                <div className="rd-header-logo">
                     <img src={logo} alt="logo" style={{height:'45px'}}/>
                </div>
            </div>

            {/* Tabs Pill (Menu / View) */}
            <div className="rd-tabs">
                <button className={`rd-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => {setActiveTab('menu'); setSliderIndex(0);}}>
                    Menu ({imagesMenu.length})
                </button>
                <button className={`rd-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => {setActiveTab('view'); setSliderIndex(0);}}>
                    View ({imagesView.length})
                </button>
            </div>

            {/* Image Slider */}
            <div className="rd-slider-container">
                <img src={currentImages[sliderIndex]} alt="Slide" className="rd-slider-img" onError={(e) => e.target.src='https://placehold.co/400x250'} />
                <div className="rd-dots">
                    {currentImages.map((_, idx) => (
                        <span key={idx} className={`rd-dot ${idx === sliderIndex ? 'active' : ''}`} onClick={() => setSliderIndex(idx)}></span>
                    ))}
                </div>
            </div>

            {/* Info Section */}
            <div className="rd-info-section">
                <div className="rd-title-row">
                    <h1 className="rd-name">{item.name}</h1>
                    <div className="rd-bookmark-icon"><Icons.BookmarkFilled /></div>
                </div>
                
                <div className="rd-rating-row">
                    {[1,2,3,4,5].map(s => <Icons.Star key={s} fill={s<=item.rating ? "#FFC107" : "#eee"} />)}
                    <span className="rd-rating-num">{item.rating}</span>
                </div>

                <div className="rd-detail-row">
                    <div className="rd-icon-box"><Icons.PinSmall /></div>
                    <span className="rd-detail-text">Address: {item.address || "197A Nguyễn Trãi, District 1, HCMC"}</span>
                </div>
                <div className="rd-detail-row">
                    <div className="rd-icon-box"><Icons.Clock /></div>
                    <span className="rd-detail-text">Open: {item.openTime || "07:00 AM - 11:00 PM"}</span>
                </div>
            </div>

            {/* Tags Box (Nền trắng -> Xanh khi click) */}
            <div className="rd-tags-box">
                <div className="rd-tag-header">
                    <span className="rd-tag-label">Tag</span>
                    <span className="rd-tag-title">Information</span>
                </div>
                <div className="rd-tags-grid">
                    {displayTags.map((tag, i) => {
                        const isSelected = selectedTags.includes(tag.val);
                        return (
                            <button 
                                key={i} 
                                className={`rd-tag-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleTag(tag.val)}
                            >
                                #{tag.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="rd-footer">
                <button className="rd-btn-direction" onClick = {onGetDirection}>
                    Get direction <span style={{marginLeft:'8px', display:'flex'}}><Icons.Map /></span>
                </button>
                <div className="rd-shuffle-again" onClick={onShuffleAgain}>
                    <span>Shuffle Again</span>
                    <Icons.Refresh />
                </div>
            </div>
        </div>
    );
}
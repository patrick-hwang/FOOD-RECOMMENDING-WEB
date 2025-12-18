import React, { useState } from 'react';
import './RestaurantDetail.css';
import myLogoIcon from './assets/images/logo.png';
// --- BỘ ICON GIỮ NGUYÊN ---
const DetailIcons = {
  Back: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>),
  Star: ({ fill }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  Bookmark: () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="#00AA55" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
  Pin: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>),
  Clock: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>),
  Map: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>),
  Refresh: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2.5"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>),
  ForkSpoon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="#00AA55" stroke="none"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>),
  UserAvatar: () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="#ddd" stroke="#999" strokeWidth="1"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>)
};

const RestaurantDetail = ({ item, onBack, onShuffleAgain, onGetDirection, activeTags = [], onToggleTag }) => {
  // --- STATE QUẢN LÝ TAB ---
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'view' | 'review'

  // Dữ liệu mẫu (Tags)
  const defaultTags = ["#Localspecility", "#Open24/7", "#Takeaway", "#BanhMi", "#Vietnamese", "#<100.000VND", "#Take away"];
  const displayTags = item?.tags || defaultTags;

  // Dữ liệu mẫu (Views - Ảnh)
  const mockViews = [
    "https://placehold.co/300x300?text=View+1",
    "https://placehold.co/300x300?text=View+2",
    "https://placehold.co/300x300?text=Food+1",
    "https://placehold.co/300x300?text=Food+2",
    "https://placehold.co/300x300?text=Atmosphere",
    "https://placehold.co/300x300?text=Menu",
  ];

  // Dữ liệu mẫu (Reviews)
 const mockReviews = [
  { id: 1, name: "Name", rating: 4, comment: "Highly recommmend for tourists - who would liek to try Phở with Saigon's tasting." },
  { id: 2, name: "Name", rating: 5, comment: "Highly recommmend for tourists - who would liek to try Phở with Saigon's tasting." },
  { id: 3, name: "Name", rating: 4, comment: "Highly recommmend for tourists - who would liek to try Phở with Saigon's tasting." },
];

  // --- RENDER CONTENT CHO TỪNG TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <>
            {/* Image Slider */}
            <div className="rd-image-card">
              <img 
                src={item?.imageUrl || "https://placehold.co/600x400/png"} 
                alt="Food" 
                className="rd-main-img"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Image'; }}
              />
              <div className="rd-dots-indicator">
                  <span className="dot active"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
              </div>
            </div>

            {/* Info */}
            <div className="rd-info-container">
                <div className="rd-name-row">
                    <h2 className="rd-item-name">{item?.name || "Restaurant Name"}</h2>
                    <div className="rd-bookmark-icon"><DetailIcons.Bookmark /></div>
                </div>

                <div className="rd-rating-row">
                    {[1,2,3,4].map(star => <DetailIcons.Star key={star} fill="#FFC107" />)}
                    <DetailIcons.Star fill="#E0E0E0" />
                    <span className="rd-rating-num">{item?.rating || 4.0}</span>
                </div>

                <div className="rd-address-row">
                    <div className="rd-icon-col"><DetailIcons.Pin /></div>
                    <span className="rd-text-info">Address: {item?.address || "197A Nguyễn Trãi, District 1, HCMC"}</span>
                </div>
                
                <div className="rd-address-row">
                    <div className="rd-icon-col"><DetailIcons.Clock /></div>
                    <span className="rd-text-info">Open: 07:00 AM - 11:00 PM</span>
                </div>
            </div>

            {/* Tags (Chỉ hiện ở tab Menu) */}
            <div className="rd-tags-wrapper">
                <div className="rd-tags-green-header">
                    Tag information & Filters
                </div>
                <div className="rd-tags-content">
                    <p className="rd-tags-note">Tap tags to select</p>
                    <div className="rd-tags-list">
                        {displayTags.map((tagWithHash, i) => {
                            const rawTag = tagWithHash.replace(/^#/, '');
                            const isActive = activeTags.includes(rawTag);
                            return (
                                <button 
                                    key={i} 
                                    className={`rd-tag-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => onToggleTag && onToggleTag(tagWithHash)}
                                >
                                    {tagWithHash}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
          </>
        );

      case 'view':
        return (
          <div className="rd-view-container">
             <h3 className="rd-section-title">Photos ({mockViews.length})</h3>
             <div className="rd-view-grid">
                {mockViews.map((src, idx) => (
                  <div key={idx} className="rd-view-item">
                     <img src={src} alt={`view-${idx}`} loading="lazy" />
                  </div>
                ))}
             </div>
          </div>
        );

      case 'review':
        return (
            <div className="rd-review-container">
            {/* Ẩn tiêu đề số lượng nếu muốn giống hình, hoặc giữ lại tùy ý */}
            {/* <h3 className="rd-section-title">Reviews ({mockReviews.length})</h3> */}
            
            <div className="rd-review-list">
                {mockReviews.map((review) => (
                <div key={review.id} className="rd-review-card-green">
                    {/* CỘT TRÁI: AVATAR */}
                    <div className="rd-review-left">
                        {/* Dùng ảnh placeholder cartoon cho giống hình mẫu */}
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`} 
                            alt="avatar" 
                            className="rd-review-avatar-img"
                        />
                    </div>

                    {/* CỘT PHẢI: INFO + CONTENT */}
                    <div className="rd-review-right">
                        {/* Tên User */}
                        <div className="rd-review-name">{review.name}</div>
                        
                        {/* Hàng Sao (Stars) */}
                        <div className="rd-review-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <DetailIcons.Star 
                                    key={star} 
                                    // Nếu sao <= rating thì tô vàng, ngược lại để rỗng (stroke vàng)
                                    fill={star <= review.rating ? "#FFC107" : "none"} 
                                />
                            ))}
                        </div>

                        {/* Nội dung comment */}
                        <p className="rd-review-content">
                            {review.comment}
                        </p>
                    </div>
                </div>
                ))}
            </div>
            </div>
        );

      default: return null;
    }
  };

    return (
    <div className="rd-screen">
      
      {/* --- PHẦN 1: CỐ ĐỊNH Ở TRÊN (Header + Tabs) --- */}
      <div className="rd-fixed-top">
          {/* Header */}
          <div className="rd-header">
            <div className="rd-header-left" onClick={onBack}>
              <DetailIcons.Back />
            </div>
            <div className="rd-header-title-box">
                <span className="rd-header-text">{item?.name || "Banh Mi Ba Huynh"}</span>
            </div>
            <div className="rd-header-right">
                <img 
                    src={myLogoIcon} 
                    alt="Logo" 
                    className="rd-custom-logo" 
                />
            </div>
          </div>

          {/* Tabs */}
          <div className="rd-tabs-row">
            <button 
              className={`rd-tab ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              Menu (7)
            </button>
            <button 
              className={`rd-tab ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              View ({mockViews.length})
            </button>
            <button 
              className={`rd-tab ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              Review ({mockReviews.length})
            </button>
          </div>
      </div>

      {/* --- PHẦN 2: CUỘN Ở GIỮA (Nội dung) --- */}
      <div className="rd-scroll-view">
         {renderContent()}
      </div>

      {/* --- PHẦN 3: CỐ ĐỊNH Ở DƯỚI (Footer) --- */}
      <div className="rd-footer-bar">
          <button className="rd-btn-direction" onClick={onGetDirection}>
              Get direction
              <span style={{marginLeft: 8, display: 'flex'}}><DetailIcons.Map /></span>
          </button>

          <div className="rd-shuffle-block" onClick={onShuffleAgain}>
              <span className="rd-shuffle-label">Shuffle Again</span>
              <div className="rd-spin-icon"><DetailIcons.Refresh /></div>
          </div>
      </div>

    </div>
);
};

export default RestaurantDetail;
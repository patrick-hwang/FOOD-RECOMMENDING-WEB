import React, { useState, useEffect, useMemo } from 'react';
import './RestaurantDetail.css';
import myLogoIcon from './assets/images/logo.png';
import axios from 'axios';
import { useLanguage } from './Context/LanguageContext';
import { useTheme } from './Context/ThemeContext';

// Icons reused from RestaurantDetail
const DetailIcons = {
  Back: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>),
  Star: ({ fill }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  BookmarkFlag: ({ filled }) => (<svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#00AA55"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
  Pin: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>),
  Clock: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>)
};

// Popup version: without ShuffleAgain, and without "Tap Tags to select" note
const PopupRestaurantDetail = ({ item, onBack, onGetDirection, activeTags = [], onToggleTag, currentUser, onLogout }) => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('menu');
  const [isSaved, setIsSaved] = useState(false);

  const API_URL = "http://127.0.0.1:8000/api/user";
  const userId = currentUser?.isGuest ? null : (currentUser?.phone || currentUser?.email || currentUser?.facebook_id);

  const getDisplayTags = () => {
    if (!item?.tags) {
      return [
        { raw: "Localspecility", display: "#Localspecility" },
        { raw: "Vietnamese", display: "#Vietnamese" }
      ];
    }
    const tags = item.tags;
    const result = [];
    const processTag = (tg) => {
      if (typeof tg === 'string') {
        const cleanKey = tg.startsWith('#') ? tg.slice(1) : tg;
        result.push({ raw: cleanKey, display: `#${t(cleanKey)}` });
      }
    };
    if (Array.isArray(tags)) {
      tags.forEach(processTag);
    } else if (typeof tags === 'object') {
      Object.values(tags).forEach(val => {
        if (Array.isArray(val)) val.forEach(processTag);
        else if (typeof val === 'string') processTag(val);
      });
    }
    return result.length > 0 ? result : [{ raw: "Restaurant", display: "#Restaurant" }];
  };

  const displayTags = useMemo(() => getDisplayTags(), [item, t]);

  const getViewImages = () => Array.isArray(item?.places_images) ? item.places_images : [];
  const restaurantViewImages = getViewImages();

  const menuImages = useMemo(() => (
    Array.isArray(item?.menu_images) && item.menu_images.length > 0 ? item.menu_images : []
  ), [item?.menu_images]);
  const [menuIndex, setMenuIndex] = useState(0);
  useEffect(() => { setMenuIndex(0); }, [item?.id]);
  const handlePrevMenuImage = () => setMenuIndex(prev => {
    const len = menuImages.length; if (len === 0) return 0; return (prev - 1 + len) % len;
  });
  const handleNextMenuImage = () => setMenuIndex(prev => {
    const len = menuImages.length; if (len === 0) return 0; return (prev + 1) % len;
  });

  const [modalImage, setModalImage] = useState(null);

  const mockReviews = [
    { id: 1, author: "Name", rating_text: "4/5", content: "Highly recommend for tourists who like to try Phở with Saigon's taste." },
    { id: 2, author: "Name", rating_text: "5/5", content: "Highly recommend for tourists who like to try Phở with Saigon's taste." },
    { id: 3, author: "Name", rating_text: "4/5", content: "Highly recommend for tourists who like to try Phở with Saigon's taste." },
  ];
  const reviews = Array.isArray(item?.reviews) ? item.reviews : mockReviews;

  const parseScoreToFloat = (score, defaultVal = 4.5) => {
    if (score == null) return defaultVal;
    const normalized = String(score).replace(',', '.');
    const num = parseFloat(normalized);
    if (Number.isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(5, num));
  };

  const normalizeReviewRating = (ratingTextOrNum) => {
    if (ratingTextOrNum == null) return null;
    const str = String(ratingTextOrNum).replace(',', '.');
    const match = str.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    const num = parseFloat(match[0]);
    if (Number.isNaN(num)) return null;
    return Math.max(0, Math.min(5, num));
  };

  const getOpeningHoursLines = (opening) => {
    if (!Array.isArray(opening) || opening.length === 0) return null;
    const normalizeHours = (h) => {
      if (!h) return '';
      let s = String(h).replace(/[\u2013\u2014\u2212]/g, '-');
      s = s.replace(/\s*-\s*/g, ' - ');
      return s.trim();
    };
    return opening.map((o) => {
      if (typeof o === 'string') return normalizeHours(o);
      const day = o?.day ?? '';
      const hours = normalizeHours(o?.hours ?? '');
      return [day, hours].filter(Boolean).join(': ');
    });
  };

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!userId || !item?.id) return;
      try {
        const res = await axios.get(`${API_URL}/${userId}`);
        const bookmarks = res.data.bookmark_items || [];
        const found = bookmarks.some(b => b.id === item.id || b._id === item.id);
        setIsSaved(found);
      } catch (e) {
        console.error("Check bookmark error:", e);
      }
    };
    checkBookmarkStatus();
  }, [userId, item?.id, API_URL]);

  const handleBookmarkClick = async () => {
    if (currentUser?.isGuest || !currentUser) {
      if (window.confirm(t('guest_action_alert'))) {
        if (onLogout) onLogout();
      }
      return;
    }
    const previousState = isSaved;
    setIsSaved(!isSaved);
    try {
      const rId = item.id || item._id;
      const res = await axios.post(`${API_URL}/${userId}/bookmark`, { restaurant_id: rId });
      if (res.data.status === 'added') setIsSaved(true);
      else if (res.data.status === 'removed') setIsSaved(false);
    } catch (e) {
      console.error(e);
      setIsSaved(previousState);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <>
            <div className="rd-image-card">
              <img
                src={(menuImages[menuIndex]) || "https://placehold.co/600x400?text=Restaurant"}
                alt="Food"
                className="rd-main-img"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Restaurant'; }}
                onClick={() => { const src = menuImages[menuIndex] || null; if (src) setModalImage(src); }}
              />
              {menuImages.length > 1 && (
                <>
                  <button className="rd-nav-btn prev" onClick={handlePrevMenuImage} aria-label="Previous image">‹</button>
                  <button className="rd-nav-btn next" onClick={handleNextMenuImage} aria-label="Next image">›</button>
                </>
              )}
              <div className="rd-dots-indicator">
                {(menuImages.length > 0 ? menuImages : [null]).map((_, i) => (
                  <span key={i} className={`dot ${i === menuIndex ? 'active' : ''}`} onClick={() => setMenuIndex(i)}></span>
                ))}
              </div>
            </div>

            <div className="rd-info-container">
              <div className="rd-name-row">
                <h2 className="rd-item-name">{item?.name || "Restaurant Name"}</h2>
                <div className="rd-bookmark-icon" onClick={handleBookmarkClick} style={{ cursor: 'pointer' }}>
                  <DetailIcons.BookmarkFlag filled={isSaved} />
                </div>
              </div>
              <div className="rd-rating-row">
                {(() => {
                  const score = parseScoreToFloat(item?.rating_info?.score, 4.5);
                  return (
                    <>
                      {[1, 2, 3, 4, 5].map(star => (
                        <DetailIcons.Star key={star} fill={star <= score ? "#FFC107" : "none"} />
                      ))}
                      <span className="rd-rating-num">{score.toFixed(1)}</span>
                    </>
                  );
                })()}
              </div>
              <div className="rd-address-row">
                <div className="rd-icon-col"><DetailIcons.Pin /></div>
                <span className="rd-text-info">{t('address')}: {item?.address || t('location_unknown')}</span>
              </div>
              <div className="rd-address-row">
                <div className="rd-icon-col"><DetailIcons.Clock /></div>
                {(() => {
                  const lines = getOpeningHoursLines(item?.opening_hours);
                  if (!lines) return (
                    <span className="rd-text-info">{t('open')}: {t('activehour_unknown')}</span>
                  );
                  return (
                    <div className="rd-text-info">
                      <div>{t('open')}:</div>
                      {lines.map((ln, idx) => (<div key={idx}>{ln}</div>))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Tags without the note text */}
            <div className="rd-tags-wrapper">
              <div className="rd-tags-green-header">{t('tag_info_filter')}</div>
              <div className="rd-tags-content">
                {/* Note removed in popup version */}
                <div className="rd-tags-list">
                  {displayTags.map((tagObj, i) => {
                    const isActive = activeTags.includes(tagObj.raw);
                    return (
                      <button
                        key={i}
                        className={`rd-tag-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onToggleTag && onToggleTag(tagObj.raw)}
                      >
                        {tagObj.display}
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
            <h3 className="rd-section-title">Photos ({restaurantViewImages.length})</h3>
            {restaurantViewImages.length === 0 ? (
              <div className="rd-no-images">{t('no_images') || 'Không có ảnh nào'}</div>
            ) : (
              <div className="rd-view-grid">
                {restaurantViewImages.map((src, idx) => (
                  <div key={idx} className="rd-view-item">
                    <img src={src} alt={`view-${idx}`} loading="lazy" referrerPolicy="no-referrer" onClick={() => setModalImage(src)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'review':
        return (
          <div className="rd-review-container">
            <div className="rd-review-list">
              {reviews.map((review, idx) => (
                <div key={review.id ?? idx} className="rd-review-card-green">
                  <div className="rd-review-left">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`} alt="avatar" className="rd-review-avatar-img" referrerPolicy="no-referrer" />
                  </div>
                  <div className="rd-review-right">
                    <div className="rd-review-name">{review.author || review.name}</div>
                    <div className="rd-review-stars">
                      {(() => {
                        const r = normalizeReviewRating(review.rating_text ?? review.rating) ?? 0;
                        return [1, 2, 3, 4, 5].map((star) => (
                          <DetailIcons.Star key={star} fill={star <= r ? "#FFC107" : "none"} />
                        ));
                      })()}
                    </div>
                    <p className="rd-review-content">{review.content ?? review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rd-screen">
      <div className="rd-fixed-top">
        <div className="rd-header">
          <div className="rd-header-left" onClick={onBack}><DetailIcons.Back /></div>
          <div className="rd-header-title-box"><span className="rd-header-text">{item?.name || "Banh Mi Ba Huynh"}</span></div>
          <div className="rd-header-right"><img src={myLogoIcon} alt="Logo" className="rd-custom-logo" /></div>
        </div>
        <div className="rd-tabs-row">
          <button className={`rd-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            {t('menu')} ({menuImages.length})
          </button>
          <button className={`rd-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>
            {t('view')} ({restaurantViewImages.length})
          </button>
          <button className={`rd-tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
            {t('review')} ({reviews.length})
          </button>
        </div>
      </div>

      <div className="rd-scroll-view">{renderContent()}</div>

      {modalImage && (
        <div className="rd-modal-overlay" onClick={() => setModalImage(null)}>
          <div className="rd-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-body" style={{ display: 'flex', justifyContent: 'center' }}>
              <img src={modalImage} alt="full" style={{ maxWidth: '90vw', maxHeight: '80vh' }} referrerPolicy="no-referrer" onError={(e) => { e.target.src = 'https://placehold.co/1200x800?text=Image'; }} />
            </div>
          </div>
        </div>
      )}

      {/* Footer: Only keep Get Direction; Shuffle removed */}
      <div className="rd-footer-bar">
        <button className="rd-btn-direction" onClick={onGetDirection}>
          {t('get_direction')}
        </button>
      </div>
    </div>
  );
};

export default PopupRestaurantDetail;

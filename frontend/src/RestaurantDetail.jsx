import React, { useState, useEffect, useMemo } from 'react';
import './RestaurantDetail.css';
import myLogoIcon from './assets/images/logo.png';
import axios from 'axios';
import { useLanguage } from './Context/LanguageContext';
import { useTheme } from './Context/ThemeContext';

// --- BỘ ICON GIỮ NGUYÊN ---
const DetailIcons = {
  Back: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>),
  Star: ({ fill }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  BookmarkFlag: ({ filled }) => (<svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#00AA55"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
  Pin: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>),
  Clock: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>),
  Map: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>),
  Refresh: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="2.5"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>),
  ForkSpoon: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="#00AA55" stroke="none"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" /></svg>),
  UserAvatar: () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="#ddd" stroke="#999" strokeWidth="1"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" /></svg>)
};

const RestaurantDetail = ({ item, onBack, onShuffleAgain, onGetDirection, activeTags = [], onToggleTag, currentUser, onLogout }) => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  // --- STATE QUẢN LÝ TAB ---
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'view' | 'review'
  const [isSaved, setIsSaved] = useState(false);

  const API_URL = "http://127.0.0.1:8000/api/user";
  const userId = currentUser?.isGuest ? null : (currentUser?.phone || currentUser?.email || currentUser?.facebook_id);

  // Xử lý tags từ backend: tags là object { category: [...], ... } hoặc mảng
  const getDisplayTags = () => {
    if (!item?.tags) {
      return ["#Localspecility", "#Open24/7", "#Takeaway", "#BanhMi", "#Vietnamese"];
    }
    const tags = item.tags;

    if (Array.isArray(tags)) {
      return tags.map(tg => {
        if (typeof tg !== 'string') return tg;
        const cleanKey = tg.startsWith('#') ? tg.slice(1) : tg;
        return `#${t(cleanKey)}`;
      });

    }
    if (typeof tags === 'object') {
      const result = [];
      Object.values(tags).forEach(val => {
        if (Array.isArray(val)) {
          val.forEach(tg => {
            if (typeof tg !== 'string') result.push(tg);
            else {
              const cleanKey = tg.startsWith('#') ? tg.slice(1) : tg;
              result.push(`#${t(cleanKey)}`);
              //result.push(typeof t === 'string' && !t.startsWith('#') ? `#${t}` : t)
            }
          });
        } else if (typeof val === 'string') {
          const cleanKey = val.startsWith('#') ? val.slice(1) : val;
          result.push(`#${t(cleanKey)}`);
          //result.push(val.startsWith('#') ? val : `#${val}`);
        }
      });
      return result.length > 0 ? result : ["#Restaurant"];
    }
    return ["#Restaurant"];
  };

  const displayTags = useMemo(() => {
    return getDisplayTags();
  }, [item, t]);

  // Dữ liệu mẫu (Views - Ảnh)
  const getViewImages = () => {
    const imgs = Array.isArray(item?.places_images) ? item.places_images : [];
    return imgs;
  };
  const restaurantViewImages = getViewImages();

  // --- MENU IMAGES SLIDER STATE ---
  const menuImages = useMemo(() => {
    return Array.isArray(item?.menu_images) && item.menu_images.length > 0
      ? item.menu_images
      : [];
  }, [item?.menu_images]);
  const [menuIndex, setMenuIndex] = useState(0);
  useEffect(() => { setMenuIndex(0); }, [item?.id]);
  const handlePrevMenuImage = () => {
    setMenuIndex((prev) => {
      const len = menuImages.length;
      if (len === 0) return 0;
      return (prev - 1 + len) % len;
    });
  };
  const handleNextMenuImage = () => {
    setMenuIndex((prev) => {
      const len = menuImages.length;
      if (len === 0) return 0;
      return (prev + 1) % len;
    });
  };

  // --- FULL IMAGE MODAL ---
  const [modalImage, setModalImage] = useState(null);

  // Dữ liệu mẫu (Reviews) & biến reviews từ item
  const mockReviews = [
    { id: 1, author: "Name", rating_text: "4/5", content: "Highly recommend for tourists who like to try Phở with Saigon's taste." },
    { id: 2, author: "Name", rating_text: "5/5", content: "Highly recommend for tourists who like to try Phở with Saigon's taste." },
    { id: 3, author: "Name", rating_text: "4/5", content: "Highly recommend for tourists who like to try Phở with Saigon's taste." },
  ];
  const reviews = Array.isArray(item?.reviews) ? item.reviews : mockReviews;

  // Helper: chuyển score thành số float (hỗ trợ dấu phẩy)
  const parseScoreToFloat = (score, defaultVal = 4.5) => {
    if (score == null) return defaultVal;
    const normalized = String(score).replace(',', '.');
    const num = parseFloat(normalized);
    if (Number.isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(5, num));
  };

  // Helper: lấy số sao từ rating_text hoặc số
  const normalizeReviewRating = (ratingTextOrNum) => {
    if (ratingTextOrNum == null) return null;
    const str = String(ratingTextOrNum).replace(',', '.');
    const match = str.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    const num = parseFloat(match[0]);
    if (Number.isNaN(num)) return null;
    return Math.max(0, Math.min(5, num));
  };

  // Helper: get opening hours as lines, normalize dash to " - "
  const getOpeningHoursLines = (opening) => {
    if (!Array.isArray(opening) || opening.length === 0) return null;
    const normalizeHours = (h) => {
      if (!h) return '';
      let s = String(h).replace(/[\u2013\u2014\u2212]/g, '-');
      s = s.replace(/\s*-\s*/g, ' - ');
      return s.trim();
    };
    return opening.map((o) => {
      if (typeof o === 'string') {
        return normalizeHours(o);
      }
      const day = o?.day ?? '';
      const hours = normalizeHours(o?.hours ?? '');
      return [day, hours].filter(Boolean).join(': ');
    });
  };

  // --- CHECK BOOKMARK STATUS ---
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!userId || !item?.id) return;
      try {
        const res = await axios.get(`${API_URL}/${userId}`);
        const bookmarks = res.data.bookmark_items || [];
        // Match by MongoDB ObjectId string
        const found = bookmarks.some(b => b.id === item.id || b._id === item.id);
        setIsSaved(found);
      } catch (e) {
        console.error("Check bookmark error:", e);
      }
    };
    checkBookmarkStatus();
  }, [userId, item?.id, API_URL]);

  // --- HANDLE BOOKMARK CLICK ---
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
      const res = await axios.post(`${API_URL}/${userId}/bookmark`, {
        restaurant_id: rId
      });
      if (res.data.status === 'added') setIsSaved(true);
      else if (res.data.status === 'removed') setIsSaved(false);
    } catch (e) {
      console.error(e);
      setIsSaved(previousState);
    }
  };

  // --- RENDER CONTENT CHO TỪNG TAB ---
  const renderContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <>
            {/* Image Slider */}
            <div className="rd-image-card">
              <img
                src={
                  (menuImages[menuIndex])
                  || "https://placehold.co/600x400?text=Restaurant"
                }
                alt="Food"
                className="rd-main-img"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Restaurant'; }}
                onClick={() => {
                  const src = menuImages[menuIndex] || null;
                  if (src) setModalImage(src);
                }}
              />
              {menuImages.length > 1 && (
                <>
                  <button className="rd-nav-btn prev" onClick={handlePrevMenuImage} aria-label="Previous image">‹</button>
                  <button className="rd-nav-btn next" onClick={handleNextMenuImage} aria-label="Next image">›</button>
                </>
              )}
              <div className="rd-dots-indicator">
                {(menuImages.length > 0 ? menuImages : [null]).map((_, i) => (
                  <span
                    key={i}
                    className={`dot ${i === menuIndex ? 'active' : ''}`}
                    onClick={() => setMenuIndex(i)}
                  ></span>
                ))}
              </div>
            </div>

            {/* Info */}
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
                      {lines.map((ln, idx) => (
                        <div key={idx}>{ln}</div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Tags (Chỉ hiện ở tab Menu) */}
            <div className="rd-tags-wrapper">
              <div className="rd-tags-green-header">
                {t('tag_info_filter')}
              </div>
              <div className="rd-tags-content">
                <p className="rd-tags-note">{t('tap_tag_select')}</p>
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
                        {`#${t(rawTag)}`}
                        {/*tagWithHash*/}
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
                    <img
                      src={src}
                      alt={`view-${idx}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"  // <--- ADD THIS LINE
                      onError={(e) => { /* ... */ }}
                      onClick={() => setModalImage(src)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="rd-review-container">
            {/* Ẩn tiêu đề số lượng nếu muốn giống hình, hoặc giữ lại tùy ý */}
            {/* <h3 className="rd-section-title">Reviews ({mockReviews.length})</h3> */}

            <div className="rd-review-list">
              {reviews.map((review, idx) => (
                <div key={review.id ?? idx} className="rd-review-card-green">
                  {/* CỘT TRÁI: AVATAR */}
                  <div className="rd-review-left">
                    {/* Dùng ảnh placeholder cartoon cho giống hình mẫu */}
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`}
                      alt="avatar"
                      className="rd-review-avatar-img"
                      referrerPolicy="no-referrer"  // <--- ADD THIS LINE
                      onError={(e) => { /* ... */ }}
                    />
                  </div>

                  {/* CỘT PHẢI: INFO + CONTENT */}
                  <div className="rd-review-right">
                    {/* Tên User */}
                    <div className="rd-review-name">{review.author || review.name}</div>

                    {/* Hàng Sao (Stars) */}
                    <div className="rd-review-stars">
                      {(() => {
                        const r = normalizeReviewRating(review.rating_text ?? review.rating) ?? 0;
                        return [1, 2, 3, 4, 5].map((star) => (
                          <DetailIcons.Star key={star} fill={star <= r ? "#FFC107" : "none"} />
                        ));
                      })()}
                    </div>

                    {/* Nội dung comment */}
                    <p className="rd-review-content">
                      {review.content ?? review.comment}
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
            {t('menu')} ({menuImages.length})
          </button>
          <button
            className={`rd-tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            {t('view')} ({restaurantViewImages.length})
          </button>
          <button
            className={`rd-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            {t('review')} ({reviews.length})
          </button>
        </div>
      </div>

      {/* --- PHẦN 2: CUỘN Ở GIỮA (Nội dung) --- */}
      <div className="rd-scroll-view">
        {renderContent()}
      </div>

      {/* --- FULL IMAGE MODAL --- */}
      {modalImage && (
        <div className="rd-modal-overlay" onClick={() => setModalImage(null)}>
          <div className="rd-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-body" style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={modalImage}
                alt="full"
                style={{ maxWidth: '90vw', maxHeight: '80vh' }}
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = 'https://placehold.co/1200x800?text=Image'; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- PHẦN 3: CỐ ĐỊNH Ở DƯỚI (Footer) --- */}
      <div className="rd-footer-bar">
        <button className="rd-btn-direction" onClick={onGetDirection}>
          {t('get_direction')}
          <span style={{ marginLeft: 8, display: 'flex' }}><DetailIcons.Map /></span>
        </button>

        <div className="rd-shuffle-block" onClick={onShuffleAgain}>
          <span className="rd-shuffle-label">{t('shuffle_again')}</span>
          <div className="rd-spin-icon"><DetailIcons.Refresh /></div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;

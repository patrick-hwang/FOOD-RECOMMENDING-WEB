import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import SplashScreen from './Components/SplashScreen';

import './RandomModeCard.css';
import OnboardingPage from './Pages/Onboarding';

import logo from './assets/images/logo.png';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LoginPage from './LoginPage';

// --- 1. HIỆU ỨNG MỞ MÀN ---
function AppEntranceEffect({ onDone }) {
  const [entered, setEntered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [hideRects, setHideRects] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setEntered(true), 50);
    const textTimer = setTimeout(() => setShowText(true), 500);
    const exitStart = 1500;
    const exitTimer = setTimeout(() => setEntered(false), exitStart);
    const hideTimer = setTimeout(() => setHideRects(true), exitStart + 1000);
    return () => { clearTimeout(enterTimer); clearTimeout(textTimer); clearTimeout(exitTimer); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => { if (hideRects && typeof onDone === 'function') onDone(); }, [hideRects, onDone]);

  return (
    <div className="EntranceEffect">
      {!hideRects && (
        <>
          <div className={`entrance-slide-rect top ${entered ? 'in' : ''}`}><span className={`entrance-text ${showText ? 'in' : ''}`}>NEW DESTINATIONS</span></div>
          <div className={`entrance-slide-rect bottom ${entered ? 'in' : ''}`}><span className={`entrance-text ${showText ? 'in' : ''}`}>NEW CRAVINGS</span></div>
        </>
      )}
    </div>
  );
}

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

// --- 2. MÀN HÌNH CHỌN CHẾ ĐỘ ---
function AppChooseMode({ onRandom, onTaste, onLogout }) {
  return (
    <div className="choose-mode-container" style={{position: 'relative'}}>
      <button className="logout-btn-absolute" onClick={onLogout} title="Logout">
        <LogoutIcon />
      </button>

      <header className="header">
        <div className="logo-container">
          <img src={logo} className="logo" alt="Logo" />
          <span className="logo-text">FoodRec</span>
        </div>
      </header>

      <main className="choose-mode-content-container">
        <h1 className="choose-mode-title">How do you want to search for food?</h1>
        <h2 className="choose-mode-subtitle">Choose your option</h2>

        <div className="options-grid">
          <div className="option-card random-card" onClick={onRandom}>
            <h2 className="card-title">Quick & Random</h2>
            <div className="card-icon"><span role="img" aria-label="Dice">🎲</span></div>
            <p className="card-description">Filters & random 3 spots</p>
          </div>
          <div className="option-card taste-card" onClick={onTaste}>
            <h2 className="card-title">Test your Taste</h2>
            <div className="card-icon"><span role="img" aria-label="Quiz">❓</span></div>
            <p className="card-description">Quizzes for personalized recommendations</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="choose-mode-footer">
          <a href="#help" className="help-link">Help?</a>
        </div>
      </footer>
    </div>
  );
}

// --- 3. COMPONENT CARD KẾT QUẢ ---
const ResultCard = ({ name, imageUrl, description, onClick }) => (
  <div className="result-card" onClick={onClick}>
    {/* Class 'card-image-container' khớp với CSS của bạn để tạo khung vuông */}
    <div className="card-image-container">
      <img 
        src={imageUrl} 
        alt={name} 
        className="card-image" 
        onError={(e) => { e.target.src = 'https://placehold.co/300x200/eee/ccc?text=No+Image'; }}
      />
    </div>
    <h3 className="card-name">{name}</h3>
    <p className="card-text-placeholder">{description}</p>
  </div>
);

const TAG_DEFINITIONS = {
    "nhiệt độ" : ["lạnh như băng", "lạnh", "mát", "nguội", "ấm", "nóng", "sôi/rất nóng"],
    "nước cốt dừa" : ["nước cốt dừa"],
    "sữa" : ["sữa"],
    "trứng" : ["trứng gà", "trứng cút"],
    "đậu - hạt" : ["cà phê", "đậu phộng", "đậu đen", "đậu đỏ", "đậu ván", "ca cao", "hạt sen"],
    "thảo mộc" : ["sả", "hồi", "quế", "gừng", "lá dứa", "vani"],
    "thời điểm" : ["bữa sáng", "ăn vặt", "tráng miệng", "buổi đêm", "buổi trưa"],
    "miền Bắc" : ["Hà Nội", "Hải Phòng", "Tây Bắc"],
    "miền Trung" : ["Phú Yên", "Huế", "Quảng Ngãi", "Đà Nẵng", "Quảng Nam", "Khánh Hòa", "Phan Rang", "Bình Định", "Nghệ An", "Hà Tĩnh"],
    "miền Tây" : ["Tiền Giang", "Đồng Tháp", "Cà Mau", "Sóc Trăng", "An Giang"],
    "miền Nam" : ["Sài Gòn", "Bà Rịa - Vũng Tàu"],
    "Tây Nguyên" : ["Đắk Lắk", "Kon Tum", "Lâm Đồng", "Pleiku", "Đắk Nông", "Gia Lai"],
    "nước ngoài" : ["Anh", "Pháp", "Mỹ", "Ý", "Đức", "Hy Lạp", "Nhật Bản", "Hàn Quốc", "Trung Quốc"],
    "sợi" : ["bún", "phở", "hủ tiếu", "mì sợi", "bánh canh bột gạo", "bánh đa", "miến dong", "miến/bún tàu"],
    "món ăn nước" : ["súp", "lẩu", "cháo", "cà ri", "hầm"],
    "món khô" : ["xào", "chiên", "nướng", "trộn", "hấp", "kho", "rang", "quay", "luộc"],
    "món rời" : ["cơm", "bắp"],
    "món nếp" : ["xôi", "bánh nếp", "cốm", "chè nếp", "nếp hấp"],
    "bánh bột gạo" : ["bánh xèo", "bánh bèo", "bánh căn", "bánh cuốn", "bánh ướt", "bánh hỏi", "bánh bò", "bánh đúc"],
    "bánh bột mì" : ["bánh mì", "bánh bao", "bánh quẩy", "bánh tiêu", "bánh su kem", "bánh bông lan", "donut"],
    "thịt gia súc" : ["thịt bò", "thịt heo", "thịt trâu", "thịt dê", "thịt cừu"],
    "thịt gia cầm" : ["thịt gà", "thịt vịt", "thịt ngan", "thịt ngỗng", "thịt chim cút"],
    "hải sản" : ["tôm", "mực", "cá", "nghêu", "sò", "ốc", "cua"],
    "món chay" : ["rau củ", "đậu hũ", "nấm", "chả chay", "mì chay", "cơm chay"],
    "độ ngọt" : ["không ngọt", "ít ngọt", "vừa ngọt", "ngọt đậm", "rất ngọt"],
    "độ cay" : ["không cay", "cay nhẹ", "cay vừa", "cay nhiều", "rất cay"],
    "thức uống" : ["cà phê", "trà sữa", "nước ép/ sinh tố", "có cồn", "nước có ga"],
    "vật chất" : ["đèn vàng", "cửa sổ", "ghế êm", "chậu hoa", "bàn hai người", "nến", "tiểu cảnh", "rèm"],
    "không gian" : ["thoáng đãng", "ấm áp", "riêng tư", "hương tinh dầu", "lãng mạn", "kết nối"],
    "âm thanh" : ["nhạc", "yên tĩnh", "âm thanh nền"],
    "giá tiền" : ["siêu rẻ", "rẻ", "bình dân", "sang", "nhà hàng", "cao cấp"]
};

// --- 4. MÀN HÌNH RANDOM (Logic chính lấy ảnh và hiển thị) ---
function RandomModeCard({ onBack }) {
  const [visibleResults, setVisibleResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [imageGroup, setImageGroup] = useState('menu'); 
  const [enlargedImg, setEnlargedImg] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLoc, setUserLoc] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [reviewLimit, setReviewLimit] = useState(3);
  const [showAllTags, setShowAllTags] = useState(false);

  // --- CONFIG ---
  const filters = [
    { key: 'price_range', icon: '💰', label: 'Price' },
    { key: 'cuisine_origin', icon: '🌐', label: 'Origin' },
    { key: 'main_dishes', icon: '🍽️', label: 'Dish' },
    { key: 'place', icon: '✨', label: 'Place' }, // NEW
    { key: 'distance', icon: '📍', label: 'Distance' },
    { key: 'speciality_vn', icon: '⭐', label: 'Speciality' },
  ];

  const filterOptions = {
    price_range: ['rẻ', 'trung bình', 'sang'],
    cuisine_origin: ['Việt', 'Trung Quốc', 'Hồng Kông', 'Nhật', 'Hàn'],
    main_dishes: ['lẩu', 'bò', 'buffet', 'hải sản', 'phở', 'cơm', 'bún'], 
    distance: ['1 km', '3 km', '5 km'],
    speciality_vn: ['yes', 'no'],
  };

  const getFilterOptions = (key) => {
      switch(key) {
          case 'price_range': 
              return TAG_DEFINITIONS["giá tiền"];
          case 'cuisine_origin':
              return [
                  ...TAG_DEFINITIONS["miền Bắc"], ...TAG_DEFINITIONS["miền Trung"], 
                  ...TAG_DEFINITIONS["miền Nam"], ...TAG_DEFINITIONS["miền Tây"],
                  ...TAG_DEFINITIONS["Tây Nguyên"], ...TAG_DEFINITIONS["nước ngoài"]
              ];
          case 'main_dishes':
              return [
                  ...TAG_DEFINITIONS["món ăn nước"], ...TAG_DEFINITIONS["món khô"], 
                  ...TAG_DEFINITIONS["sợi"], ...TAG_DEFINITIONS["món rời"],
                  ...TAG_DEFINITIONS["hải sản"], ...TAG_DEFINITIONS["thịt gia súc"], 
                  ...TAG_DEFINITIONS["thịt gia cầm"], ...TAG_DEFINITIONS["bánh bột gạo"],
                  ...TAG_DEFINITIONS["bánh bột mì"]
              ];
          case 'place': // NEW CATEGORY MAPPING
              return [
                  ...TAG_DEFINITIONS["không gian"], ...TAG_DEFINITIONS["vật chất"], 
                  ...TAG_DEFINITIONS["âm thanh"]
              ];
          case 'distance': 
              return ['1 km', '3 km', '5 km'];
          case 'speciality_vn': 
              return ['yes', 'no'];
          default: 
              return [];
      }
  };

  function categorizeTags(tagsObj) {
    const getValues = (keys) => keys.flatMap(k => Array.isArray(tagsObj[k]) ? tagsObj[k] : (tagsObj[k] ? [tagsObj[k]] : [])).filter(Boolean);
    return {
      origin: getValues(['origin', 'cuisine_origin', 'cuisine', 'nguon_goc']),
      budget: getValues(['budget', 'price', 'price_range', 'gia']),
      specialities: getValues(['speciality', 'specialties', 'features', 'dac_san']),
      foodType: getValues(['foodType', 'type', 'main_dishes', 'mon_an']),
    };
  }

  // --- API LOGIC ---
  async function handleShuffle() {
    setLoading(true);
    setError(null);
    setVisibleResults([]); 

    const payload = { tags: { ...selectedFilters }, count: 3 };
    if (typeof payload.tags.speciality_vn === 'string') {
        payload.tags.speciality_vn = payload.tags.speciality_vn === 'yes';
    }
    if (userLoc && distanceKm) payload.geo = { center: userLoc, maxKm: distanceKm };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/filter-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Connection Error");
      const results = await response.json();

      if (!results || results.length === 0) {
        setError("No restaurants found!");
        return;
      }

      const normalized = results.map((item) => {
        const menuImages = Array.isArray(item.menu_images) ? item.menu_images : [];
        const viewImages = Array.isArray(item.places_images) ? item.places_images : [];
        const allImages = [...viewImages, ...menuImages];

        let imageUrl = 'https://placehold.co/300x200/eee/ccc?text=No+Image';
        if (viewImages.length > 0) imageUrl = viewImages[0];
        else if (menuImages.length > 0) imageUrl = menuImages[0];
        else if (item.thumbnail) imageUrl = item.thumbnail;

        let coords = null;
        if (item.coordinates && item.coordinates.lat && item.coordinates.long) {
             coords = { 
                 lat: parseFloat(item.coordinates.lat), 
                 lng: parseFloat(item.coordinates.long)
             };
        }

        const groupedTags = categorizeTags(item.tags || {});
        const allTags = Object.values(item.tags || {}).flat();

        return {
          id: item.id, 
          name: item.name,
          imageUrl: imageUrl, 
          description: item.description || (allTags.slice(0, 3).join(', ')),
          tags: allTags,
          images: allImages,
          imagesMenu: menuImages,   
          imagesViews: viewImages,  
          groupedTags,
          coords: coords,
          // --- NEW: FULL INFO ---
          address: item.address || "Unknown Address",
          rating: item.rating_info || { score: "?", count: 0 },
          hours: item.opening_hours || [],
          reviews: item.reviews || []
        };
      });

      setVisibleResults(normalized);

    } catch (err) {
      console.error(err);
      setError("Error loading data.");
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  function onFilterClick(key) {
    if (activeFilter !== key) {
        setShowAllTags(false); // Reset to collapsed view
    }
    setActiveFilter(prev => (prev === key ? null : key));
    
    if (key === 'distance' && !userLoc) {
      navigator.geolocation.getCurrentPosition(pos => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }

  function handleChooseFilter(filterKey, option) {
      if (filterKey === 'distance') { setDistanceKm(parseFloat(option)); return; }
      if (filterKey === 'speciality_vn') { setSelectedFilters(prev => ({ ...prev, [filterKey]: option })); return; }
      setSelectedFilters(prev => {
          const prevList = prev[filterKey] || [];
          const newList = prevList.includes(option) ? prevList.filter(i => i !== option) : [...prevList, option];
          return newList.length ? { ...prev, [filterKey]: newList } : (delete prev[filterKey], { ...prev });
      });
  }

  useEffect(() => { handleShuffle(); }, [selectedFilters]);

  // --- MAP LOGIC ---
  useEffect(() => {
    if (imageGroup === 'map' && detailItem?.coords && mapContainerRef.current) {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
        const { lat, lng } = detailItem.coords;
        const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([lat, lng]).addTo(map).bindPopup(detailItem.name).openPopup();
        mapInstanceRef.current = map;
        setTimeout(() => { map.invalidateSize(); }, 100);
    }
  }, [imageGroup, detailItem]);

  function openDetail(item) {
      setDetailItem(item);
      setReviewLimit(3);

      if (item.imagesMenu && item.imagesMenu.length > 0) setImageGroup('menu');
      else if (item.imagesViews && item.imagesViews.length > 0) setImageGroup('views');
      else setImageGroup('map');
  }

  return (
    <div className="random-results-container">
      {/* ... (Keep Back button, Results Grid, Shuffle Button) ... */}
      <div className="back-row"><button className="back-button" onClick={onBack}>Return</button></div>
      {loading && <div className="loading-text">Finding restaurants...</div>}
      {error && !loading && <div className="error-text">{error}</div>}
      
      <div className="results-grid">
        {visibleResults.map(result => (
          <div key={result.id} className="result-card" onClick={() => openDetail(result)}>
            <div className="card-image-container">
              <img src={result.imageUrl} alt={result.name} className="card-image" referrerPolicy="no-referrer" onError={(e) => { e.target.src = 'https://placehold.co/300x200/eee/ccc?text=No+Image'; }} />
            </div>
            <h3 className="card-name">{result.name}</h3>
            <p className="card-text-placeholder">⭐ {result.rating.score} ({result.rating.count}) • {result.tags.slice(0,2).join(', ')}</p>
          </div>
        ))}
      </div>

      <div className="shuffle-row">
        <button className="shuffle-button" onClick={handleShuffle} disabled={loading}>{loading ? "Shuffling..." : "Shuffles"}</button>
      </div>
      
      {/* 4. UPDATE FILTER BAR */}
      <div className="filters-row">
          {filters.map(f => (
            <div key={f.key} className={`filter-item ${activeFilter === f.key ? 'active' : ''}`} onClick={() => onFilterClick(f.key)}>
               <span role="img">{f.icon}</span> {f.label}
            </div>
          ))}
      </div>

      {/* 5. UPDATE FILTER OPTIONS (With Limit & Show More Button) */}
      {activeFilter && (
          <div className="filter-options">
              {(() => {
                  const allOptions = getFilterOptions(activeFilter);
                  // Limit to 10 items if not expanded
                  const visibleOptions = showAllTags ? allOptions : allOptions.slice(0, 10);
                  const selectedForThisKey = selectedFilters[activeFilter] || [];

                  return (
                      <>
                        {visibleOptions.map(opt => (
                            <button 
                                key={opt} 
                                className={`filter-option ${selectedForThisKey.includes(opt) ? 'selected' : ''}`} 
                                onClick={() => handleChooseFilter(activeFilter, opt)}
                            >
                                {opt}
                            </button>
                        ))}
                        
                        {/* THE SMALL SHOW MORE BUTTON */}
                        {!showAllTags && allOptions.length > 10 && (
                            <button 
                                className="filter-option show-more-btn" 
                                onClick={() => setShowAllTags(true)}
                                style={{background: '#eee', fontStyle: 'italic'}}
                            >
                                + {allOptions.length - 10} more...
                            </button>
                        )}
                      </>
                  );
              })()}
          </div>
      )}

      {/* ... (Keep Modal and Lightbox code exactly the same) ... */}
      {detailItem && (
         <div className="modal-overlay" onClick={() => setDetailItem(null)}>
             {/* ... Modal Content ... */}
             <div className="modal-card full-info-card" onClick={(e) => e.stopPropagation()}>
                {/* ... Paste your existing modal code here ... */}
                <div className="modal-header">
                  <h3 className="modal-title">{detailItem.name}</h3>
                  <button className="modal-close" onClick={() => setDetailItem(null)}>×</button>
                </div>
                <div className="modal-body scrollable-body">
                    {/* ... Address, Tabs, Images, Reviews ... */}
                    <div className="info-header">
                        <div className="info-row"><span className="info-icon">📍</span><span className="info-text">{detailItem.address}</span></div>
                        <div className="info-row"><span className="info-icon">⭐</span><span className="info-text"><strong>{detailItem.rating.score}</strong> ({detailItem.rating.count} reviews)</span></div>
                    </div>
                    {/* ... (Rest of modal) ... */}
                    <div className="image-group-toggle">
                        <button className={`toggle-btn ${imageGroup === 'menu' ? 'active' : ''}`} onClick={() => setImageGroup('menu')}>Menu</button>
                        <button className={`toggle-btn ${imageGroup === 'views' ? 'active' : ''}`} onClick={() => setImageGroup('views')}>Views</button>
                        <button className={`toggle-btn ${imageGroup === 'map' ? 'active' : ''}`} onClick={() => setImageGroup('map')}>Map</button>
                    </div>
                     <div className="modal-content-area">
                        {imageGroup !== 'map' ? (
                            <div className="modal-image-strip">
                            {(() => {
                                const currentImages = imageGroup === 'menu' ? detailItem.imagesMenu : detailItem.imagesViews;
                                if (currentImages && currentImages.length > 0) {
                                    return currentImages.map((url, i) => (
                                        <img key={i} src={url} referrerPolicy="no-referrer" onClick={() => setEnlargedImg(url)} onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error'; }} alt="img" />
                                    ));
                                } else {
                                    return <p className="empty-msg">No images available</p>;
                                }
                            })()}
                            </div>
                        ) : (
                            <div className="modal-map-container" style={{height: '250px', width: '100%'}}>
                            {detailItem.coords ? (
                                <div ref={mapContainerRef} style={{height:'100%', width:'100%'}} />
                            ) : (
                                <div style={{textAlign:'center', padding:'50px'}}>No coordinates found</div>
                            )}
                            </div>
                        )}
                    </div>
                    {detailItem.hours && detailItem.hours.length > 0 && (
                        <details className="details-section"><summary>🕒 Opening Hours</summary><ul className="hours-list">{detailItem.hours.map((h, i) => (<li key={i}><strong>{h.day}:</strong> {h.hours}</li>))}</ul></details>
                    )}
                    <div className="modal-tags">
                        {detailItem.tags.map((t, i) => <span key={i} className="tag-chip">#{t}</span>)}
                    </div>
                    {detailItem.reviews && detailItem.reviews.length > 0 && (
                        <div className="reviews-section">
                            <h4>💬 Recent Reviews ({detailItem.reviews.length})</h4>
                            {detailItem.reviews.slice(0, reviewLimit).map((rev, i) => (
                                <div key={i} className="review-card">
                                    <div className="review-header"><strong>{rev.author}</strong><span className="review-star">{rev.rating_text}</span></div>
                                    <p className="review-content">{rev.content}</p>
                                </div>
                            ))}
                            {detailItem.reviews.length > reviewLimit && (
                                <button className="load-more-btn" onClick={() => setReviewLimit(prev => prev + 5)}>Show more reviews ▼</button>
                            )}
                        </div>
                    )}
                </div>
             </div>
         </div>
      )}
       {enlargedImg && (
        <div className="image-lightbox" onClick={() => setEnlargedImg(null)}>
          <img src={enlargedImg} referrerPolicy="no-referrer" onClick={(e) => e.stopPropagation()} alt="Enlarged" />
          <button className="lightbox-close" onClick={() => setEnlargedImg(null)}>×</button>
        </div>
      )}
    </div>
  );
}

// --- 5. APP MAIN ---
function App() {
  const [mode, setMode] = useState('splash'); 
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com'; 
  

  function handleLoginSuccess() {
    setMode('choosing');
  }

  function handleLogout() {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
        setMode('login'); 
    }
  }

  function handleFinishOnboarding() {
    setMode('login');
  }

  function taste() {
    console.log('enter taste mode');
    setMode('taste');
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        {mode === 'splash' && (
          <SplashScreen onFinish={() => setMode('entrance')} />
        )}
        {mode === 'entrance' && <AppEntranceEffect onDone={() => setMode('onboarding')} />} 
        {mode === 'onboarding' && <AppEntranceEffect onDone={() => setMode('login')} />}
        {mode === 'onboarding' && (
          <OnboardingPage onFinish={handleFinishOnboarding} />
        )}
        {mode === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}

        {mode === 'choosing' && (
          <AppChooseMode 
            onRandom={() => setMode('random')} 
            onTaste={() => setMode('taste')} 
            onLogout={handleLogout} 
          />
        )}
        
        {mode === 'random' && <RandomModeCard onBack={() => setMode('choosing')} />}
        
        {mode === 'taste' && (
          <div className="mode-container">
            <h2>Taste Quiz</h2>
            <p>Starting taste quiz...</p>
            <button className="back-button" onClick={() => setMode('choosing')}>Back</button>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );

}

export default App;
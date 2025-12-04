import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import './RandomModeCard.css'; 
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

// --- 4. MÀN HÌNH RANDOM (Logic chính lấy ảnh và hiển thị) ---
function RandomModeCard({ onBack }) {
  const [visibleResults, setVisibleResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [imageGroup, setImageGroup] = useState('menu'); 
  const [enlargedImg, setEnlargedImg] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLoc, setUserLoc] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);

  const filters = [
    { key: 'price_range', icon: '💰', label: 'Giá cả' },
    { key: 'cuisine_origin', icon: '🌐', label: 'Nguồn gốc' },
    { key: 'main_dishes', icon: '🍽️', label: 'Món chính' },
    { key: 'distance', icon: '📍', label: 'Khoảng cách' },
    { key: 'speciality_vn', icon: '⭐', label: 'Đặc sản VN' },
  ];

  const filterOptions = {
    price_range: ['rẻ', 'trung bình', 'sang'],
    cuisine_origin: ['Việt', 'Trung Quốc', 'Hồng Kông', 'Nhật', 'Hàn'],
    main_dishes: ['lẩu', 'bò', 'buffet', 'hải sản', 'phở', 'cơm', 'bún'], 
    distance: ['1 km', '3 km', '5 km'],
    speciality_vn: ['yes', 'no'],
  };

  // Hàm phân loại Tag
  function categorizeTags(tagsObj) {
    const getValues = (keys) => keys.flatMap(k => Array.isArray(tagsObj[k]) ? tagsObj[k] : (tagsObj[k] ? [tagsObj[k]] : [])).filter(Boolean);
    return {
      origin: getValues(['origin', 'cuisine_origin', 'cuisine', 'nguon_goc']),
      budget: getValues(['budget', 'price', 'price_range', 'gia']),
      specialities: getValues(['speciality', 'specialties', 'features', 'dac_san']),
      foodType: getValues(['foodType', 'type', 'main_dishes', 'mon_an']),
    };
  }

  // Hàm phân loại Ảnh (Menu vs Views)
  function splitImages(imgs = []) {
    const menuHints = ['menu', 'thuc-don', 'thucdon', 'thực đơn'];
    const isMenu = (url) => url && menuHints.some(h => url.toLowerCase().includes(h));
    const menuImages = imgs.filter(u => isMenu(u));
    const viewImages = imgs.filter(u => !isMenu(u));
    return { menuImages, viewImages };
  }

  // --- LOGIC GỌI API & XỬ LÝ ẢNH ---
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

      if (!response.ok) throw new Error("Lỗi kết nối Server");
      const results = await response.json();

      if (!results || results.length === 0) {
        setError("Không tìm thấy quán nào phù hợp!");
        return;
      }
      
      console.log("Dữ liệu nhận được từ Server:", results); // Debug kiểm tra dữ liệu

      const normalized = results.map((item) => {
        // Đảm bảo images luôn là mảng
        const images = Array.isArray(item.image_urls) ? item.image_urls : [];
        
        // 1. Tìm ảnh đại diện
        let imageUrl = 'https://placehold.co/300x200/eee/ccc?text=No+Image';
        if (images.length > 0) {
            // Ưu tiên ảnh kết thúc bằng 1.png, nếu không lấy ảnh đầu tiên
            const cover = images.find(url => url && url.includes('/1.png'));
            imageUrl = cover || images[0];
        }

        // 2. Tách ảnh cho modal
        const { menuImages, viewImages } = splitImages(images);

        // 3. Xử lý Tag & Tọa độ
        const groupedTags = categorizeTags(item.tags || {});
        const allTags = Object.values(item.tags || {}).flat();
        let coords = null;
        if (item.location?.coordinates) {
             coords = { lat: item.location.coordinates[1], lng: item.location.coordinates[0] };
        }

        return {
          id: item.id, 
          name: item.name,
          imageUrl: imageUrl, 
          description: item.description || (allTags.slice(0, 3).join(', ')),
          tags: allTags,
          images, // Toàn bộ ảnh
          imagesMenu: menuImages,
          imagesViews: viewImages,
          groupedTags,
          coords
        };
      });

      setVisibleResults(normalized);

    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  function onFilterClick(key) {
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

  // Logic hiển thị Map
  useEffect(() => {
    if (imageGroup === 'map' && detailItem?.coords && mapContainerRef.current) {
        if (mapInstanceRef.current) mapInstanceRef.current.remove();
        const { lat, lng } = detailItem.coords;
        const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([lat, lng]).addTo(map).bindPopup(detailItem.name);
        mapInstanceRef.current = map;
    }
  }, [imageGroup, detailItem]);

  function openDetail(item) {
      setDetailItem(item);
      // Mở tab Menu nếu có ảnh menu, ngược lại mở Views
      setImageGroup(item.imagesMenu?.length ? 'menu' : 'views');
  }

  return (
    <div className="random-results-container">
      <div className="back-row">
        <button className="back-button" onClick={onBack}>Return</button>
      </div>

      {loading && <div className="loading-text">Đang tìm kiếm...</div>}
      {error && !loading && <div className="error-text">{error}</div>}

      {/* DANH SÁCH KẾT QUẢ */}
      <div className="results-grid">
        {visibleResults.map(result => (
          <ResultCard
            key={result.id}
            name={result.name}
            imageUrl={result.imageUrl}
            description={result.description}
            onClick={() => openDetail(result)}
          />
        ))}
      </div>

      <div className="shuffle-row">
        <button className="shuffle-button" onClick={handleShuffle} disabled={loading}>
          {loading ? "Đang xáo trộn..." : "Shuffles"}
        </button>
      </div>
      
      {/* FILTER */}
      <div className="filters-row">
          {filters.map(f => (
            <div key={f.key} className={`filter-item ${activeFilter === f.key ? 'active' : ''}`} onClick={() => onFilterClick(f.key)}>
               <span role="img">{f.icon}</span> {f.label}
            </div>
          ))}
      </div>
      {activeFilter && (
          <div className="filter-options">
              {filterOptions[activeFilter].map(opt => (
                  <button key={opt} className="filter-option" onClick={() => handleChooseFilter(activeFilter, opt)}>{opt}</button>
              ))}
          </div>
      )}

      {/* MODAL CHI TIẾT */}
      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{detailItem.name}</h3>
              <button className="modal-close" onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="image-group-toggle">
                <button className={`toggle-btn ${imageGroup === 'menu' ? 'active' : ''}`} onClick={() => setImageGroup('menu')}>Menu ({detailItem.imagesMenu?.length})</button>
                <button className={`toggle-btn ${imageGroup === 'views' ? 'active' : ''}`} onClick={() => setImageGroup('views')}>Views ({detailItem.imagesViews?.length})</button>
                <button className={`toggle-btn ${imageGroup === 'map' ? 'active' : ''}`} onClick={() => setImageGroup('map')}>Map</button>
              </div>

              {imageGroup !== 'map' ? (
                <div className="modal-image-strip">
                  {/* Hiển thị ảnh Menu hoặc View dựa trên Tab đang chọn */}
                  {(imageGroup === 'menu' ? detailItem.imagesMenu : detailItem.imagesViews).length > 0 ? (
                      (imageGroup === 'menu' ? detailItem.imagesMenu : detailItem.imagesViews).map((url, i) => (
                        <img key={i} src={url} onClick={() => setEnlargedImg(url)} onError={(e) => e.target.style.display='none'} />
                      ))
                  ) : (
                      // Nếu Tab đó rỗng nhưng quán vẫn có ảnh khác thì hiển thị tất cả ảnh (fallback)
                      detailItem.images.length > 0 ? (
                        detailItem.images.map((url, i) => <img key={i} src={url} onClick={() => setEnlargedImg(url)} onError={(e) => e.target.style.display='none'} />)
                      ) : (
                        <p style={{textAlign:'center', width:'100%', color:'#888'}}>Chưa có ảnh</p>
                      )
                  )}
                </div>
              ) : (
                <div className="modal-map-container">
                    <div ref={mapContainerRef} className="leaflet-container" style={{height:'100%'}} />
                </div>
              )}
              
              <div className="modal-tags" style={{marginTop:'15px'}}>
                  {detailItem.tags.slice(0, 10).map((t, i) => (
                      <span key={i} className="tag-chip">#{t}</span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ẢNH PHÓNG TO */}
      {enlargedImg && (
        <div className="image-lightbox" onClick={() => setEnlargedImg(null)}>
          <img src={enlargedImg} onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setEnlargedImg(null)}>×</button>
        </div>
      )}
    </div>
  );
}

// --- 5. APP MAIN ---
function App() {
  const [mode, setMode] = useState('entrance'); 
  const GOOGLE_CLIENT_ID = '975848353478-mguhticg531ok092j9krom4mhb25j6at.apps.googleusercontent.com'; 

  function handleLoginSuccess() {
    setMode('choosing');
  }

  function handleLogout() {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
        setMode('login'); 
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        {mode === 'entrance' && <AppEntranceEffect onDone={() => setMode('login')} />}
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
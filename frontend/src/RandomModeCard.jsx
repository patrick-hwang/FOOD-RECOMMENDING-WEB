import React, { useState, useEffect } from 'react';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
// Import file mới tạo
import RestaurantDetail from './RestaurantDetail';
import MapNavigationPage from './MapNavigationPage';
import { TAG_DEFINITIONS } from './tags';

// --- ICONS CHO TRANG RANDOM ---
const Icons = {
  Shuffle: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>),
  Star: ({ fill = "none" }) => (<svg width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  Bookmark: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
  Budget: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Location: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Origin: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>,
  Specialty: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>,
  Types: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M18 8c0-4.42-3.58-8-8-8S2 3.58 2 8c0 3.72 2.56 6.85 6 7.72V21h4v-5.28c3.44-.87 6-4 6-7.72z"></path></svg>,
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#00AA00" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Place: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-9a4 4 0 1 1 8 0v9"/></svg>
};

// --- SUB COMPONENTS ---
const QuickPickCard = ({ item, onClick }) => (
  <div className="qp-card" onClick={onClick}>
    <div className="qp-image-container">
      <img 
        src={item.imageUrl} 
        alt={item.name} 
        referrerPolicy="no-referrer"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=Food'; }} 
      />
      <div className="qp-bookmark"><Icons.Bookmark /></div>
    </div>
    <div className="qp-info">
      <h4 className="qp-name">{item.name}</h4>
      <div className="qp-rating">
        {[1, 2, 3, 4, 5].map((star) => (
            <Icons.Star key={star} fill={star <= (item.rating || 4.5) ? "#FFC107" : "none"} />
        ))}
        <span className="qp-score">{item.rating || 4.5}</span>
      </div>
    </div>
  </div>
);

const HotPickCard = ({ item, onClick }) => (
    <div className="hp-card" onClick={onClick}>
        <div className="hp-overlay"></div>
        <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="hp-bg-image" 
            referrerPolicy="no-referrer"
            onError={(e) => { e.target.src = 'https://placehold.co/400x150?text=Hot+Pick'; }}
        />
        <div className="hp-content">
            <h3 className="hp-name">{item.name}</h3>
            <div className="hp-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icons.Star key={star} fill="#FFC107" />
                ))}
                <span className="hp-score">{item.rating || 5.0}</span>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export default function RandomModeCard({ onBack }) {
  const [quickPicks, setQuickPicks] = useState([]);
  const [hotPicks, setHotPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false); 
  const [userLoc, setUserLoc] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);

  const filtersList = [
    { key: 'price_range', Icon: Icons.Budget, label: 'Price' },
    { key: 'cuisine_origin', Icon: Icons.Origin, label: 'Origin' },
    { key: 'main_dishes', Icon: Icons.Types, label: 'Dish' },
    { key: 'place', Icon: Icons.Place, label: 'Place' },
    { key: 'distance', Icon: Icons.Location, label: 'Distance' },
    { key: 'speciality_vn', Icon: Icons.Specialty, label: 'Speciality' },
  ];

  const getFilterOptions = (key) => {
      switch(key) {
          case 'price_range': return TAG_DEFINITIONS["giá tiền"];
          case 'cuisine_origin': return [...TAG_DEFINITIONS["miền Bắc"], ...TAG_DEFINITIONS["miền Trung"], ...TAG_DEFINITIONS["miền Nam"], ...TAG_DEFINITIONS["nước ngoài"]];
          case 'main_dishes': return [...TAG_DEFINITIONS["món ăn nước"], ...TAG_DEFINITIONS["món khô"], ...TAG_DEFINITIONS["sợi"], ...TAG_DEFINITIONS["món rời"], ...TAG_DEFINITIONS["hải sản"], ...TAG_DEFINITIONS["thịt gia súc"], ...TAG_DEFINITIONS["thịt gia cầm"], ...TAG_DEFINITIONS["bánh bột gạo"], ...TAG_DEFINITIONS["bánh bột mì"]];
          case 'place': return [...TAG_DEFINITIONS["không gian"], ...TAG_DEFINITIONS["vật chất"], ...TAG_DEFINITIONS["âm thanh"]];
          case 'distance': return ['1 km', '3 km', '5 km'];
          case 'speciality_vn': return ['yes', 'no'];
          default: return [];
      }
  };

  async function handleShuffle() {
    setLoading(true);
    setQuickPicks([]);
    setHotPicks([]);

    const payload = { tags: { ...selectedFilters }, count: 6 }; // Get 6 items: 3 for Quick, 3 for Hot

    // Handle special mappings
    if (typeof payload.tags.speciality_vn === 'string') {
        payload.tags.speciality_vn = payload.tags.speciality_vn === 'yes';
    }
    if (userLoc && distanceKm) {
        payload.geo = { center: userLoc, maxKm: distanceKm };
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/filter-random', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Server Error");
        const results = await response.json();

        if (results && results.length > 0) {
            const normalized = results.map(item => {
                // Normalize Images
                const menuImages = Array.isArray(item.menu_images) ? item.menu_images : [];
                const viewImages = Array.isArray(item.places_images) ? item.places_images : [];
                let thumb = 'https://placehold.co/300x200/eee/ccc?text=No+Image';
                
                if (viewImages.length > 0) thumb = viewImages[0];
                else if (menuImages.length > 0) thumb = menuImages[0];
                else if (item.thumbnail) thumb = item.thumbnail;

                // Normalize Coordinates
                let coords = null;
                if (item.coordinates && item.coordinates.lat && item.coordinates.long) {
                    coords = { 
                        lat: parseFloat(item.coordinates.lat), 
                        lng: parseFloat(item.coordinates.long)
                    };
                }

                // Flatten tags for display
                const allTags = Object.values(item.tags || {}).flat().filter(t => typeof t === 'string');

                return {
                    ...item,
                    imageUrl: thumb,
                    imagesMenu: menuImages,
                    imagesViews: viewImages,
                    tags: allTags,
                    coords: coords,
                    rating_info: item.rating_info || { score: "?", count: 0 },
                    address: item.address || "Unknown Address",
                    openTime: (item.opening_hours && item.opening_hours.length > 0) ? item.opening_hours[0].hours : "See details"
                };
            });

            setQuickPicks(normalized.slice(0, 3));
            setHotPicks(normalized.slice(3, 6));
        } else {
            console.log("No results found");
        }
    } catch (e) {
        console.error("Fetch error:", e);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => { handleShuffle(); }, []);

  function onFilterClick(key) {
    setActiveFilter(prev => (prev === key ? null : key));
    
    // Auto get location if distance is clicked
    if (key === 'distance' && !userLoc) {
        navigator.geolocation.getCurrentPosition(pos => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }
  }

  function handleChooseFilter(key, opt) {
      if (key === 'distance') { 
          setDistanceKm(parseFloat(opt)); 
      }
      if (key === 'speciality_vn') {
           setSelectedFilters(prev => ({ ...prev, [key]: opt })); 
           setActiveFilter(null); // Close after picking
           return;
      }

      // Multi-select for other tags
      setSelectedFilters(prev => {
          const prevList = prev[key] || [];
          const newList = prevList.includes(opt) ? prevList.filter(i => i !== opt) : [...prevList, opt];
          return newList.length ? { ...prev, [key]: newList } : (delete prev[key], { ...prev });
      });
  }

  function openDetail(item) { setDetailItem(item); }

  function handleShuffleAgainFromDetail() {
      setDetailItem(null);
      handleShuffle();
  }

  if (isNavigating && detailItem) {
      return (
          <MapNavigationPage 
              item={detailItem} 
              onBack={() => setIsNavigating(false)} // Quay về trang chi tiết
          />
      );
  }

  // --- LOGIC ĐIỀU HƯỚNG SANG TRANG MỚI ---
  if (detailItem) {
      return (
          <RestaurantDetail 
              item={detailItem} 
              onBack={() => setDetailItem(null)} 
              onShuffleAgain={handleShuffleAgainFromDetail}
              onGetDirection={() => setIsNavigating(true)} 
          />
      );
  }

  return (
    <div className="rm-container">
      {/* 1. BRAND BAR */}
      <div className="rm-brand-bar">
        <img src={logo} alt="FoodRec" className="rm-logo-img" />
        <span className="rm-brand-name">FoodRec</span>
      </div>

      {/* 2. HEADER */}
      <div className="rm-header">
        <div className="rm-title-row">
            <div>
                <h1 className="rm-title">Quick Pick</h1>
                <p className="rm-subtitle">Randomized for you</p>
            </div>
            <button className="rm-shuffle-btn" onClick={onBack}>
               <Icons.Back />
               <span style={{fontSize: '0.6em', marginTop:'2px'}}>Back</span>
            </button>
        </div>

        <div className="rm-quick-pick-grid">
            {quickPicks.map((item, idx) => (
                <QuickPickCard key={idx} item={item} onClick={() => openDetail(item)} />
            ))}
        </div>
      </div>

      {/* 3. HOT PICKS */}
      <div className="rm-hot-picks-section">
          <div className="rm-section-title sticky-header">
              Hot picks <span style={{fontSize:'1.2em'}}>🏆</span>
          </div>
          <div className="rm-hot-picks-list">
              {hotPicks.map((item, idx) => (
                  <HotPickCard key={idx} item={item} onClick={() => openDetail(item)} />
              ))}
              <div style={{height: '80px'}}></div>
          </div>
      </div>

      {/* 4. FOOTER */}
      <div className="rm-footer">
          {activeFilter && (
            <div className="rm-filter-popup">
                {/* ➤ FIX: Call the function getFilterOptions(activeFilter) */}
                {getFilterOptions(activeFilter).map(opt => (
                    <button key={opt} className="rm-popup-opt" onClick={() => handleChooseFilter(activeFilter, opt)}>{opt}</button>
                ))}
            </div>
          )}
          <div className="rm-filters-bar">
              {filtersList.map(({ key, Icon, label }) => (
                  <div key={key} className={`rm-filter-icon ${selectedFilters[key] ? 'active' : ''}`} onClick={() => onFilterClick(key)}>
                      <div className="rm-icon-circle"><Icon /></div>
                      <span className="rm-icon-label">{label}</span>
                  </div>
              ))}
              {/* <div className="rm-filter-icon" onClick={onBack}>
                   <div className="rm-icon-circle" style={{border:'none'}}><Icons.Back /></div>
              </div> */}
          </div>
          <button className="rm-find-match-btn" onClick={handleShuffle}>Find my match</button>
      </div>
    </div>
  );
}
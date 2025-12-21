import React, { useState, useEffect } from 'react';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
import MapNavigationPage from './MapNavigationPage';
import { TAG_DEFINITIONS } from './tags'; // Vẫn giữ để lấy list
import axios from 'axios';
import { useLanguage } from './Context/LanguageContext'; // Import

// ... (Giữ nguyên Icons) ...
const Icons = {
  Shuffle: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>),
  Star: ({ fill = "none" }) => (<svg width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  Bookmark: ({ filled }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#666"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
  Budget: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Location: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Origin: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>,
  Specialty: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>,
  Types: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M18 8c0-4.42-3.58-8-8-8S2 3.58 2 8c0 3.72 2.56 6.85 6 7.72V21h4v-5.28c3.44-.87 6-4 6-7.72z"></path></svg>,
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#00AA00" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Place: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-9a4 4 0 1 1 8 0v9"/></svg>
};

const QuickPickCard = ({ item, onClick, onSave, isSaved }) => (
  <div className="qp-card" onClick={onClick}>
    <div className="qp-image-container">
      <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=Food'; }} />
      <div className="qp-bookmark" onClick={(e) => { e.stopPropagation(); onSave(item); }}><Icons.Bookmark filled={isSaved} /></div>
    </div>
    <div className="qp-info">
      <h4 className="qp-name">{item.name}</h4>
      <div className="qp-rating">
        {[1,2,3,4,5].map((star) => (<Icons.Star key={star} fill={star <= (item.rating || 4.5) ? "#FFC107" : "none"} />))}
        <span className="qp-score">{item.rating || 4.5}</span>
      </div>
    </div>
  </div>
);

const HotPickCard = ({ item, onClick }) => (
    <div className="hp-card" onClick={onClick}>
        <div className="hp-overlay"></div>
        <img src={item.imageUrl} alt={item.name} className="hp-bg-image" onError={(e) => { e.target.src = 'https://placehold.co/400x150?text=Hot+Pick'; }} />
        <div className="hp-content">
            <h3 className="hp-name">{item.name}</h3>
            <div className="hp-rating">
                {[1,2,3,4,5].map((star) => (<Icons.Star key={star} fill="#FFC107" />))}
                <span className="hp-score">{item.rating || 5.0}</span>
            </div>
        </div>
    </div>
);

export default function RandomModeCard({ onBack, currentUser }) {
  const { t } = useLanguage(); // Dùng hàm dịch
  const [quickPicks, setQuickPicks] = useState([]);
  const [hotPicks, setHotPicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false); 
  const [userLoc, setUserLoc] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [savedIds, setSavedIds] = useState([]);

  // Dịch Label của Filter
  const filtersList = [
    { key: 'price_range', Icon: Icons.Budget, label: t('price_range') },
    { key: 'cuisine_origin', Icon: Icons.Origin, label: t('cuisine_origin') },
    { key: 'main_dishes', Icon: Icons.Types, label: t('main_dishes') },
    { key: 'place', Icon: Icons.Place, label: t('place') },
    { key: 'distance', Icon: Icons.Location, label: t('distance') },
    { key: 'speciality_vn', Icon: Icons.Specialty, label: t('speciality_vn') },
  ];

  const getFilterOptions = (key) => {
      // Logic: Lấy list tiếng Việt gốc từ tags.js để gửi API
      // Nhưng khi hiển thị ra màn hình (trong map) thì dùng t() để dịch
      switch(key) {
          case 'price_range': return TAG_DEFINITIONS["giá tiền"];
          case 'cuisine_origin': return [...TAG_DEFINITIONS["miền Bắc"], ...TAG_DEFINITIONS["miền Trung"], ...TAG_DEFINITIONS["miền Nam"], ...TAG_DEFINITIONS["nước ngoài"]];
          case 'main_dishes': return [...TAG_DEFINITIONS["món ăn nước"], ...TAG_DEFINITIONS["món khô"], ...TAG_DEFINITIONS["sợi"], ...TAG_DEFINITIONS["món rời"], ...TAG_DEFINITIONS["hải sản"], ...TAG_DEFINITIONS["thịt gia súc"], ...TAG_DEFINITIONS["thịt gia cầm"], ...TAG_DEFINITIONS["bánh bột gạo"], ...TAG_DEFINITIONS["bánh bột mì"]];
          case 'place': return [...TAG_DEFINITIONS["không gian"], ...TAG_DEFINITIONS["vật chất"], ...TAG_DEFINITIONS["âm thanh"]];
          case 'distance': return ['1 km', '3 km', '5 km']; // Cái này không cần dịch
          case 'speciality_vn': return ['yes', 'no'];
          default: return [];
      }
  };

  const API_URL = "http://127.0.0.1:8000/api";
  const userId = currentUser?.phone || currentUser?.email || currentUser?.facebook_id;

  const fetchBookmarks = async () => {
      if (!userId) return;
      try {
          const res = await axios.get(`${API_URL}/user/${userId}`);
          setSavedIds((res.data.bookmark_items || []).map(b => b.id));
      } catch (e) { console.error("Fetch bookmark err", e); }
  };

  useEffect(() => { fetchBookmarks(); handleShuffle(); }, []);

  async function handleShuffle() {
    setLoading(true); setQuickPicks([]); setHotPicks([]);
    const payload = { tags: { ...selectedFilters }, count: 6 }; 
    if (typeof payload.tags.speciality_vn === 'string') payload.tags.speciality_vn = payload.tags.speciality_vn === 'yes';
    if (userLoc && distanceKm) payload.geo = { center: userLoc, maxKm: distanceKm };

    try {
        const response = await fetch(`${API_URL}/filter-random`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const results = await response.json();
        if (results && results.length > 0) {
            const normalized = results.map(item => {
                let thumb = 'https://placehold.co/300x200/eee/ccc?text=No+Image';
                if (item.places_images?.length) thumb = item.places_images[0];
                else if (item.menu_images?.length) thumb = item.menu_images[0];
                else if (item.thumbnail) thumb = item.thumbnail;

                return {
                    ...item, imageUrl: thumb,
                    imagesMenu: item.menu_images || [], imagesViews: item.places_images || [],
                    tags: Object.values(item.tags || {}).flat().filter(t => typeof t === 'string'),
                    address: item.address || "Unknown",
                    openTime: item.opening_hours?.[0]?.hours || "See details"
                };
            });
            setQuickPicks(normalized.slice(0, 3));
            setHotPicks(normalized.slice(3, 6));
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const handleQuickSave = async (item) => {
      if (currentUser?.isGuest) {
        if(window.confirm("Feature requires Login. Go to Login?")) {
             if(onLogout) onLogout(); // Gọi hàm logout để về login
        }
        return;
      }
      if (!userId) return alert("Please login to save!");
      const isCurrentlySaved = savedIds.includes(item.id);
      if (isCurrentlySaved) setSavedIds(prev => prev.filter(id => id !== item.id));
      else setSavedIds(prev => [...prev, item.id]);
      try { await axios.post(`${API_URL}/user/${userId}/bookmark`, { restaurant_id: item.id }); } catch (e) { console.error(e); }
  };

  function onFilterClick(key) {
    setActiveFilter(prev => (prev === key ? null : key));
    if (key === 'distance' && !userLoc) {
        navigator.geolocation.getCurrentPosition(pos => {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }
  }

  function handleChooseFilter(key, opt) {
      if (key === 'distance') setDistanceKm(parseFloat(opt));
      if (key === 'speciality_vn') { setSelectedFilters(prev => ({ ...prev, [key]: opt })); setActiveFilter(null); return; }
      setSelectedFilters(prev => {
          const prevList = prev[key] || [];
          const newList = prevList.includes(opt) ? prevList.filter(i => i !== opt) : [...prevList, opt];
          return newList.length ? { ...prev, [key]: newList } : (delete prev[key], { ...prev });
      });
  }

  if (isNavigating && detailItem) {
      return (<div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:21000}}>
              <MapNavigationPage item={detailItem} onBack={() => setIsNavigating(false)} /></div>);
  }

  if (detailItem) {
      return (<div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:20000, background:'white'}}>
              <RestaurantDetail item={detailItem} onBack={() => setDetailItem(null)} onShuffleAgain={() => { setDetailItem(null); handleShuffle(); }} onGetDirection={() => setIsNavigating(true)} currentUser={currentUser} /></div>);
  }

  return (
    <div className="rm-container">
      <div className="rm-brand-bar">
        <img src={logo} alt="FoodRec" className="rm-logo-img" />
        <span className="rm-brand-name">FoodRec</span>
      </div>

      <div className="rm-header">
        <div className="rm-title-row">
            <div><h1 className="rm-title">{t('quick_pick')}</h1><p className="rm-subtitle">{t('random_subtitle')}</p></div>
            <button className="rm-shuffle-btn" onClick={handleShuffle} disabled={loading}><Icons.Shuffle /><span style={{fontSize: '0.6em', marginTop:'2px'}}>{t('shuffle')}</span></button>
        </div>
        <div className="rm-quick-pick-grid">
            {quickPicks.map((item, idx) => (<QuickPickCard key={idx} item={item} onClick={() => setDetailItem(item)} onSave={handleQuickSave} isSaved={savedIds.includes(item.id)} />))}
        </div>
      </div>

      <div className="rm-hot-picks-section">
          <div className="rm-section-title sticky-header">{t('hot_picks')} <span style={{fontSize:'1.2em'}}>🏆</span></div>
          <div className="rm-hot-picks-list">
              {hotPicks.map((item, idx) => (<HotPickCard key={idx} item={item} onClick={() => setDetailItem(item)} />))}
              <div style={{height: '80px'}}></div>
          </div>
      </div>

      <div className="rm-footer">
          {activeFilter && (
            <div className="rm-filter-popup">
                {getFilterOptions(activeFilter).map(opt => (
                    // Hiển thị text đã dịch (t(opt)), nhưng gửi giá trị gốc (opt) vào hàm xử lý
                    <button key={opt} className="rm-popup-opt" onClick={() => handleChooseFilter(activeFilter, opt)}>{t(opt)}</button>
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
              <div className="rm-filter-icon" onClick={onBack}>
                   <div className="rm-icon-circle" style={{border:'none'}}><Icons.Back /></div>
              </div>
          </div>
          <button className="rm-find-match-btn" onClick={handleShuffle}>{t('find_match')}</button>
      </div>
    </div>
  );
}
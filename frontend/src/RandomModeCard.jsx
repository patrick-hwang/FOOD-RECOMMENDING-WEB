import React, { useState, useEffect } from 'react';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
// Import file mới tạo
import RestaurantDetail from './RestaurantDetail';
import MapNavigationPage from './MapNavigationPage';
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
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#00AA00" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
};

// --- SUB COMPONENTS ---
const QuickPickCard = ({ item, onClick }) => (
  <div className="qp-card" onClick={onClick}>
    <div className="qp-image-container">
      <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=Food'; }} />
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
        <img src={item.imageUrl} alt={item.name} className="hp-bg-image" onError={(e) => { e.target.src = 'https://placehold.co/400x150?text=Hot+Pick'; }}/>
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
  const filtersList = [
    { key: 'price_range', Icon: Icons.Budget, label: 'Budget' },
    { key: 'distance', Icon: Icons.Location, label: 'Location' },
    { key: 'cuisine_origin', Icon: Icons.Origin, label: 'Origin' },
    { key: 'speciality_vn', Icon: Icons.Specialty, label: 'Specialty' },
    { key: 'main_dishes', Icon: Icons.Types, label: 'Types' },
  ];

  const filterOptions = {
    price_range: ['rẻ', 'trung bình', 'sang'],
    cuisine_origin: ['Việt', 'Trung Quốc', 'Hồng Kông', 'Nhật', 'Hàn'],
    main_dishes: ['lẩu', 'bò', 'buffet', 'hải sản', 'phở', 'cơm', 'bún'],
    distance: ['1 km', '3 km', '5 km'],
    speciality_vn: ['yes', 'no'],
  };

  async function handleShuffle() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Giả vờ load
    
    // MOCK DATA (Bổ sung thêm field address, openTime cho Detail View)
    const MOCK_DATA = [
      { id: 1, name: "Phở Sài Gòn", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/53/Pho_Bo_-_Beef_Noodle_Soup.jpg", rating: 4.0, tags: ['viet', 'pho'], address: "123 Lê Lợi, Q1", openTime: "06:00 - 22:00" },
      { id: 2, name: "Cơm Tấm Cali", imageUrl: "https://cdn.tgdd.vn/Files/2021/08/04/1372957/cach-lam-com-tam-suon-bi-cha-thom-ngon-chuan-vi-sai-gon-202108041530264197.jpg", rating: 4.5, tags: ['com', 'viet'], address: "45 Nguyễn Trãi, Q5", openTime: "07:00 - 21:00" },
      { id: 3, name: "Pizza 4P's", imageUrl: "https://media.vneconomy.vn/w800/images/upload/2022/08/17/pizza-4ps-1.jpg", rating: 4.8, tags: ['pizza', 'sang'], address: "8 Thủ Khoa Huân, Q1", openTime: "10:00 - 23:00" },
      { id: 4, name: "Haidilao Hotpot", imageUrl: "https://reviewvilla.vn/wp-content/uploads/2022/05/Haidilao-1.jpg", rating: 5.0, tags: ['lau', 'trung'], address: "Bitexco Tower, Q1", openTime: "10:00 - 02:00" },
      { id: 5, name: "Bún Chả Hà Nội", imageUrl: "https://static.vinwonders.com/production/bun-cha-ha-noi-1.jpg", rating: 4.2, tags: ['bun', 'bac'], address: "15 Hàng Mành", openTime: "09:00 - 21:00" },
      { id: 6, name: "Kichi Kichi", imageUrl: "https://aeonmall-binhtan.com.vn/wp-content/uploads/2020/07/70162590_2474776102758116_6268882006325919744_o.jpg", rating: 4.3, tags: ['lau', 'buffet'], address: "Vincom Center", openTime: "10:00 - 22:00" },
      { id: 7, name: "Bánh Mì Bà Huynh", imageUrl: "https://cdn.tgdd.vn/2021/09/cook/1200_1200_16-9/cach-lam-banh-mi-o-la-moi-la-thom-ngon-don-gian-cho-bua-sang-thumb-620x620.jpg", rating: 4.0, tags: ['BanhMi', 'Vietnamese'], address: "197A Nguyễn Trãi, District 1", openTime: "07:00 AM - 11:00 PM" },
    ];

    const normalized = MOCK_DATA.map(item => ({
       ...item,
       imagesMenu: [item.imageUrl, item.imageUrl, item.imageUrl],
       imagesViews: [item.imageUrl, item.imageUrl],
    }));

    setQuickPicks(normalized.slice(0, 3));
    setHotPicks(normalized.slice(3));
    setLoading(false);
  }

  useEffect(() => { handleShuffle(); }, []);

  function onFilterClick(key) { setActiveFilter(prev => (prev === key ? null : key)); }
  function handleChooseFilter(key, opt) {
      setSelectedFilters(prev => ({...prev, [key]: opt})); 
      setActiveFilter(null);
  }
  function openDetail(item) { setDetailItem(item); }

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
              onShuffleAgain={() => { setDetailItem(null); handleShuffle(); }}
              onGetDirection={() => setIsNavigating(true)} // Bấm nút thì set state thành true
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
            <button className="rm-shuffle-btn" onClick={handleShuffle} disabled={loading}>
               <Icons.Shuffle />
               <span style={{fontSize: '0.6em', marginTop:'2px'}}>Shuffle</span>
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
                {filterOptions[activeFilter].map(opt => (
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
              <div className="rm-filter-icon" onClick={onBack}>
                   <div className="rm-icon-circle" style={{border:'none'}}><Icons.Back /></div>
              </div>
          </div>
          <button className="rm-find-match-btn" onClick={handleShuffle}>Find my match</button>
      </div>
    </div>
  );
}
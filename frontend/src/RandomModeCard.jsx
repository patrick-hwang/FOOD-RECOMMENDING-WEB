import React, { useState, useEffect, useMemo } from 'react';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
import { TAG_DEFINITIONS } from './tags';
import { useLanguage } from './Context/LanguageContext';
import axios from 'axios';

// --- ICONS SVG ---
const Icons = {
  Dish: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>,
  Price: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Origin: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>,
  Atmosphere: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5,19c0-1.7-1.3-3-3-3c-0.4,0-0.7,0.1-1.1,0.2c-0.3-2.6-2.6-4.7-5.4-4.7c-3,0-5.5,2.5-5.5,5.5c0,1.7,1.3,3,3,3H17.5z"></path></svg>,
  Occasion: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 2 21 2 21 22 3 22"></polygon><line x1="12" y1="6" x2="12" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line></svg>,
  Distance: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Star: ({ fill = "none" }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  Bookmark: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>),
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  ArrowLeft: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ArrowRight: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Logo: () => <img src={logo} alt="Logo" style={{width: 24, height: 24, marginRight: 8}} />,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ChevronUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Budget: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Types: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>,
  Place: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5,19c0-1.7-1.3-3-3-3c-0.4,0-0.7,0.1-1.1,0.2c-0.3-2.6-2.6-4.7-5.4-4.7c-3,0-5.5,2.5-5.5,5.5c0,1.7,1.3,3,3,3H17.5z"></path></svg>,
  Location: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Specialty: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Shuffle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l9 9 9-9"></path><path d="M3 16l9 9 9-9"></path></svg>,
};

const FILTER_ORDER = [
  { key: 'price_range', Icon: Icons.Price, label: 'Price' },
  { key: 'cuisine_origin', Icon: Icons.Origin, label: 'Origin' },
  { key: 'main_dishes', Icon: Icons.Dish, label: 'Main Dishes' },
  { key: 'atmosphere', Icon: Icons.Atmosphere, label: 'Atmosphere' },
  { key: 'occasion', Icon: Icons.Occasion, label: 'Occasion' },
  { key: 'distance', Icon: Icons.Distance, label: 'Distance' },
];

// --- HIERARCHICAL TAGS DATA ---
const HIERARCHICAL_TAGS = {
  price_range: [
    { name: "Bình dân", children: ["$ (Dưới 50k)", "$$ (50k - 100k)"] },
    { name: "Sang trọng", children: ["$$$ (100k - 500k)", "$$$$ (Trên 500k)"] }
  ],
  cuisine_origin: [
    { name: "Việt Nam", children: ["Miền Bắc", "Miền Trung", "Miền Nam", "Miền Tây"] },
    { name: "Quốc tế", children: ["Hàn Quốc", "Nhật Bản", "Trung Hoa", "Âu Mỹ", "Thái Lan"] }
  ],
  main_dishes: [
    { name: "Món nước", children: ["Phở", "Bún", "Miến", "Hủ tiếu", "Bánh canh"] },
    { name: "Cơm & Xôi", children: ["Cơm tấm", "Cơm rang", "Xôi mặn", "Cơm văn phòng"] },
    { name: "Bánh mì & Bột", children: ["Bánh mì", "Bánh cuốn", "Bánh bao"] },
    { name: "Lẩu & Nướng", children: ["Lẩu thái", "Lẩu riêu", "Nướng BBQ"] },
    { name: "Đồ ăn nhẹ", children: ["Chè", "Trà sữa", "Bánh ngọt"] }
  ],
  atmosphere: [
    { name: "Trong nhà", children: ["Ấm cúng", "Máy lạnh", "Yên tĩnh"] },
    { name: "Ngoài trời", children: ["Sân vườn", "Vỉa hè", "Rooftop", "Ven hồ"] },
    { name: "Decor", children: ["Vintage", "Hiện đại", "Sống ảo"] }
  ],
  occasion: [
    { name: "Bữa chính", children: ["Ăn sáng", "Ăn trưa", "Ăn tối"] },
    { name: "Gặp gỡ", children: ["Hẹn hò", "Tiếp khách", "Họp nhóm", "Sinh nhật"] }
  ],
  distance: [
    { name: "Gần tôi", children: ["Dưới 1km", "1km - 3km"] },
    { name: "Xung quanh", children: ["3km - 5km", "5km - 10km"] }
  ]
};

const PlaceCard = ({ item, onClick }) => (
  <div className="place-card" onClick={onClick}>
    <div className="place-image-wrapper">
      <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }} />
      <div className="place-bookmark"><Icons.Bookmark /></div>
    </div>
    <div className="place-info-overlay">
      <h3 className="place-name">{item.name}</h3>
      <div className="place-rating">
        {[1,2,3,4,5].map(s => <Icons.Star key={s} fill={s <= (item.rating||4.5) ? "#FFC107" : "none"} />)}
        <span style={{marginLeft:4, color:'white', fontWeight:'bold'}}>{item.rating || 4.5}</span>
      </div>
    </div>
  </div>
);

const QuickPickCard = ({ item, onClick, onSave, isSaved }) => (
  <div className="quick-pick-card" onClick={onClick}>
    <img src={item.imageUrl} alt={item.name} />
    <button className={`quick-save-btn ${isSaved ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); onSave(item); }}>
      <Icons.Bookmark />
    </button>
    <div className="quick-info">
      <h4>{item.name}</h4>
      <div className="rating-stars">{[1,2,3,4,5].map(s => <Icons.Star key={s} fill={s <= (item.rating||4.5) ? "#FFC107" : "none"} />)}</div>
    </div>
  </div>
);

const HotPickCard = ({ item, onClick }) => (
  <div className="hot-pick-card" onClick={onClick}>
    <img src={item.imageUrl} alt={item.name} />
    <div className="hot-info">
      <h4>{item.name}</h4>
      <p className="address">{item.address}</p>
      <p className="time">{item.openTime}</p>
    </div>
  </div>
);

export default function RandomModeCard({ onBack, currentUser }) {
  const { t } = useLanguage();

  const [recommendations, setRecommendations] = useState([]);
  const [quickPicks, setQuickPicks] = useState([]);
  const [hotPicks, setHotPicks] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [savedIds, setSavedIds] = useState([]);

  // Carousel State
  const [centerIndex, setCenterIndex] = useState(2);

  // Modal Selection State
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showAllTagsModal, setShowAllTagsModal] = useState(false);
  const [expandedParents, setExpandedParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const activeFilter = FILTER_ORDER[centerIndex];

  // --- Computed Values ---
  const allSelectedTagValues = useMemo(() => {
    let list = [];
    Object.values(selectedFilters).forEach((values) => {
      if (Array.isArray(values)) list.push(...values);
    });
    return list;
  }, [selectedFilters]);

  const allSelectedTagsWithKey = useMemo(() => {
    let list = [];
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach(v => list.push({ key, value: v }));
      }
    });
    return list;
  }, [selectedFilters]);

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

  const API_URL = "http://127.0.0.1:8000/api";
  const userId = currentUser?.phone || currentUser?.email || currentUser?.facebook_id;

  const fetchBookmarks = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/user/${userId}`);
      setSavedIds((res.data.bookmark_items || []).map(b => b.id));
    } catch (e) { console.error("Fetch bookmark err", e); }
  };

  useEffect(() => {
    fetchBookmarks();
    handleShuffle();
  }, []);

  async function handleShuffle() {
    setLoading(true);
    setQuickPicks([]);
    setHotPicks([]);
    const payload = { tags: { ...selectedFilters }, count: 6 };
    if (typeof payload.tags.speciality_vn === 'string') payload.tags.speciality_vn = payload.tags.speciality_vn === 'yes';
    if (userLoc && distanceKm) payload.geo = { center: userLoc, maxKm: distanceKm };

    try {
      const response = await fetch(`${API_URL}/filter-random`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const results = await response.json();
      if (results && results.length > 0) {
        const normalized = results.map(item => {
          let thumb = 'https://placehold.co/300x200/eee/ccc?text=No+Image';
          if (item.places_images?.length) thumb = item.places_images[0];
          else if (item.menu_images?.length) thumb = item.menu_images[0];
          else if (item.thumbnail) thumb = item.thumbnail;

          return {
            ...item,
            imageUrl: thumb,
            imagesMenu: item.menu_images || [],
            imagesViews: item.places_images || [],
            tags: Object.values(item.tags || {}).flat().filter(t => typeof t === 'string'),
            address: item.address || "Unknown",
            openTime: item.opening_hours?.[0]?.hours || "See details"
          };
        });
        setQuickPicks(normalized.slice(0, 3));
        setHotPicks(normalized.slice(3, 6));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleQuickSave = async (item) => {
    if (!userId) return alert("Please login to save!");
    const isCurrentlySaved = savedIds.includes(item.id);
    if (isCurrentlySaved) setSavedIds(prev => prev.filter(id => id !== item.id));
    else setSavedIds(prev => [...prev, item.id]);
    try {
      await axios.post(`${API_URL}/user/${userId}/bookmark`, { restaurant_id: item.id });
    } catch (e) {
      console.error(e);
    }
  };

  function onFilterClick(key) {
    if (key === 'distance' && !userLoc) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }

  // --- CAROUSEL NAVIGATION ---
  const handlePrevFilter = () => {
    setCenterIndex(prev => (prev - 1 + FILTER_ORDER.length) % FILTER_ORDER.length);
    closeSelectionModal();
  };

  const handleNextFilter = () => {
    setCenterIndex(prev => (prev + 1) % FILTER_ORDER.length);
    closeSelectionModal();
  };

  // --- SELECTION MODAL LOGIC ---
  const openSelectionModal = () => {
    setSearchTerm('');
    setExpandedParents([]);
    setShowSelectionModal(true);
  };

  const closeSelectionModal = () => {
    setShowSelectionModal(false);
  };

  const toggleParentExpand = (parentName, e) => {
    e.stopPropagation();
    setExpandedParents(prev =>
      prev.includes(parentName)
        ? prev.filter(p => p !== parentName)
        : [...prev, parentName]
    );
  };

  const handleSelectTag = (tagValue) => {
    const currentKey = activeFilter.key;
    setSelectedFilters(prev => {
      const list = prev[currentKey] || [];
      const isSelected = list.includes(tagValue);
      let newList;

      if (isSelected) {
        newList = list.filter(i => i !== tagValue);
      } else {
        newList = [...list, tagValue];
      }

      if (newList.length === 0) {
        const newObj = { ...prev };
        delete newObj[currentKey];
        return newObj;
      }
      return { ...prev, [currentKey]: newList };
    });
  };

  const removeTag = (key, value) => {
    setSelectedFilters(prev => {
      const list = prev[key] || [];
      const newList = list.filter(i => i !== value);
      if (newList.length === 0) {
        const newObj = { ...prev };
        delete newObj[key];
        return newObj;
      }
      return { ...prev, [key]: newList };
    });
  };

  const handleDetailTagToggle = (tagWithHash) => {
    const rawTag = tagWithHash.replace(/^#/, '');
  };

  // --- FILTER SEARCH LOGIC ---
  const getFilteredHierarchy = () => {
    const hierarchy = HIERARCHICAL_TAGS[activeFilter.key] || [];
    if (!searchTerm.trim()) return hierarchy;

    const term = searchTerm.toLowerCase();
    return hierarchy.map(parent => {
      const parentMatch = parent.name.toLowerCase().includes(term);
      const matchingChildren = parent.children.filter(c => c.toLowerCase().includes(term));

      if (parentMatch || matchingChildren.length > 0) {
        return { ...parent, forceExpand: matchingChildren.length > 0 };
      }
      return null;
    }).filter(item => item !== null);
  };

  // --- RENDER HELPERS ---
  const getItemClass = (index) => {
    const length = FILTER_ORDER.length;
    let diff = (index - centerIndex + length) % length;
    if (diff > length / 2) diff -= length;
    if (diff === 0) return 'pos-center';
    if (diff === -1) return 'pos-left-1';
    if (diff === 1) return 'pos-right-1';
    if (diff === -2) return 'pos-left-2';
    if (diff === 2) return 'pos-right-2';
    return 'pos-hidden';
  };

  if (isNavigating && detailItem) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 21000 }}>
        {/* MapNavigationPage component will go here */}
      </div>
    );
  }

  if (detailItem) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20000, background: 'white' }}>
        <RestaurantDetail
          item={detailItem}
          onBack={() => setDetailItem(null)}
          onShuffleAgain={() => {
            setDetailItem(null);
            handleShuffle();
          }}
          onGetDirection={() => setIsNavigating(true)}
          currentUser={currentUser}
        />
      </div>
    );
  }

  const visibleTags = allSelectedTagsWithKey.slice(0, 3);
  const hiddenCount = allSelectedTagsWithKey.length - 3;
  const currentHierarchy = getFilteredHierarchy();

  return (
    <div className="rm-container">
      {/* --- HEADER --- */}
      <div className="rm-sticky-header">
        <div className="rm-header-top">
          <div className="rm-back-btn" onClick={onBack}><Icons.Back /></div>
          <div style={{ flex: 1 }}></div>
          <Icons.Logo />
        </div>
        <div className="rm-titles">
          <h1>{t('quick_pick')}</h1>
          <p>{t('random_subtitle')}</p>
        </div>
        <div className="rm-tags-area">
          <span className="rm-tags-label">{t('selected_tags')}</span>
          <div className="rm-tags-row">
            {visibleTags.map((tag) => (
              <div key={`${tag.key}-${tag.value}`} className="rm-tag-pill">
                #{tag.value}
                <div className="rm-tag-close" onClick={() => removeTag(tag.key, tag.value)}><Icons.Close /></div>
              </div>
            ))}
            {hiddenCount > 0 && <button className="rm-more-btn" onClick={() => setShowAllTagsModal(true)}>{t('more')}</button>}
          </div>
        </div>
      </div>

      {/* --- CARDS --- */}
      <div className="rm-cards-container">
        {recommendations.length > 0 ? recommendations.map((item, idx) => (
          <PlaceCard key={idx} item={item} onClick={() => setDetailItem(item)} />
        )) : <div className="rm-empty-state">{loading ? t('finding_matches') : t('press_find_match')}</div>}
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className="rm-bottom-bar">
        {/* 1. SELECTION MODAL */}
        {showSelectionModal && (
          <div className="rm-selection-modal">
            <div className="rm-sel-header">
              <h3>{t('select')} {activeFilter.label}</h3>
              <div onClick={closeSelectionModal} className="rm-sel-close"><Icons.Close /></div>
            </div>

            <div className="rm-search-box">
              <Icons.Search />
              <input
                type="text"
                placeholder={t('search_tag')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rm-tags-list-container">
              {currentHierarchy.map((parent, idx) => {
                const isParentExpanded = expandedParents.includes(parent.name) || parent.forceExpand;
                const isParentSelected = selectedFilters[activeFilter.key]?.includes(parent.name);

                return (
                  <div key={idx} className="rm-tag-group">
                    <div className="rm-parent-row">
                      <button
                        className={`rm-pill-btn parent ${isParentSelected ? 'active' : ''}`}
                        onClick={() => handleSelectTag(parent.name)}
                      >
                        {parent.name}
                      </button>

                      {parent.children && parent.children.length > 0 && (
                        <div
                          className={`rm-expand-arrow ${isParentExpanded ? 'rotated' : ''}`}
                          onClick={(e) => toggleParentExpand(parent.name, e)}
                        >
                          <Icons.ChevronDown />
                        </div>
                      )}
                    </div>

                    {isParentExpanded && (
                      <div className="rm-child-grid">
                        {parent.children.map((child) => {
                          const isChildSelected = selectedFilters[activeFilter.key]?.includes(child);

                          if (searchTerm && !child.toLowerCase().includes(searchTerm.toLowerCase()) && !parent.name.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                          return (
                            <button
                              key={child}
                              className={`rm-pill-btn child ${isChildSelected ? 'active' : ''}`}
                              onClick={() => handleSelectTag(child)}
                            >
                              {child}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. NAVIGATION CAROUSEL */}
        <div className="rm-filter-nav">
          <button className="rm-nav-arrow" onClick={handlePrevFilter}><Icons.ArrowLeft /></button>
          <div className="rm-filter-carousel">
            {FILTER_ORDER.map((item, index) => {
              const posClass = getItemClass(index);
              return (
                <div
                  key={item.key}
                  className={`rm-carousel-item ${posClass}`}
                  onClick={() => {
                    if (posClass.includes('left')) handlePrevFilter();
                    if (posClass.includes('right')) handleNextFilter();
                    if (posClass === 'pos-center') {
                      if (showSelectionModal) closeSelectionModal();
                      else openSelectionModal();
                    }
                  }}
                >
                  <div className="rm-icon-circle">{item.Icon()}</div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
          <button className="rm-nav-arrow" onClick={handleNextFilter}><Icons.ArrowRight /></button>
        </div>

        <button className="rm-find-match-btn" onClick={handleShuffle}>{t('find_match')}</button>
      </div>

      {/* Modal Show All Selected Tags */}
      {showAllTagsModal && (
        <div className="rm-modal-overlay">
          <div className="rm-modal-sheet">
            <div className="rm-modal-header">
              <h3>{t('all_selected_tags')}</h3>
              <div onClick={() => setShowAllTagsModal(false)} style={{ cursor: 'pointer' }}><Icons.Close /></div>
            </div>
            <div className="rm-modal-body">
              {allSelectedTagsWithKey.map((tag_item) => (
                <div key={`${tag_item.key}-${tag_item.value}`} className="rm-tag-pill large">
                  {tag_item.value}
                  <div className="rm-tag-close" onClick={() => removeTag(tag_item.key, tag_item.value)}><Icons.Close /></div>
                </div>
              ))}
            </div>
            <div className="rm-modal-footer">
              <button className="rm-clear-btn" onClick={() => { setSelectedFilters({}); setShowAllTagsModal(false); }}>{t('clear_all')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

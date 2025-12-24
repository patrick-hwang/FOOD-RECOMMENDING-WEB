import React, { useState, useEffect, useMemo } from 'react';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
import PlaceCard from './Components/PlaceCard';
import RestaurantDetail from './RestaurantDetail';
import { useLanguage } from './Context/LanguageContext';
import { useTheme } from './Context/ThemeContext';
import axios from 'axios';
import { HIERARCHICAL_TAGS } from './tags';

// --- ICONS SVG (Thêm Search, Chevron, Check) ---
const Icons = {
  Ingredient: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h16l-2 10H6L4 10z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>,
  Dish: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>,
  Price: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Origin: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>,
  Atmosphere: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5,19c0-1.7-1.3-3-3-3c-0.4,0-0.7,0.1-1.1,0.2c-0.3-2.6-2.6-4.7-5.4-4.7c-3,0-5.5,2.5-5.5,5.5c0,1.7,1.3,3,3,3H17.5z"></path></svg>,
  Occasion: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C7.03 2 3 6.03 3 11c0 4.97 4.03 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/><path d="M12 6v6l4 2"/></svg>,
  Distance: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Star: ({ fill = "none" }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>),
  Bookmark: ({ color = "#333" }) => {
    const { isDarkMode } = useTheme();
    // Logic: Nếu là màu đen mặc định và đang ở Darkmode, đổi sang màu sáng
    const finalColor = (color === "#333" && isDarkMode) ? "#e0e0e0" : color;
    
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
    );
},
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  ArrowLeft: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  ArrowRight: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Logo: () => <img src={logo} alt="Logo" style={{width: 24, height: 24, marginRight: 8}} />,
  // New Icons for Modal
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ChevronUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00AA55" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const FILTER_ORDER = [
  { key: 'price_range', Icon: Icons.Price, label: 'Price' },
  { key: 'cuisine_origin', Icon: Icons.Origin, label: 'Origin' },
  { key: 'main_dishes', Icon: Icons.Dish, label: 'Main Dishes' },
//   { key: 'atmosphere', Icon: Icons.Atmosphere, label: 'Atmosphere' },
  { key: 'ingredients', Icon: Icons.Ingredient, label: 'Ingredients' },
  { key: 'occasion', Icon: Icons.Occasion, label: 'Occasion' },
  { key: 'distance', Icon: Icons.Distance, label: 'Distance' },
];

// PlaceCard is now imported from ./Components/PlaceCard

export default function RandomModeCard({ onBack, currentUser, onLogout }) {
    const { lang, switchLanguage, t } = useLanguage();
    const { isDarkMode, toggleTheme } = useTheme();
    const [recommendations, setRecommendations] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [detailItem, setDetailItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savedIds, setSavedIds] = useState([]);
    const [detailSelectedTags, setDetailSelectedTags] = useState([]);
    
    // Carousel State
    const [centerIndex, setCenterIndex] = useState(2); 
    
    // Modal Selection State
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showAllTagsModal, setShowAllTagsModal] = useState(false);
    
    // Logic cho Modal chọn Tag
    const [expandedParents, setExpandedParents] = useState([]); // Lưu các tag cha đang mở
    const [searchTerm, setSearchTerm] = useState('');

    const activeFilter = FILTER_ORDER[centerIndex];

    // --- 1. TÍNH TOÁN LIST TAGS ĐỂ TRUYỀN XUỐNG CON ---
    const allSelectedTagValues = useMemo(() => {
        let list = [];
        Object.values(selectedFilters).forEach((values) => {
            if (Array.isArray(values)) list.push(...values); 
        });
        return list;
    }, [selectedFilters]);

    // --- 2. LIST TAG CÓ KEY ĐỂ HIỂN THỊ HEADER ---
    const allSelectedTagsWithKey = useMemo(() => {
        let list = [];
        Object.entries(selectedFilters).forEach(([key, values]) => {
            if(Array.isArray(values)) {
                values.forEach(v => list.push({ key, value: v }));
            }
        });
        return list;
    }, [selectedFilters]);

    // Init fetch
    useEffect(() => { handleShuffle(); }, []);

    async function handleShuffle() {
        setLoading(true);
        setRecommendations([]);

        // 1. Separate 'distance' tags from the rest
        // We do NOT send "distance" inside 'tags' because the backend treats those as text fields.
        const requestTags = { ...selectedFilters };
        const distanceTags = requestTags['distance'];
        delete requestTags['distance'];

        // 2. Define the Fetch Logic
        const performFetch = async (geoPayload = null) => {
            try {
                const body = { 
                    tags: requestTags, 
                    count: 4, 
                    geo: geoPayload // { center: {lat, lng}, maxKm: 5 }
                };
                const res = await axios.post('http://127.0.0.1:8000/api/filter-random', body);
                const data = Array.isArray(res.data) ? res.data : [];
                setRecommendations(data);
            } catch (e) {
                console.error('Fetch random failed:', e);
            } finally {
                setLoading(false);
            }
        };

        // 3. Check if Distance Filter is active
        if (distanceTags && distanceTags.length > 0) {
            // Determine max radius based on selected tags
            let maxKm = 0;
            distanceTags.forEach(tg => {
                if (tg.includes("Dưới 1km")) maxKm = Math.max(maxKm, 1);
                else if (tg.includes("3km")) maxKm = Math.max(maxKm, 3);
                else if (tg.includes("5km")) maxKm = Math.max(maxKm, 5);
                else if (tg.includes("10km")) maxKm = Math.max(maxKm, 10);
            });
            if (maxKm === 0) maxKm = 5; // Default fallback

            // Get User Location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        // Call API WITH Location
                        performFetch({
                            center: { lat: latitude, lng: longitude },
                            maxKm: maxKm
                        });
                    },
                    (error) => {
                        console.warn("Location access denied:", error);
                        alert("Please enable location to use Distance filter.");
                        // Fallback: Fetch without location filtering
                        performFetch(null); 
                    }
                );
            } else {
                alert("Geolocation not supported.");
                performFetch(null);
            }
        } else {
            // No Distance filter selected -> Fetch normally
            performFetch(null);
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

    // --- SELECTION MODAL LOGIC (NEW) ---
    const openSelectionModal = () => {
        setSearchTerm('');
        setExpandedParents([]);
        setShowSelectionModal(true);
    };

    const closeSelectionModal = () => {
        setShowSelectionModal(false);
    };

    const toggleParentExpand = (parentName, e) => {
        e.stopPropagation(); // Ngăn việc click mũi tên thì chọn luôn tag cha
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
            if (newList.length === 0) { const newObj = { ...prev }; delete newObj[key]; return newObj; }
            return { ...prev, [key]: newList };
        });
    };

    const findCategoryForTag = (tag) => {
        for (const [key, groups] of Object.entries(HIERARCHICAL_TAGS)) {
            for (const group of groups) {
                if (group.children.includes(tag)) return key;
            }
        }
        return 'main_dishes'; // Fallback
    };

    const handleDetailTagToggle = (rawTag) => {
        
        // Find the correct category key (e.g., 'price_range' for 'rẻ')
        const categoryKey = findCategoryForTag(rawTag);

        setDetailSelectedTags(prev => prev.includes(rawTag)
            ? prev.filter(t => t !== rawTag)
            : [...prev, rawTag]
        );

        setSelectedFilters(prev => {
            // Use the DYNAMIC categoryKey, not hardcoded 'main_dishes'
            const current = prev[categoryKey] || [];
            const exists = current.includes(rawTag);
            const updated = exists ? current.filter(t => t !== rawTag) : [...current, rawTag];
            
            if (updated.length === 0) {
                const next = { ...prev };
                delete next[categoryKey];
                return next;
            }
            return { ...prev, [categoryKey]: updated };
        });
    };

    const handleGetDirection = (item) => {
        if (!item) return;
        const coords = item.coords || (item.coordinates && item.coordinates.lat && item.coordinates.long
            ? { lat: parseFloat(item.coordinates.lat), lng: parseFloat(item.coordinates.long) }
            : null);
        const parts = [item.name, item.address].filter(Boolean);
        if (parts.length === 0 && coords) parts.push(`${coords.lat},${coords.lng}`);
        const query = parts.join(' ').trim();
        if (!query) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // --- FILTER SEARCH LOGIC ---
    const getFilteredHierarchy = () => {
        const hierarchy = HIERARCHICAL_TAGS[activeFilter.key] || [];
        if (!searchTerm.trim()) return hierarchy;

        const term = searchTerm.toLowerCase();
        // Filter logic: Nếu cha khớp OR con khớp thì hiện
        return hierarchy.map(parent => {
            const parentMatch = parent.name.toLowerCase().includes(term);
            const matchingChildren = parent.children.filter(c => c.toLowerCase().includes(term));
            
            if (parentMatch || matchingChildren.length > 0) {
                // Nếu search khớp con, tự động expand cha
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

    if (detailItem) {
        // record history for logged-in user
        if (currentUser && !currentUser.isGuest && detailItem?.id) {
            const phone = currentUser.phone || currentUser.email || currentUser.facebook_id;
            if (phone) {
                axios.post(`http://127.0.0.1:8000/api/user/${phone}/history`, { restaurant_id: detailItem.id }).catch(() => {});
            }
        }
        return (
            <RestaurantDetail 
                item={detailItem} 
                onBack={() => setDetailItem(null)} 
                onShuffleAgain={() => { setDetailItem(null); handleShuffle(); }} 
                activeTags={[...allSelectedTagValues, ...detailSelectedTags]} 
                onToggleTag={handleDetailTagToggle}
                onGetDirection={() => handleGetDirection(detailItem)}
                currentUser={currentUser}
                onLogout={onLogout}
            />
        );
    }

    const visibleTags = allSelectedTagsWithKey.slice(0, 3);
    const hiddenCount = allSelectedTagsWithKey.length - 3;
    const currentHierarchy = getFilteredHierarchy();

    // --- GUEST MODE BOOKMARK HANDLER ---
    const handleQuickSave = (item) => {
        const isGuest = currentUser?.isGuest || !currentUser;
        if (isGuest) {
            const confirmLogin = window.confirm(t('guest_action_alert'));
            if (confirmLogin && onLogout) {
                onLogout(); 
            }
            return;
        }
        const phone = currentUser.phone || currentUser.email || currentUser.facebook_id;
        const restaurantId = item.id || item._id;
        if (!phone || !restaurantId) return;

        const isSaved = savedIds.includes(restaurantId);
        setSavedIds(prev => isSaved ? prev.filter(id => id !== restaurantId) : [...prev, restaurantId]);

        axios.post(`http://127.0.0.1:8000/api/user/${phone}/bookmark`, { restaurant_id: restaurantId })
            .then((res) => {
                // Sync state with server response
                if (res.data?.status === 'added') {
                    setSavedIds(prev => prev.includes(restaurantId) ? prev : [...prev, restaurantId]);
                } else if (res.data?.status === 'removed') {
                    setSavedIds(prev => prev.filter(id => id !== restaurantId));
                }
            })
            .catch((err) => {
                console.error('Bookmark toggle failed', err);
                // revert local toggle on error
                setSavedIds(prev => isSaved ? [...prev, restaurantId] : prev.filter(id => id !== restaurantId));
            });
    };

    return (
        <div className="rm-container">
            {/* --- HEADER --- */}
            <div className="rm-sticky-header">
                <div className="rm-header-top">
                    <div className="rm-back-btn" onClick={onBack}><Icons.Back /></div>
                    <div style={{flex: 1}}></div>
                    {/* Theme & Language controls */}
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <button className="rm-mini-btn" onClick={toggleTheme}>{isDarkMode ? '☀️' : '🌙'}</button>
                        <button className={`rm-mini-btn ${lang==='vi'?'active':''}`} onClick={() => switchLanguage('vi')}>VI</button>
                        <button className={`rm-mini-btn ${lang==='en'?'active':''}`} onClick={() => switchLanguage('en')}>EN</button>
                        <Icons.Logo />
                    </div>
                </div>
                <div className="rm-titles">
                    <h1>{t('quick_pick')}</h1>
                    <p>{t('random_subtitle')}</p>
                </div>
                <div className="rm-tags-area">
                    <span className="rm-tags-label">{t('selected_tags')}</span>
                    <div className="rm-tags-row">
                        {visibleTags.map((tg) => (
                            <div key={`${tg.key}-${tg.value}`} className="rm-tag-pill">
                                #{t(tg.value)}
                                <div className="rm-tag-close" onClick={() => removeTag(tg.key, tg.value)}><Icons.Close /></div>
                            </div>
                        ))}
                        {hiddenCount > 0 && <button className="rm-more-btn" onClick={() => setShowAllTagsModal(true)}>More</button>}
                    </div>
                </div>
            </div>

            {/* --- CARDS --- */}
            <div className="rm-cards-container">
                {recommendations.length > 0 ? recommendations.map((item, idx) => {
                    const restaurantId = item.id || item._id;
                    const isSaved = restaurantId ? savedIds.includes(restaurantId) : false;
                    return (
                        <PlaceCard 
                            key={restaurantId || idx} 
                            item={item} 
                            onClick={() => setDetailItem(item)} 
                            onSave={handleQuickSave}
                            isSaved={isSaved}
                        />
                    );
                }) : (
                    <div className="rm-empty-state">
                        {loading ? t('finding_matches') : t('press_start')}
                    </div>
                )}
            </div>

            {/* --- BOTTOM BAR --- */}
            <div className="rm-bottom-bar">
                
                {/* 1. SELECTION MODAL (MỚI) */}
                {showSelectionModal && (
                    <div className="rm-selection-modal">
                        <div className="rm-sel-header">
                            <h3>{t('select')} {t(activeFilter.key)}</h3>
                            <div onClick={closeSelectionModal} className="rm-sel-close"><Icons.Close /></div>
                        </div>

                        <div className="rm-search-box">
                            <Icons.Search />
                            <input 
                                type="text" 
                                placeholder= {t('search_tag')} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* ... Các phần trên giữ nguyên ... */}

                        <div className="rm-tags-list-container">
                            {currentHierarchy.map((parent, idx) => {
                                const isParentExpanded = expandedParents.includes(parent.name) || parent.forceExpand;
                                const isParentSelected = selectedFilters[activeFilter.key]?.includes(parent.name);

                                return (
                                    <div key={idx} className="rm-tag-group">
                                        {/* DÒNG TAG CHA */}
                                        <div className="rm-parent-row">
                                            {/* Nút Tag Cha (Dạng Pill Vuông bo góc nhẹ) */}
                                            <button 
                                                className={`rm-pill-btn parent ${isParentSelected ? 'active' : ''}`} 
                                                onClick={() => handleSelectTag(parent.name)}
                                            >
                                                {t(parent.name)}
                                            </button>

                                            {/* Mũi tên mở rộng (Nằm tách biệt bên phải) */}
                                            {parent.children && parent.children.length > 0 && (
                                                <div 
                                                    className={`rm-expand-arrow ${isParentExpanded ? 'rotated' : ''}`} 
                                                    onClick={(e) => toggleParentExpand(parent.name, e)}
                                                >
                                                    <Icons.ChevronDown />
                                                </div>
                                            )}
                                        </div>

                                        {/* LIST TAG CON (Dạng lưới Grid) */}
                                        {isParentExpanded && (
                                            <div className="rm-child-grid">
                                                {parent.children.map((child) => {
                                                    const isChildSelected = selectedFilters[activeFilter.key]?.includes(child);
                                                    
                                                    // Logic ẩn hiện khi search
                                                    if (searchTerm && !child.toLowerCase().includes(searchTerm.toLowerCase()) && !parent.name.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                                                    return (
                                                        <button 
                                                            key={child} 
                                                            className={`rm-pill-btn child ${isChildSelected ? 'active' : ''}`}
                                                            onClick={() => handleSelectTag(child)}
                                                        >
                                                            {t(child)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ... Các phần dưới giữ nguyên ... */}
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
                                            // Nếu đang mở rồi thì đóng, chưa mở thì mở
                                            if (showSelectionModal) closeSelectionModal();
                                            else openSelectionModal();
                                        }
                                    }}
                                >
                                    <div className="rm-icon-circle">{item.Icon()}</div>
                                    <span>{t(item.key)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button className="rm-nav-arrow" onClick={handleNextFilter}><Icons.ArrowRight /></button>
                </div>
                <button className="rm-find-match-btn" onClick={handleShuffle}>{t('find_match')}</button>
            </div>

            {/* Modal Show All Selected Tags (Giữ nguyên) */}
            {showAllTagsModal && (
                <div className="rm-modal-overlay">
                    <div className="rm-modal-sheet">
                        <div className="rm-modal-header">
                            <h3>All Selected Tags</h3>
                            <div onClick={() => setShowAllTagsModal(false)} style={{cursor: 'pointer'}}><Icons.Close /></div>
                        </div>
                        <div className="rm-modal-body">
                            {allSelectedTagsWithKey.map((tg) => (
                                <div key={`${tg.key}-${tg.value}`} className="rm-tag-pill large">
                                    #{t(tg.value)}
                                    <div className="rm-tag-close" onClick={() => removeTag(tg.key, tg.value)}><Icons.Close /></div>
                                </div>
                            ))}
                        </div>
                        <div className="rm-modal-footer">
                            <button className="rm-clear-btn" onClick={() => { setSelectedFilters({}); setShowAllTagsModal(false); }}>Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
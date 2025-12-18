import React, { useState, useEffect, useMemo } from 'react';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
import { TAG_DEFINITIONS } from './tags'; 

// --- ICONS SVG (Thêm Search, Chevron, Check) ---
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
  { key: 'atmosphere', Icon: Icons.Atmosphere, label: 'Atmosphere' },
  { key: 'occasion', Icon: Icons.Occasion, label: 'Occasion' },
  { key: 'distance', Icon: Icons.Distance, label: 'Distance' },
];

// --- MOCK DATA HIERARCHY (Cấu trúc 3 chiều như bạn yêu cầu) ---
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

export default function RandomModeCard({ onBack }) {
    const [recommendations, setRecommendations] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [detailItem, setDetailItem] = useState(null);
    const [loading, setLoading] = useState(false);
    
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

    // Mock Data Init
    useEffect(() => { handleShuffle(); }, []);

    async function handleShuffle() {
        setLoading(true);
        setRecommendations([]);
        setTimeout(() => {
            const mockData = [
                { id: 1, name: "Phở Thìn Lò Đúc", imageUrl: "https://vcdn-dulich.vnecdn.net/2021/03/17/pho-thin-1-1615970222.jpg", rating: 4.8, address: "13 Lò Đúc, Hà Nội", tags: ["#LocalSpecility", "#BanhMi", "#Takeaway"] },
                { id: 2, name: "Bún Chả Hương Liên", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Bun_Cha_Huong_Lien.jpg/1200px-Bun_Cha_Huong_Lien.jpg", rating: 4.5, address: "24 Lê Văn Hưu" },
                { id: 3, name: "Cà phê Giảng", imageUrl: "https://cafegiang.vn/wp-content/uploads/2019/07/cafe-trung-hanoi-1.jpg", rating: 4.7, address: "39 Nguyễn Hữu Huân" },
                { id: 4, name: "Bánh Mì Dân Tổ", imageUrl: "https://cdn.tgdd.vn/Files/2020/09/24/1293345/banh-mi-dan-to-la-gi-o-dau-ma-khien-gioi-tre-xep-hang-luc-3-gio-sang-de-mua-202201131014197368.jpg", rating: 4.2, address: "Ngã 3 Cao Thắng" },
            ];
            setRecommendations(mockData);
            setLoading(false);
        }, 800);
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

    const handleDetailTagToggle = (tagWithHash) => {
        const rawTag = tagWithHash.replace(/^#/, '');
        // Logic tìm category (giữ nguyên logic cũ của bạn hoặc cập nhật theo HIERARCHICAL_TAGS)
        // ... (Giữ nguyên logic cũ cho ngắn gọn vì bạn nói phần khác đã OK)
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
        return <RestaurantDetail item={detailItem} onBack={() => setDetailItem(null)} onShuffleAgain={() => { setDetailItem(null); handleShuffle(); }} activeTags={allSelectedTagValues} onToggleTag={handleDetailTagToggle} />;
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
                    <div style={{flex: 1}}></div>
                    <Icons.Logo />
                </div>
                <div className="rm-titles">
                    <h1>Quick Pick</h1>
                    <p>Randomized for you</p>
                </div>
                <div className="rm-tags-area">
                    <span className="rm-tags-label">Selected tags</span>
                    <div className="rm-tags-row">
                        {visibleTags.map((t) => (
                            <div key={`${t.key}-${t.value}`} className="rm-tag-pill">
                                #{t.value}
                                <div className="rm-tag-close" onClick={() => removeTag(t.key, t.value)}><Icons.Close /></div>
                            </div>
                        ))}
                        {hiddenCount > 0 && <button className="rm-more-btn" onClick={() => setShowAllTagsModal(true)}>More</button>}
                    </div>
                </div>
            </div>

            {/* --- CARDS --- */}
            <div className="rm-cards-container">
                {recommendations.length > 0 ? recommendations.map((item, idx) => (
                    <PlaceCard key={idx} item={item} onClick={() => setDetailItem(item)} />
                )) : <div className="rm-empty-state">{loading ? "Finding best matches..." : "Press 'Find my match' to start!"}</div>}
            </div>

            {/* --- BOTTOM BAR --- */}
            <div className="rm-bottom-bar">
                
                {/* 1. SELECTION MODAL (MỚI) */}
                {showSelectionModal && (
                    <div className="rm-selection-modal">
                        <div className="rm-sel-header">
                            <h3>Select the {activeFilter.label}</h3>
                            <div onClick={closeSelectionModal} className="rm-sel-close"><Icons.Close /></div>
                        </div>

                        <div className="rm-search-box">
                            <Icons.Search />
                            <input 
                                type="text" 
                                placeholder="Search tag..." 
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
                                                {parent.name}
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
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button className="rm-nav-arrow" onClick={handleNextFilter}><Icons.ArrowRight /></button>
                </div>

                <button className="rm-find-match-btn" onClick={handleShuffle}>Find my match</button>
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
                            {allSelectedTagsWithKey.map((t) => (
                                <div key={`${t.key}-${t.value}`} className="rm-tag-pill large">
                                    {t.value}
                                    <div className="rm-tag-close" onClick={() => removeTag(t.key, t.value)}><Icons.Close /></div>
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
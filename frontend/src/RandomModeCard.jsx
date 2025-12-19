import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
    Star: ({ fill = "none" }) => {
        const stroke = fill !== "none" ? "#FFC107" : "#E0E0E0";
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
        );
    },
    Bookmark: ({ filled = false }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#333"} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
    ),
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
    Close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    ArrowLeft: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
    ArrowRight: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
    Logo: () => <img src={logo} alt="Logo" style={{ width: 24, height: 24, marginRight: 8 }} />,
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
        { name: "giá tiền", children: ["siêu rẻ", "rẻ", "bình dân", "sang", "nhà hàng", "cao cấp", "thượng lưu", "đại gia"] }
    ],
    cuisine_origin: [
        { name: "Bắc", children: [] },
        { name: "Trung", children: [] },
        { name: "Tây", children: [] },
        { name: "Nam", children: [] },
        { name: "Tây Nguyên", children: [] },
        { name: "nước ngoài", children: [] },
        { name: "miền Bắc", children: ["Hà Nội", "Hải Phòng", "Tây Bắc"] },
        { name: "miền Trung", children: ["Phú Yên", "Huế", "Quảng Ngãi", "Đà Nẵng", "Quảng Nam", "Khánh Hòa", "Phan Rang", "Bình Định", "Nghệ An", "Hà Tĩnh"] },
        { name: "miền Tây", children: ["Tiền Giang", "Đồng Tháp", "Cà Mau", "Sóc Trăng", "An Giang"] },
        { name: "miền Nam", children: ["Sài Gòn", "Bà Rịa - Vũng Tàu"] },
        { name: "Tây Nguyên", children: ["Đắk Lắk", "Kon Tum", "Lâm Đồng", "Pleiku", "Đắk Nông", "Gia Lai"] },
        { name: "nước ngoài", children: ["Anh", "Pháp", "Mỹ", "Ý", "Đức", "Hy Lạp", "Nhật Bản", "Hàn Quốc", "Trung Quốc"] }
    ],
    main_dishes: [
        { name: "nhiệt độ", children: ["lạnh như băng", "lạnh", "mát", "nguội", "ấm", "nóng", "sôi/rất nóng"] },
        { name: "độ ngọt", children: ["không ngọt", "ít ngọt", "vừa ngọt", "ngọt đậm", "rất ngọt"] },
        { name: "độ cay", children: ["không cay", "cay nhẹ", "cay vừa", "cay nhiều", "rất cay"] },
        { name: "độ béo", children: ["không béo", "béo nhẹ", "béo vừa", "béo đậm"] },
        { name: "độ mặn", children: ["nhạt", "hơi mặn", "mặn vừa", "mặn đậm"] },
        { name: "độ chua", children: ["không chua", "chua nhẹ", "chua vừa", "chua đậm"] },
        { name: "sợi", children: ["bún", "phở", "hủ tiếu", "mì sợi", "bánh canh bột gạo", "bánh đa", "miến dong", "miến/bún tàu"] },
        { name: "món nếp", children: ["cơm", "xôi", "cốm"] },
        { name: "bánh bột gạo", children: ["bánh xèo", "bánh bèo", "bánh căn", "bánh cuốn", "bánh ướt", "bánh hỏi", "bánh bò", "bánh đúc", "bánh nếp"] },
        { name: "bánh bột mì", children: ["bánh mì", "bánh bao", "bánh quẩy", "bánh tiêu", "bánh su kem", "bánh bông lan", "donut"] },
        { name: "món ăn nước", children: ["súp", "lẩu", "cháo", "cà ri", "hầm"] },
        { name: "món khô", children: ["xào", "chiên", "nướng", "trộn", "hấp", "kho", "rang", "quay", "luộc"] },
        { name: "thức uống", children: ["cà phê", "trà sữa", "nước ép/ sinh tố", "có cồn", "nước có ga", "trà"] },
        { name: "đồ ăn ngọt", children: ["chè", "kem tươi", "kem cheese", "sữa chua", "trân châu", "thạch", "kem trứng", "flan"] },
        { name: "tinh bột", children: ["gạo", "bắp"] },
        { name: "thảo mộc", children: ["sả", "hồi", "quế", "gừng", "lá dứa", "vani", "matcha"] },
        { name: "thịt gia súc", children: ["thịt bò", "thịt heo", "thịt trâu", "thịt dê", "thịt cừu"] },
        { name: "thịt gia cầm", children: ["thịt gà", "thịt vịt", "thịt ngan", "thịt ngỗng", "thịt chim cút"] },
        { name: "hải sản", children: ["tôm", "mực", "cá", "nghêu", "sò", "ốc", "cua", "bào ngư"] },
        { name: "món chay", children: ["rau củ", "đậu hũ", "nấm", "chả chay"] },
        { name: "trái cây", children: ["họ cam", "dâu/phúc bồn tử", "đào", "vải/nhãn", "xoài", "cóc", "bơ", "táo", "mít", "sầu riêng"] },
        { name: "sữa", children: ["sữa"] },
        { name: "trứng", children: ["trứng gà", "trứng cút"] },
        { name: "dừa", children: ["nước cốt dừa", "dừa"] },
        { name: "đậu - hạt", children: ["cà phê", "đậu phộng", "đậu đen", "đậu đỏ", "đậu ván", "cacao", "hạt sen"] },
        { name: "không phải trái cây", children: ["rau má", "matcha", "cacao"] }
    ],
    atmosphere: [
        { name: "vật chất", children: ["đèn vàng", "cửa sổ", "ghế êm", "chậu hoa", "bàn hai người", "nến", "tiểu cảnh", "rèm"] },
        { name: "không gian", children: ["thoáng đãng", "ấm áp", "riêng tư", "hương tinh dầu", "lãng mạn", "kết nối"] },
        { name: "âm thanh", children: ["nhạc", "yên tĩnh", "âm thanh nền"] }
    ],
    occasion: [
        { name: "thời điểm/dịp", children: ["bữa sáng", "ăn vặt", "tráng miệng", "buổi đêm", "buổi trưa"] }
    ],
    distance: [
        { name: "Gần tôi", children: ["Dưới 1km", "1km - 3km"] },
        { name: "Xung quanh", children: ["3km - 5km", "5km - 10km"] }
    ]
};

// Map child tag -> parent tags to allow parent matching when only children are present
const CHILD_TO_PARENT = (() => {
    const map = new Map();
    Object.values(HIERARCHICAL_TAGS).forEach(groups => {
        groups.forEach(({ name, children = [] }) => {
            children.forEach(child => {
                if (!map.has(child)) map.set(child, new Set());
                map.get(child).add(name);
            });
        });
    });
    return map;
})();

const PlaceCard = ({ item, onClick, isSaved, onToggleSave }) => (
    <div className="place-card" onClick={onClick}>
        <div className="place-image-wrapper">
            <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }} />
            <div className="place-bookmark" onClick={(e) => { e.stopPropagation(); onToggleSave(item); }}>
                <Icons.Bookmark filled={isSaved} />
            </div>
        </div>
        <div className="place-info-overlay">
            <h3 className="place-name">{item.name}</h3>
            <div className="place-rating">
                {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} fill={s <= (item.rating ?? 0) ? "#FFC107" : "none"} />)}
                <span style={{ marginLeft: 4, color: '#FFC107', fontWeight: 'bold' }}>{item.rating ?? 0}</span>
            </div>
        </div>
    </div>
);

export default function RandomModeCard({ onBack, currentUser, onDetailViewChange }) {
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
    const [expandedParents, setExpandedParents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Navigation
    const [isNavigating, setIsNavigating] = useState(false);

    // Notify parent when detail view opens/closes
    useEffect(() => {
        if (onDetailViewChange) onDetailViewChange(!!detailItem);
    }, [detailItem, onDetailViewChange]);

    // Geolocation & Distance
    const [userLoc, setUserLoc] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);

    // Bookmarks
    const [savedIds, setSavedIds] = useState([]);

    // Get active filter from carousel center position
    const activeFilter = FILTER_ORDER[centerIndex];

    // Dịch Label của Filter
    const filtersList = [
        { key: 'price_range', Icon: Icons.Price, label: 'Price' },
        { key: 'cuisine_origin', Icon: Icons.Origin, label: 'Origin' },
        { key: 'main_dishes', Icon: Icons.Dish, label: 'Main Dishes' },
        { key: 'atmosphere', Icon: Icons.Atmosphere, label: 'Atmosphere' },
        { key: 'occasion', Icon: Icons.Occasion, label: 'Occasion' },
        { key: 'distance', Icon: Icons.Distance, label: 'Distance' },
    ];

    const getFilterOptions = (key) => {
        switch (key) {
            case 'price_range': return TAG_DEFINITIONS["giá tiền"];
            case 'cuisine_origin': return [...TAG_DEFINITIONS["miền Bắc"], ...TAG_DEFINITIONS["miền Trung"], ...TAG_DEFINITIONS["miền Nam"], ...TAG_DEFINITIONS["nước ngoài"]];
            case 'main_dishes': return [...TAG_DEFINITIONS["món ăn nước"], ...TAG_DEFINITIONS["món khô"], ...TAG_DEFINITIONS["sợi"], ...TAG_DEFINITIONS["món rời"], ...TAG_DEFINITIONS["hải sản"], ...TAG_DEFINITIONS["thịt gia súc"], ...TAG_DEFINITIONS["thịt gia cầm"], ...TAG_DEFINITIONS["bánh bột gạo"], ...TAG_DEFINITIONS["bánh bột mì"]];
            case 'atmosphere': return [...TAG_DEFINITIONS["không gian"], ...TAG_DEFINITIONS["vật chất"], ...TAG_DEFINITIONS["âm thanh"]];
            case 'occasion': return ['Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Hẹn hò', 'Tiếp khách', 'Họp nhóm'];
            case 'distance': return ['1 km', '3 km', '5 km'];
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
        setLoading(true);
        setRecommendations([]);
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
                    let thumb = 'https://placehold.co/400x300?text=No+Image';
                    if (item.places_images?.length) thumb = item.places_images[0];
                    else if (item.menu_images?.length) thumb = item.menu_images[0];
                    else if (item.thumbnail) thumb = item.thumbnail;

                    const rawScore = item?.rating_info?.score ?? item?.rating ?? item?.rating_score ?? item?.score ?? 0;
                    const ratingScore = Number(String(rawScore).replace(',', '.')) || 0;
                    const ratingCount = item?.rating_info?.count ?? item?.rating_count ?? item?.reviews_count ?? 0;

                    const rawTags = Object.values(item.tags || {}).flat().filter(t => typeof t === 'string');
                    const tagSet = new Set(rawTags);
                    rawTags.forEach(tag => {
                        if (CHILD_TO_PARENT.has(tag)) {
                            CHILD_TO_PARENT.get(tag).forEach(parent => tagSet.add(parent));
                        }
                    });

                    return {
                        ...item,
                        imageUrl: thumb,
                        imagesMenu: item.menu_images || [],
                        imagesViews: item.places_images || [],
                        tags: Array.from(tagSet),
                        address: item.address || "Unknown",
                        openTime: item.opening_hours?.[0]?.hours || "See details",
                        rating: ratingScore,
                        ratingCount
                    };
                });
                setRecommendations(normalized);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    const handleQuickSave = async (item) => {
        if (!userId) return alert("Please login to save!");
        const isCurrentlySaved = savedIds.includes(item.id);
        if (isCurrentlySaved) setSavedIds(prev => prev.filter(id => id !== item.id));
        else setSavedIds(prev => [...prev, item.id]);
        try { await axios.post(`${API_URL}/user/${userId}/bookmark`, { restaurant_id: item.id }); } catch (e) { console.error(e); }
    };

    function onFilterClick(key) {
        // Không dùng, vì dùng carousel thay vào
    }

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
            if (Array.isArray(values)) {
                values.forEach(v => list.push({ key, value: v }));
            }
        });
        return list;
    }, [selectedFilters]);

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
        return <RestaurantDetail item={detailItem} onBack={() => setDetailItem(null)} onShuffleAgain={() => { setDetailItem(null); handleShuffle(); }} activeTags={allSelectedTagValues} onToggleTag={handleDetailTagToggle} currentUser={currentUser} />;
    }

    if (isNavigating && detailItem) {
        return (<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 21000 }}>
            <MapNavigationPage item={detailItem} onBack={() => setIsNavigating(false)} /></div>);
    }

    if (detailItem) {
        return (<div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20000, background: 'white' }}>
            <RestaurantDetail item={detailItem} onBack={() => setDetailItem(null)} onShuffleAgain={() => { setDetailItem(null); handleShuffle(); }} onGetDirection={() => setIsNavigating(true)} currentUser={currentUser} /></div>);
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
                    <PlaceCard
                        key={idx}
                        item={item}
                        isSaved={savedIds.includes(item.id)}
                        onToggleSave={handleQuickSave}
                        onClick={() => setDetailItem(item)}
                    />
                )) : <div className="rm-empty-state">{loading ? "Finding best matches..." : "Press 'Find my match' to start!"}</div>}
            </div>

            {/* --- BOTTOM BAR --- */}
            <div className="rm-bottom-bar">

                {/* 1. SELECTION MODAL */}
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

                <button className="rm-find-match-btn" onClick={handleShuffle}>Find my match</button>
            </div>

            {/* Modal Show All Selected Tags */}
            {showAllTagsModal && (
                <div className="rm-modal-overlay">
                    <div className="rm-modal-sheet">
                        <div className="rm-modal-header">
                            <h3>All Selected Tags</h3>
                            <div onClick={() => setShowAllTagsModal(false)} style={{ cursor: 'pointer' }}><Icons.Close /></div>
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
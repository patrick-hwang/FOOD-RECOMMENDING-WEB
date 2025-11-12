import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// XÓA: Đã xóa các import hình ảnh example_restaurant

// --- (Component AppEntranceEffect giữ nguyên) ---
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

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (hideRects && typeof onDone === 'function') onDone();
  }, [hideRects, onDone]);

  return (
    <div className="EntranceEffect">
      {!hideRects && (
        <>
          <div className={`entrance-slide-rect top ${entered ? 'in' : ''}`}>
            <span className={`entrance-text ${showText ? 'in' : ''}`}>NEW DESTINATIONS</span>
          </div>
          <div className={`entrance-slide-rect bottom ${entered ? 'in' : ''}`}>
            <span className={`entrance-text ${showText ? 'in' : ''}`}>NEW CRAVINGS</span>
          </div>
        </>
      )}
    </div>
  );
}

// --- (Component AppChooseMode giữ nguyên) ---
function AppChooseMode({ onRandom, onTaste }) {
  return (
    <div className="choose-mode-container">
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
          <div
            className="option-card random-card"
            role="button"
            tabIndex={0}
            onClick={onRandom}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onRandom()}
          >
            <h2 className="card-title">Quick & Random</h2>
            <div className="card-icon">
              <span role="img" aria-label="Dice icon">🎲</span>
            </div>
            <p className="card-description">Filters & random 3 spots</p>
          </div>

          <div
            className="option-card taste-card"
            role="button"
            tabIndex={0}
            onClick={onTaste}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onTaste()}
          >
            <h2 className="card-title">Test your Taste</h2>
            <div className="card-icon">
              <span role="img" aria-label="Question mark icon">❓</span>
            </div>
            <p className="card-description">Quizzes for personalized recommendations</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <a href="#help" className="help-link">Help?</a>
      </footer>
    </div>
  );
}

// XÓA: Đã xóa mảng fallbackResults

// --- (Component ResultCard giữ nguyên) ---
const ResultCard = ({ name, imageUrl, description, onClick }) => (
  <div
    className="result-card"
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}
  >
    <div className="card-image-container">
      <img 
        src={imageUrl} 
        alt={name} 
        className="card-image" 
        // Thêm fallback image placeholder nếu link ảnh bị lỗi
        onError={(e) => { e.target.src = 'https://placehold.co/300x200/eee/ccc?text=Image+Error'; }}
      />
    </div>
    <h3 className="card-name">{name}</h3>
    <p className="card-text-placeholder">
      {description}
    </p>
  </div>
);

// --- (COMPONENT RandomModeCard ĐÃ ĐƯỢC CẬP NHẬT) ---
function RandomModeCard({ onBack }) {
  const [visibleResults, setVisibleResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Mỗi key có thể chứa NHIỀU giá trị (mảng string)
  const [selectedFilters, setSelectedFilters] = useState({});
  const [detailItem, setDetailItem] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [imageGroup, setImageGroup] = useState('menu'); // 'menu' | 'views' | 'map'
  const [enlargedImg, setEnlargedImg] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userLoc, setUserLoc] = useState(null); // {lat, lng}
  const [distanceKm, setDistanceKm] = useState(null); // number

  // (Các bộ lọc filterOptions và filters giữ nguyên)
  const filterOptions = {
    price_range: ['rẻ', 'trung bình', 'sang'],
    cuisine_origin: ['Việt', 'Trung Quốc', 'Hồng Kông', 'Nhật', 'Hàn'],
    main_dishes: ['lẩu', 'bò', 'buffet', 'hải sản', 'phở', 'cơm', 'bún'], 
    distance: ['1 km', '3 km', '5 km'],
    speciality_vn: ['yes', 'no'],
  };
  const filters = [
    { key: 'price_range', icon: '💰', label: 'Giá cả' },
    { key: 'cuisine_origin', icon: '🌐', label: 'Nguồn gốc' },
    { key: 'main_dishes', icon: '🍽️', label: 'Món chính' },
    { key: 'distance', icon: '📍', label: 'Khoảng cách' },
    { key: 'speciality_vn', icon: '⭐', label: 'Đặc sản VN', tooltip: 'Quán đặc sản hoặc nổi tiếng của Việt Nam' },
  ];

  function onFilterClick(key) {
    setActiveFilter(prev => (prev === key ? null : key));
    if (key === 'distance' && !userLoc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Geolocation error', err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  function handleChooseFilter(filterKey, option) {
    // Toggle chọn/bỏ chọn 1 option trong nhóm
    if (filterKey === 'distance') {
      // Parse "X km" => number
      const km = parseFloat(String(option).replace(/[^0-9.]/g, ''));
      setDistanceKm(isNaN(km) ? null : km);
      // giữ panel mở để chọn lại nhanh
      return;
    }
    if (filterKey === 'speciality_vn') {
      // radio: chỉ chọn 1 trong yes/no
      setSelectedFilters(prev => ({ ...prev, [filterKey]: option }));
      return;
    }
    setSelectedFilters(prev => {
      const prevVals = Array.isArray(prev[filterKey])
        ? prev[filterKey]
        : (prev[filterKey] ? [prev[filterKey]] : []);
      const exists = prevVals.includes(option);
      const nextVals = exists
        ? prevVals.filter(v => v !== option)
        : [...prevVals, option];

      const next = { ...prev };
      if (nextVals.length) {
        next[filterKey] = nextVals;
      } else {
        delete next[filterKey];
      }
      return next;
    });
    // Giữ panel mở để chọn nhiều; đóng nếu muốn UX khác
    // setActiveFilter(null);
  }
  
  // SỬA: Hàm handleShuffle đã được cập nhật
  async function handleShuffle() {
    setLoading(true);
    setError(null);
    setVisibleResults([]); 

    // Chuẩn bị tags gửi lên server (convert speciality_vn yes/no -> boolean)
    const tagsForPayload = { ...selectedFilters };
    if (typeof tagsForPayload.speciality_vn === 'string') {
      tagsForPayload.speciality_vn = tagsForPayload.speciality_vn === 'yes';
    }
    const payload = { tags: tagsForPayload, count: 3 };
    if (userLoc && distanceKm) {
      payload.geo = { center: userLoc, maxKm: distanceKm };
    }

    try {
      const response = await fetch('https://food-recommending-web.onrender.com/api/filter-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.statusText}`);
      }

  const results = await response.json();

      // SỬA: Không dùng fallback. Nếu không có kết quả, chỉ báo lỗi.
      if (!results || results.length === 0) {
        setError("Không tìm thấy kết quả nào, hãy thử bỏ bớt bộ lọc!");
        return;
      }
      
      // SỬA: Logic chuẩn hóa mới
  const normalized = results.map((item) => {
        
        // --- LOGIC TÌM ẢNH MỚI ---
        let imageUrl = 'https://placehold.co/300x200/eee/ccc?text=No+Image'; // Ảnh mặc định
        
        if (item.image_urls && item.image_urls.length > 0) {
          // 1. Ưu tiên tìm ảnh kết thúc bằng "/1.png"
          const onePng = item.image_urls.find(url => url.endsWith('/1.png'));
          
          if (onePng) {
            imageUrl = onePng; // Tìm thấy!
          } else {
            // 2. Nếu không, dùng ảnh đầu tiên trong mảng
            imageUrl = item.image_urls[0]; 
          }
        }
        // --- KẾT THÚC LOGIC TÌM ẢNH ---

        // Thu thập toàn bộ tag thành một mảng phẳng
        const allTags = item.tags ? Object.values(item.tags).flat().filter(Boolean) : [];
        const images = Array.isArray(item.image_urls) ? item.image_urls : [];

        const groupedTags = categorizeTags(item.tags || {});
        const { menuImages, viewImages } = splitImages(images);

        // --- Tìm toạ độ ---
        let coords = null;
        if (item && item.location && Array.isArray(item.location.coordinates) && item.location.coordinates.length >= 2) {
          const [lng, lat] = item.location.coordinates; coords = { lat: Number(lat), lng: Number(lng) };
        } else if (item && item.geometry && Array.isArray(item.geometry.coordinates) && item.geometry.coordinates.length >= 2) {
          const [lng, lat] = item.geometry.coordinates; coords = { lat: Number(lat), lng: Number(lng) };
        } else if (typeof item.lat === 'number' && typeof item.lng === 'number') {
          coords = { lat: item.lat, lng: item.lng };
        } else if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
          coords = { lat: item.latitude, lng: item.longitude };
        } else if (item && item.geo && typeof item.geo.lat === 'number' && typeof item.geo.lng === 'number') {
          coords = { lat: item.geo.lat, lng: item.geo.lng };
        }

        return {
          id: item.id, 
          name: item.name,
          imageUrl: imageUrl, // Sử dụng link ảnh đã tìm thấy
          description: item.type || item.description || (item.tags ? item.tags.main_dishes?.join(', ') : ''),
          tags: allTags,
          images,
          groupedTags,
          imagesMenu: menuImages,
          imagesViews: viewImages,
          coords,
          raw: item
        };
      });

      // Server đã lọc AND theo tag, client chỉ nhận kết quả
      setVisibleResults(normalized);

    } catch (err) {
      console.error('Lỗi khi shuffle:', err);
      setError(err.message);
      // SỬA: Không dùng fallback
      // setVisibleResults(fallbackResults.slice(0, 3)); 
    } finally {
      setLoading(false);
    }
  }

  function openDetail(item) {
    setDetailItem(item);
    // chọn nhóm ảnh mặc định: ưu tiên menu nếu có, ngược lại views
    const defaultGroup = (item && item.imagesMenu && item.imagesMenu.length)
      ? 'menu'
      : (item && item.imagesViews && item.imagesViews.length)
        ? 'views'
        : (item && item.coords ? 'map' : 'menu');
    setImageGroup(defaultGroup);
    setShowAllTags(false);
  }

  function closeDetail() {
    setDetailItem(null);
  }

  function pickRandomTags(tags = [], count = 5) {
    if (!tags.length) return [];
    const arr = [...new Set(tags)];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(count, arr.length));
  }

  // --- Helpers: phân loại tag & tách ảnh ---
  function categorizeTags(tagsObj) {
    const originKeys = ['origin', 'cuisine_origin', 'cuisine', 'country', 'quoc_gia', 'nguon_goc'];
    const budgetKeys = ['budget', 'price', 'price_range', 'gia', 'gia_ca'];
    const specialityKeys = ['speciality', 'specialties', 'features', 'signature', 'dac_san', 'dac_biet'];
    const foodTypeKeys = ['foodType', 'type', 'main_dishes', 'dish', 'mon_chinh', 'mon_an'];

    const getValues = (keys) => keys.flatMap(k => Array.isArray(tagsObj[k]) ? tagsObj[k] : (tagsObj[k] ? [tagsObj[k]] : [])).filter(Boolean);

    return {
      origin: getValues(originKeys),
      budget: getValues(budgetKeys),
      specialities: getValues(specialityKeys),
      foodType: getValues(foodTypeKeys),
    };
  }

  function splitImages(imgs = []) {
    const menuHints = ['menu', 'thuc-don', 'thucdon', 'thực đơn', 'thuc_don'];
    const isMenu = (url = '') => menuHints.some(h => url.toLowerCase().includes(h));
    const menuImages = imgs.filter(u => isMenu(u));
    const viewImages = imgs.filter(u => !isMenu(u));
    return { menuImages, viewImages };
  }

  // Khởi tạo/refresh bản đồ khi chuyển tab Map hoặc khi item đổi
  useEffect(() => {
    if (imageGroup !== 'map') {
      // cleanup map khi rời tab
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }
    if (!detailItem || !detailItem.coords || !mapContainerRef.current) return;

    // dọn sạch instance cũ
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { lat, lng } = detailItem.coords;
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(detailItem.name || 'Restaurant');
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [imageGroup, detailItem]);

  // Tự động shuffle mỗi khi filter thay đổi (bao gồm tag được chọn)
  useEffect(() => {
    handleShuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]); 

  // Helper: thêm filter khi người dùng bấm tag trong modal
  function addFilterFromTag(tag, categoryKeyGuess) {
    // map nhóm -> key filter tương ứng trong payload
    const mapToFilterKey = {
      origin: 'cuisine_origin',
      budget: 'price_range',
      foodType: 'main_dishes',
      specialities: 'specialities'
    };

    let filterKey = categoryKeyGuess && mapToFilterKey[categoryKeyGuess];
    if (!filterKey && detailItem && detailItem.groupedTags) {
      const grp = detailItem.groupedTags;
      const found = Object.entries(grp).find(([, list]) => (list || []).includes(tag));
      if (found) filterKey = mapToFilterKey[found[0]];
    }
    // fallback: nếu không xác định được, đẩy vào foodType cho an toàn
    if (!filterKey) filterKey = 'main_dishes';

    setSelectedFilters(prev => {
      const prevVals = Array.isArray(prev[filterKey]) ? prev[filterKey] : (prev[filterKey] ? [prev[filterKey]] : []);
      if (prevVals.includes(tag)) return prev; // tránh trùng
      return { ...prev, [filterKey]: [...prevVals, tag] };
    });
  }

  return (
    <div className="random-results-container">
      <div className="back-row">
        <button
          className="back-button"
          onClick={() => typeof onBack === 'function' ? onBack() : null}
          aria-label="Return to choosing mode"
        >
          Return
        </button>
      </div>

      {/* Hiển thị Lỗi hoặc Loading */}
      {loading && <div className="loading-text">Đang tìm kiếm...</div>}
      
      {/* SỬA: Hiển thị lỗi rõ ràng hơn */}
      {error && !loading && <div className="error-text">{error}</div>}

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
        <button
          className="shuffle-button"
          onClick={handleShuffle}
          aria-label="Show three shuffled results"
          disabled={loading} 
        >
          {loading ? "Đang xáo trộn..." : "Shuffles"}
        </button>
      </div>
      
      {/* Hiển thị filter đã chọn (đa chọn mỗi nhóm) */}
      <div className="selected-filters-row">
        {Object.entries(selectedFilters).map(([key, values]) => {
          const vals = Array.isArray(values) ? values : (values ? [values] : []);
          const label = filters.find(f => f.key === key)?.label || key;
          return vals.map(val => (
            <span key={`${key}-${val}`} className="selected-filter-tag">
              {label}: {val}
              <button
                aria-label={`Remove ${val} from ${label}`}
                onClick={() => setSelectedFilters(prev => {
                  const next = { ...prev };
                  const arr = Array.isArray(next[key]) ? next[key] : (next[key] ? [next[key]] : []);
                  const newArr = arr.filter(v => v !== val);
                  if (newArr.length) next[key] = newArr; else delete next[key];
                  return next;
                })}
              >×</button>
            </span>
          ));
        })}
        {distanceKm && (
          <span className="selected-filter-tag">
            Khoảng cách: {distanceKm} km
            <button aria-label="Remove distance filter" onClick={() => setDistanceKm(null)}>×</button>
          </span>
        )}
      </div>

      <div className="filters-row">
          {filters.map(filter => (
            <div
              key={filter.key}
              className={`filter-item ${activeFilter === filter.key ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onFilterClick(filter.key)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterClick(filter.key)}
              title={filter.tooltip || undefined}
              aria-label={`${filter.label}${filter.tooltip ? (', ' + filter.tooltip) : ''}`}
            >
              <span role="img" aria-label={`${filter.label} icon`}>{filter.icon}</span> {filter.label}
            </div>
          ))}
      </div>

        {activeFilter && (
          <div className="filter-options" role="region" aria-label={`${activeFilter} options`}>
              {filterOptions[activeFilter].map(opt => {
                const isSelected = Array.isArray(selectedFilters[activeFilter]) && selectedFilters[activeFilter].includes(opt);
                return (
                  <button
                    key={opt}
                    className={`filter-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleChooseFilter(activeFilter, opt)}
                  >
                    {opt}
                  </button>
                );
              })}
          </div>
        )}
      {/* Modal chi tiết nhà hàng */}
      {detailItem && (
        <div className="modal-overlay" onClick={closeDetail} role="dialog" aria-modal="true" aria-label="Restaurant details">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{detailItem.name}</h3>
              <button className="modal-close" aria-label="Close details" onClick={closeDetail}>×</button>
            </div>
            <div className="modal-body">
              {/* Dải ảnh ngang */}
              {/* Chọn nhóm ảnh: Menu / Views */}
              <div className="image-group-toggle" role="tablist" aria-label="Image groups">
                <button
                  className={`toggle-btn ${imageGroup === 'menu' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={imageGroup === 'menu'}
                  onClick={() => setImageGroup('menu')}
                >
                  Menu ({detailItem.imagesMenu?.length || 0})
                </button>
                <button
                  className={`toggle-btn ${imageGroup === 'views' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={imageGroup === 'views'}
                  onClick={() => setImageGroup('views')}
                >
                  Views ({detailItem.imagesViews?.length || 0})
                </button>
                <button
                  className={`toggle-btn ${imageGroup === 'map' ? 'active' : ''}`}
                  role="tab"
                  aria-selected={imageGroup === 'map'}
                  onClick={() => setImageGroup('map')}
                >
                  Map
                </button>
              </div>
              {imageGroup !== 'map' ? (
                <div className="modal-image-strip">
                  {(
                    (imageGroup === 'menu' ? (detailItem.imagesMenu || []) : (detailItem.imagesViews || []))
                    .length ? (imageGroup === 'menu' ? detailItem.imagesMenu : detailItem.imagesViews)
                    : (detailItem.images || [detailItem.imageUrl])
                  ).slice(0, 12).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`photo ${idx + 1}`}
                      onError={(e) => { e.target.src = 'https://placehold.co/240x160/eee/ccc?text=No+Image'; }}
                      onClick={() => setEnlargedImg(url)}
                    />
                  ))}
                </div>
              ) : (
                <div className="modal-map-container">
                  {detailItem.coords ? (
                    <div ref={mapContainerRef} className="leaflet-container" />
                  ) : (
                    <div className="map-empty">Không có vị trí để hiển thị</div>
                  )}
                  <span className="map-hint-text">Powered by OpenStreetMap</span>
                </div>
              )}
              {imageGroup === 'map' && detailItem?.coords && (
                <div className="map-actions">
                  <a
                    className="map-open-google"
                    href={`https://www.google.com/maps/search/?api=1&query=${detailItem.coords.lat},${detailItem.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}

              {/* Mô tả */}
              {detailItem.description && (
                <p className="modal-description">{detailItem.description}</p>
              )}

              {/* Thẻ nổi bật */}
              <div className="modal-tags">
                {pickRandomTags(detailItem.tags, 5).map((tag, i) => (
                  <button key={i} className="tag-chip" onClick={() => addFilterFromTag(tag)}>
                    #{tag}
                  </button>
                ))}
                {detailItem.tags?.length > 5 && (
                  <button className="tag-chip show-more-chip" onClick={() => setShowAllTags(v => !v)}>
                    {showAllTags ? 'Hide' : 'Show more'}
                  </button>
                )}
              </div>

              {showAllTags && (
                <div className="tag-groups">
                  {(
                    [
                      { title: 'Origin', list: detailItem.groupedTags?.origin || [] },
                      { title: 'Budget', list: detailItem.groupedTags?.budget || [] },
                      { title: 'Specialities', list: detailItem.groupedTags?.specialities || [] },
                      { title: 'Food type', list: detailItem.groupedTags?.foodType || [] },
                    ]
                  ).map((grp, idx) => (
                    grp.list.length ? (
                      <div key={idx} className="tag-group">
                        <div className="tag-group-title">{grp.title}</div>
                        <div className="tag-group-chips">
                          {grp.list.map((t, i) => (
                            <button className="tag-chip" key={i} onClick={() => addFilterFromTag(t, grp.title.toLowerCase().includes('origin') ? 'origin' : grp.title.toLowerCase().includes('budget') ? 'budget' : grp.title.toLowerCase().includes('food') ? 'foodType' : 'specialities')}>#{t}</button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              )}

              {/* Menu - nếu có trong dữ liệu thô */}
              {detailItem.raw && (detailItem.raw.menu || detailItem.raw.menus || detailItem.raw.menu_items) && (
                <div className="modal-menu">
                  <h4>Menu</h4>
                  <ul>
                    {(
                      detailItem.raw.menu || detailItem.raw.menus || detailItem.raw.menu_items || []
                    ).slice(0, 8).map((m, idx) => (
                      <li key={idx}>{typeof m === 'string' ? m : (m.name || JSON.stringify(m))}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay phóng to ảnh */}
      {enlargedImg && (
        <div className="image-lightbox" onClick={() => setEnlargedImg(null)} role="dialog" aria-modal="true" aria-label="Enlarged image">
          <img
            src={enlargedImg}
            alt="enlarged"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.target.src = 'https://placehold.co/1200x800/eee/ccc?text=No+Image'; }}
          />
          <button className="lightbox-close" aria-label="Close image" onClick={() => setEnlargedImg(null)}>×</button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState('entrance'); // 'entrance' | 'choosing' | ...

  function randomMode() {
    console.log('enter random mode');
    setMode('random');
  }

  function taste() {
    console.log('enter taste mode');
    setMode('taste');
  }

  // XÓA: Đã xóa useEffect fetch data

  return (
    <div className="App">
      {mode === 'entrance' && <AppEntranceEffect onDone={() => setMode('choosing')} />}
      {mode === 'choosing' && <AppChooseMode onRandom={randomMode} onTaste={taste} />}
      {mode === 'random' && <RandomModeCard onBack={() => setMode('choosing')} />}
      {mode === 'taste' && (
        <div className="mode-container">
          <h2>Taste Quiz</h2>
          <p>Starting taste quiz... (placeholder)</p>
          <button className="back-button" onClick={() => setMode('choosing')}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;
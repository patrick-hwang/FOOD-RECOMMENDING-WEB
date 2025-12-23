import React, { useState } from 'react';
import { useLanguage } from './Context/LanguageContext';
import logo from './assets/images/logo.png';
import diceIMG from './assets/images/Mode-Icon/dice.png'
import compassIMG from './assets/images/Mode-Icon/akinator.png'
import axios from 'axios';
import './AppChooseMode.css';
import RestaurantDetail from './RestaurantDetail';

// Icons for results
const Icons = {
    Star: ({ fill = "none" }) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    ),
    Back: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    )
};

// PlaceCard Component
const PlaceCard = ({ item, onClick }) => {
    const imageSrc = item?.imageUrl
        || item?.thumbnail
        || (Array.isArray(item?.places_images) && item.places_images[0])
        || (Array.isArray(item?.menu_images) && item.menu_images[0])
        || 'https://placehold.co/400x300?text=No+Image';
    const rawRating = item?.rating_info?.score ?? item?.rating ?? 4.5;
    const ratingNumber = Number.parseFloat(rawRating);
    const rating = Number.isFinite(ratingNumber) ? ratingNumber : 4.5;

    return (
        <div className="search-place-card" onClick={onClick}>
            <div className="search-place-image-wrapper">
                <img
                    src={imageSrc}
                    alt={item?.name || 'Restaurant'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300?text=No+Image';
                    }}
                />
            </div>
            <div className="search-place-info-overlay">
                <h3 className="search-place-name">{item?.name || 'Restaurant'}</h3>
                <div className="search-place-rating">
                    {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} fill={s <= rating ? "#FFC107" : "none"} />)}
                    <span style={{ marginLeft: 4, color: 'white', fontWeight: 'bold' }}>{rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
    );
};

function AppChooseMode({ onRandom, onTaste, currentUser }) {
    const { t, lang } = useLanguage();
    const username = currentUser?.username || "HeppiHehe";
    const avatar = currentUser?.avatar || logo;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null = not searched, [] = empty results
    const [loading, setLoading] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [limit, setLimit] = useState(10);

    const handleSearch = async (overrideLimit, { append = false } = {}) => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults(null);
            return;
        }

        const searchLimit = append ? (overrideLimit ?? limit) : 10;

        if (!append) {
            setLimit(10);
        }

        setLoading(true);
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/search', {
                query: query,
                limit: searchLimit
            });
            console.log('Search response:', res.data); // Debug log
            const newResults = res.data.results || [];
            if (append) {
                setSearchResults(prev => {
                    if (!Array.isArray(prev) || prev.length === 0) return newResults;
                    const extra = newResults.slice(prev.length);
                    return [...prev, ...extra];
                });
            } else {
                setSearchResults(newResults);
            }
            return newResults;
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults(null);
        setLimit(10);
    };

    const handleOpenDetail = (item) => setDetailItem(item);
    const handleCloseDetail = () => setDetailItem(null);

    // Determine what to show
    const showResults = searchResults !== null;
    const hasResults = searchResults && searchResults.length > 0;
    const canShowMore = showResults && !loading && hasResults && searchResults.length >= limit;

    const handleShowMore = async () => {
        const next = limit + 10;
        const prevY = window.scrollY;
        setLimit(next);
        await handleSearch(next, { append: true });
        setTimeout(() => {
            window.scrollTo({ top: prevY, left: 0, behavior: 'auto' });
        }, 0);
    };

    return (
        <div className="choose-mode-container">
            {detailItem && (
                <div className="cm-detail-overlay">
                    <div className="cm-detail-panel">
                        <div className="cm-detail-scroll">
                            <RestaurantDetail
                                item={detailItem}
                                onBack={handleCloseDetail}
                                onShuffleAgain={handleCloseDetail}
                                onGetDirection={() => { }}
                                currentUser={currentUser}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Header */}
            <div className="home-header">
                <div className="header-user">
                    <img
                        src={avatar}
                        className="header-avatar"
                        alt="User"
                        referrerPolicy="no-referrer"
                    />
                    <span>{t('hi')} {username}!</span>
                </div>
                <img src={logo} style={{ width: 30 }} alt="Logo" />
            </div>

            {/* 2. Search */}
            <div className="home-search-wrapper">
                <span style={{ position: 'absolute', left: 15, top: 13 }}>🔍</span>
                <input
                    className="home-search"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                {showResults && (
                    <button
                        className="search-back-btn"
                        onClick={handleClearSearch}
                        style={{
                            position: 'absolute',
                            right: 15,
                            top: 10,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            color: '#4CAF50',
                            fontWeight: 500
                        }}
                    >
                        <Icons.Back />
                        {t('back') || 'Back'}
                    </button>
                )}
            </div>

            {/* Conditional Rendering */}
            {showResults ? (
                <>
                    {/* Search Results */}
                    <h3 style={{ marginTop: 20 }}>
                        {loading ? (lang === 'vi' ? 'Đang tìm kiếm...' : 'Searching...')
                            : hasResults
                                ? (lang === 'vi' ? `Kết quả tìm kiếm cho "${searchQuery}" (${searchResults.length} kết quả)` : `Results for "${searchQuery}" (${searchResults.length} results)`)
                                : (lang === 'vi' ? 'Không tìm thấy kết quả' : 'No results')}
                    </h3>

                    {loading ? (
                        <div className="search-loading">
                            {lang === 'vi' ? 'Đang tìm kiếm...' : 'Searching...'}
                        </div>
                    ) : hasResults ? (
                        <div className="search-results-grid">
                            {searchResults.map((item, idx) => (
                                <PlaceCard
                                    key={item.id || idx}
                                    item={item}
                                    onClick={() => handleOpenDetail(item)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="search-empty-state">
                            <p>
                                {lang === 'vi'
                                    ? 'Xin lỗi, hiện tại chúng tôi chưa có quán nào như yêu cầu'
                                    : 'Sorry, we do not have any require restaurants/cafes.'}
                            </p>
                        </div>
                    )}

                    {hasResults && canShowMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                            <button type="button" className="search-show-more-btn" onClick={handleShowMore} disabled={loading}>
                                {lang === 'vi' ? 'Xem thêm' : 'Show more'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* 3. Chips */}
                    <h3>{t('quick_picks_title')}</h3>
                    <div className="chips-container">
                        <div className="chip">Sticky Rice</div>
                        <div className="chip">Pho</div>
                        <div className="chip">Banh Mi</div>
                        <div className="chip">Coffee</div>
                    </div>

                    {/* 4. Mode Cards */}
                    <div className="mode-card-new card-green" onClick={onRandom}>
                        <img src={diceIMG} className="card-3d-icon" alt="Random" />
                        <h2>{t('quick_pick_card')}</h2>
                        <p>{t('quick_pick_desc')}</p>
                    </div>

                    <div className="mode-card-new card-yellow" onClick={onTaste}>
                        <img src={compassIMG} className="card-3d-icon" alt="Taste" />
                        <h2>{t('taste_card')}</h2>
                        <p>{t('taste_desc')}</p>
                    </div>
                </>
            )}
        </div>
    );
}

export default AppChooseMode;

// src/AppChooseMode.jsx
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { useLanguage } from './Context/LanguageContext';

// Import Assets
import logo from './assets/images/logo.png';
import diceIMG from './assets/images/Mode-Icon/dice.png'
import compassIMG from './assets/images/Mode-Icon/akinator.png'
import axios from 'axios';
import './AppChooseMode.css';
import PopupRestaurantDetail from './PopupRestaurantDetail';
import SearchResults from './Components/SearchResults';

// Icons for results
const Icons = {
    Back: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    )
};

function AppChooseMode({ onRandom, onTaste, currentUser }) {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();

    // Lấy thông tin user, nếu không có (Guest) thì mặc định là "Guest"
    const username = currentUser?.username || "Guest";
    const avatar = currentUser?.avatar || logo;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null = not searched, [] = empty results
    const [loading, setLoading] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [limit, setLimit] = useState(10);
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = localStorage.getItem('recentSearches');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const addToSearchHistory = (query) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        // Greedy algorithm: Add most recent at the beginning
        // Remove duplicates and keep only the latest occurrence
        const updated = [trimmedQuery, ...recentSearches.filter(s => s.toLowerCase() !== trimmedQuery.toLowerCase())];
        
        // Keep only the 6 most recent searches (4 default + 2 recent)
        const limited = updated.slice(0, 6);
        
        setRecentSearches(limited);
        localStorage.setItem('recentSearches', JSON.stringify(limited));
    };

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
            
            // Add to search history after successful search
            if (!append) {
                addToSearchHistory(query);
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

    const handleChipClick = (chipText) => {
        setSearchQuery(chipText);
        setLimit(10);
        
        // Trigger search automatically after setting the query
        setLoading(true);
        axios.post('http://127.0.0.1:8000/api/search', {
            query: chipText,
            limit: 10
        })
        .then(res => {
            setSearchResults(res.data.results || []);
            addToSearchHistory(chipText);
        })
        .catch(error => {
            console.error('Search failed:', error);
            setSearchResults([]);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    return (
        <div className="choose-mode-container">
            {detailItem && (
                <div className="cm-detail-overlay">
                    <div className="cm-detail-panel">
                        <PopupRestaurantDetail
                            item={detailItem}
                            onBack={handleCloseDetail}
                            onGetDirection={() => handleGetDirection(detailItem)}
                            currentUser={currentUser}
                        />
                    </div>
                </div>
            )}

            {/* 1. Header */}
            <div className="home-header">
                <div 
                    className="header-user" 
                    onClick={() => navigate('/profile')} 
                    style={{ cursor: 'pointer' }}
                    title="View Profile"
                >
                    <img
                        src={avatar}
                        className="header-avatar"
                        alt="User"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.target.src = logo; }}
                    />
                    <span>{t('hi')} {username}!</span>
                </div>
                
                {/* Logo App ở góc phải */}
                <img src={logo} style={{ width: 30 }} alt="FoodRec Logo" />
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
                <SearchResults
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    loading={loading}
                    lang={lang}
                    canShowMore={canShowMore}
                    onOpenDetail={handleOpenDetail}
                    onShowMore={handleShowMore}
                />
            ) : (
                <>
                    {/* 3. Chips */}
                    <h3>{t('quick_picks_title')}</h3>
                    <div className="chips-container">
                        {/* Show recent searches first (most recent to oldest) */}
                        {recentSearches.map((search, idx) => (
                            <div key={`recent-${idx}`} className="chip chip-recent" onClick={() => handleChipClick(search)}>
                                🕒 {search}
                            </div>
                        ))}
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
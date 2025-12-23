// src/Components/SearchResults.jsx
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import PlaceCard from './PlaceCard';

// Icons for results
const Icons = {
    Star: ({ fill = "none" }) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    )
};

// Use shared PlaceCard; pass baseClass to preserve existing CSS class names

function SearchResults({
    searchQuery,
    searchResults,
    loading,
    lang,
    canShowMore,
    onOpenDetail,
    onShowMore,
    currentUser,
    onLogout,
}) {
    const hasResults = searchResults && searchResults.length > 0;

    // --- Quick Save State ---
    const [savedIds, setSavedIds] = useState([]);

    const handleQuickSave = (item) => {
        const isGuest = currentUser?.isGuest || !currentUser;
        if (isGuest) {
            const msg = lang === 'vi'
                ? 'Bạn cần đăng nhập để lưu quán. Đến trang đăng nhập?'
                : 'You need to log in to save. Go to login?';
            const confirmLogin = window.confirm(msg);
            if (confirmLogin && typeof onLogout === 'function') onLogout();
            return;
        }

        const phone = currentUser.phone || currentUser.email || currentUser.facebook_id;
        const restaurantId = item.id || item._id;
        if (!phone || !restaurantId) return;

        const isSaved = savedIds.includes(restaurantId);
        setSavedIds(prev => isSaved ? prev.filter(id => id !== restaurantId) : [...prev, restaurantId]);

        axios.post(`http://127.0.0.1:8000/api/user/${phone}/bookmark`, { restaurant_id: restaurantId })
            .then((res) => {
                if (res.data?.status === 'added') {
                    setSavedIds(prev => prev.includes(restaurantId) ? prev : [...prev, restaurantId]);
                } else if (res.data?.status === 'removed') {
                    setSavedIds(prev => prev.filter(id => id !== restaurantId));
                }
            })
            .catch(() => {
                setSavedIds(prev => isSaved ? [...prev, restaurantId] : prev.filter(id => id !== restaurantId));
            });
    };

    return (
        <>
            {/* Search Results Header */}
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
                    {searchResults.map((item, idx) => {
                        const restaurantId = item.id || item._id;
                        const isSaved = restaurantId ? savedIds.includes(restaurantId) : false;
                        return (
                            <PlaceCard
                                key={restaurantId || idx}
                                item={item}
                                onClick={() => onOpenDetail(item)}
                                onSave={handleQuickSave}
                                isSaved={isSaved}
                            />
                        );
                    })}
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
                    <button
                        type="button"
                        className="search-show-more-btn"
                        onClick={onShowMore}
                        disabled={loading}
                    >
                        {lang === 'vi' ? 'Xem thêm' : 'Show more'}
                    </button>
                </div>
            )}
        </>
    );
}

export default SearchResults;

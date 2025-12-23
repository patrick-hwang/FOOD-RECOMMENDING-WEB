// src/Components/SearchResults.jsx
import React from 'react';

// Icons for results
const Icons = {
    Star: ({ fill = "none" }) => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
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

function SearchResults({
    searchQuery,
    searchResults,
    loading,
    lang,
    canShowMore,
    onOpenDetail,
    onShowMore
}) {
    const hasResults = searchResults && searchResults.length > 0;

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
                    {searchResults.map((item, idx) => (
                        <PlaceCard
                            key={item.id || idx}
                            item={item}
                            onClick={() => onOpenDetail(item)}
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

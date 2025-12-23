import React from 'react';
import { useTheme } from '../Context/ThemeContext';
import './PlaceCard.css';

const StarIcon = ({ fill = 'none' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke="#FFC107" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const BookmarkIcon = ({ color = '#333' }) => {
  const { isDarkMode } = useTheme();
  const finalColor = color === '#333' && isDarkMode ? '#e0e0e0' : color;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  );
};

export default function PlaceCard({ item, onClick, onSave, isSaved, baseClass = 'place' }) {
  const imageSrc = item?.thumbnail
    || (Array.isArray(item?.places_images) && item.places_images[0])
    || (Array.isArray(item?.menu_images) && item.menu_images[0])
    || 'https://placehold.co/400x300?text=No+Image';

  const ratingRaw = item?.rating_info?.score;
  const rating = (() => {
    if (ratingRaw == null) return 4.5;
    const normalized = String(ratingRaw).replace(',', '.');
    const num = parseFloat(normalized);
    if (Number.isNaN(num)) return 4.5;
    return Math.max(0, Math.min(5, num));
  })();

  const bookmarkColor = isSaved ? '#FFC107' : '#333';

  return (
    <div className={`${baseClass}-card`} onClick={onClick}>
      <div className={`${baseClass}-image-wrapper`}>
        <img
          src={imageSrc}
          alt={item?.name || 'Restaurant'}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x300?text=No+Image';
          }}
        />
        {onSave && (
          <div
            className={`${baseClass}-bookmark`}
            onClick={(e) => {
              e.stopPropagation();
              onSave && onSave(item);
            }}
          >
            <BookmarkIcon color={bookmarkColor} />
          </div>
        )}
      </div>
      <div className={`${baseClass}-info-overlay`}>
        <h3 className={`${baseClass}-name`}>{item?.name || 'Restaurant'}</h3>
        <div className={`${baseClass}-rating`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <StarIcon key={s} fill={s <= rating ? '#FFC107' : 'none'} />
          ))}
          <span style={{ marginLeft: 4, color: 'white', fontWeight: 'bold' }}>{rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

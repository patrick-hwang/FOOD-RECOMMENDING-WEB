import React, { useState, useEffect } from 'react';
import './App.css';
import './RandomModeCard.css';
import logo from './assets/images/logo.png';
import example_restaurant from './assets/images/Examples/Yori Korean Restaurant.png'
import example_restaurant_2 from './assets/images/Examples/Donguri.png'
import example_restaurant_3 from './assets/images/Examples/Artisan.png'
import example_restaurant_4 from './assets/images/Examples/The Ech.png'

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

  // notify parent when the entrance effect fully finished and rects are hidden
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

const resultsData = [
  { id: 1, name: "Yori Korean Restaurant", imageUrl: example_restaurant , description: ""},
  { id: 2, name: "Donguri Japanese Restaurant", imageUrl: example_restaurant_2 },
  { id: 3, name: "Artisan Bakery SAV3", imageUrl: example_restaurant_3 },
  { id: 4, name: "The Ech", imageUrl: example_restaurant_4 },
];

const ResultCard = ({ name, imageUrl }) => (
  <div className="result-card">
    <div className="card-image-container">
      <img src={imageUrl} alt={name} className="card-image" />
    </div>

    <h3 className="card-name">{name}</h3>

    <p className="card-text-placeholder">
      abcdefghijk<br/>
      abcdefghijk<br/>
      abcdefghijk<br/>
      abcdefghijk
    </p>
  </div>
);

function RandomModeCard({ onBack }) {
  const [visibleResults, setVisibleResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);

  const filterOptions = {
    budget: ['Cheap', 'Moderate', 'Expensive'],
    origin: ['Local', 'Asian', 'European', 'American'],
    distance: ['< 1 km', '1 - 3 km', '> 3 km'],
    speciality: ['Vegan', 'BBQ', 'Seafood', 'Dessert'],
  };

  function onFilterClick(key) {
    setActiveFilter(prev => (prev === key ? null : key));
  }

  function handleChooseFilter(filterKey, option) {
    console.log('Filter chosen', filterKey, option);
    setActiveFilter(null);
  }
  
  function handleShuffle() {
    const copy = resultsData.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    const chosen = copy.slice(0, Math.min(3, copy.length));
    setVisibleResults(chosen);
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

      <div className="results-grid">
        {visibleResults.map(result => (
          <ResultCard
            key={result.id}
            name={result.name}
            imageUrl={result.imageUrl}
          />
        ))}
      </div>

      <div className="shuffle-row">
        <button
          className="shuffle-button"
          onClick={handleShuffle}
          aria-label="Show three shuffled results"
        >
          Shuffles
        </button>
      </div>

      <div className="filters-row">
        <div className="filter-item">
          <div
            className={`filter-item ${activeFilter === 'budget' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onFilterClick('budget')}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterClick('budget')}
          >
            <span role="img" aria-label="Budget icon">💰</span> Budget
          </div>

          <div
            className={`filter-item ${activeFilter === 'origin' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onFilterClick('origin')}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterClick('origin')}
          >
            <span role="img" aria-label="Origin icon">🌐</span> Origin
          </div>

          <div
            className={`filter-item ${activeFilter === 'distance' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onFilterClick('distance')}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterClick('distance')}
          >
            <span role="img" aria-label="Distance icon">📍</span> Distance
          </div>

          <div
            className={`filter-item ${activeFilter === 'speciality' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onFilterClick('speciality')}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFilterClick('speciality')}
          >
            <span role="img" aria-label="Speciality icon">⚔️</span> Speciality
          </div>
        </div>
      </div>

        {/* Filter options panel */}
        {activeFilter && (
          <div className="filter-options" role="region" aria-label={`${activeFilter} options`}>
            {filterOptions[activeFilter].map(opt => (
              <button
                key={opt}
                className="filter-option"
                onClick={() => handleChooseFilter(activeFilter, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}

function App() {
  const [data, setData] = useState({});
  const [mode, setMode] = useState('entrance'); // 'entrance' | 'choosing' | ...

  function randomMode() {
    console.log('enter random mode');
    setMode('random');
  }

  function taste() {
    console.log('enter taste mode');
    setMode('taste');
  }

  useEffect(() => {
  fetch('https://food-recommending-web.onrender.com/api/data')
    .then(res => res.json())
    .then(data => {
      setData(data);
      console.log(data);
    })
    .catch(err => console.error('Error fetching data:', err));
  }, []);

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
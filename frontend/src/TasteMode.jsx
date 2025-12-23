import React, { useState, useEffect } from 'react';
import './TasteMode.css'; 
import logo from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
import { useLanguage } from './Context/LanguageContext';
import { useTheme } from './Context/ThemeContext';

const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
    ThumbUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function TasteMode({ onBack, currentUser, onLogout }) {
    // --- STATE ---
    const [yesTags, setYesTags] = useState([]);
    const [maybeYesTags, setMaybeYesTags] = useState([]);
    const [noTags, setNoTags] = useState([]);
    const [maybeNoTags, setMaybeNoTags] = useState([]);
    const [askedIds, setAskedIds] = useState([]);
    const [questionCount, setQuestionCount] = useState(0);
    const [history, setHistory] = useState([]);

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewState, setViewState] = useState('question'); 
    
    // Popup & Nav State
    const [detailItem, setDetailItem] = useState(null); 
    const [isNavigating, setIsNavigating] = useState(false);

    const [selectedOption, setSelectedOption] = useState(null);
    const { t, lang, switchLanguage } = useLanguage();
    const { isDarkMode, toggleTheme } = useTheme();

    // --- INITIAL LOAD ---
    useEffect(() => {
        fetchNextQuestion([], [], []);
    }, []);

    // --- API CALLS ---
    const fetchNextQuestion = async (cYes, cMaybeYes, cNo, cMaybeNo, cAsked) => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/question-mode/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    yes_tags: cYes, 
                    maybe_yes_tags: cMaybeYes,
                    no_tags: cNo, 
                    maybe_no_tags: cMaybeNo,
                    asked_ids: cAsked 
                })
            });
            
            const data = await res.json();

            if (data.next_question) {
                setCurrentQuestion(data.next_question);
                setViewState('question');
                setSelectedOption(null);
            } else {
                // If no question is returned (or list exhausted), force results view
                fetchResults(cYes, cMaybeYes, cNo, cMaybeNo);
            }

        } catch (e) { 
            console.error("Error fetching question:", e); 
        } finally { 
            setLoading(false); 
        }
    };

    const fetchResults = async (cYes, cMaybeYes, cNo, cMaybeNo) => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/question-mode/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    yes_tags: cYes, 
                    maybe_yes_tags: cMaybeYes,
                    no_tags: cNo, 
                    maybe_no_tags: cMaybeNo
                })
            });
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                // --- FIX: NORMALIZE DATA HERE ---
                const normalizedResults = data.results.map(item => {
                    const menuImages = Array.isArray(item.menu_images) ? item.menu_images : [];
                    const viewImages = Array.isArray(item.places_images) ? item.places_images : [];
                    
                    // Determine main image
                    let thumb = 'https://placehold.co/300x200/eee/ccc?text=No+Image';
                    if (item.thumbnail) thumb = item.thumbnail;
                    else if (viewImages.length > 0) thumb = viewImages[0];
                    else if (menuImages.length > 0) thumb = menuImages[0];

                    // Normalize coordinates
                    let coords = null;
                    if (item.coordinates && item.coordinates.lat && item.coordinates.long) {
                        coords = { 
                            lat: parseFloat(item.coordinates.lat), 
                            lng: parseFloat(item.coordinates.long)
                        };
                    }

                    // Flatten tags
                    const allTags = Object.values(item.tags || {}).flat().filter(t => typeof t === 'string');

                    return {
                        ...item,
                        imageUrl: thumb,       // RestaurantDetail needs this
                        imagesMenu: menuImages, // RestaurantDetail needs this
                        imagesViews: viewImages,// RestaurantDetail needs this
                        tags: allTags,
                        coords: coords,
                        rating_info: item.rating_info || { score: "?", count: 0 },
                        address: item.address || "Unknown Address",
                        openTime: (item.opening_hours && item.opening_hours.length > 0) ? item.opening_hours[0].hours : "See details"
                    };
                });

                setResults(normalizedResults);
                setViewState('results');
            } else {
                setViewState('empty');
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // --- HANDLERS (Keep existing logic) ---
    const handleOptionSelect = (type) => setSelectedOption(type);

    const handleNext = () => {
        if (!currentQuestion) return;
        const answer = selectedOption || 'idk';

        // 1. Save History (Include new states)
        const historyEntry = {
            question: currentQuestion,
            yesTags: [...yesTags],
            maybeYesTags: [...maybeYesTags],
            noTags: [...noTags],
            maybeNoTags: [...maybeNoTags],
            askedIds: [...askedIds],
            selectedOption: answer
        };
        setHistory([...history, historyEntry]);

        // 2. Prepare new Lists
        let newYes = [...yesTags];
        let newMaybeYes = [...maybeYesTags];
        let newNo = [...noTags];
        let newMaybeNo = [...maybeNoTags];
        const newAsked = [...askedIds, currentQuestion.id];

        // Helper: Get tags defined in JSON
        const tagsInQuestion = currentQuestion.yes?.yes_tag || [];

        if (answer === 'yes') {
            newYes = [...new Set([...newYes, ...tagsInQuestion])];
        } else if (answer === 'maybe_yes') {
            newMaybeYes = [...new Set([...newMaybeYes, ...tagsInQuestion])];
        } else if (answer === 'no') {
            newNo = [...new Set([...newNo, ...tagsInQuestion])];
        } else if (answer === 'maybe_no') {
            newMaybeNo = [...new Set([...newMaybeNo, ...tagsInQuestion])];
        }
        // 'idk' adds nothing

        setYesTags(newYes);
        setMaybeYesTags(newMaybeYes);
        setNoTags(newNo);
        setMaybeNoTags(newMaybeNo);
        setAskedIds(newAsked);
        
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);

        if (nextCount > 0 && nextCount % 5 === 0) {
            fetchResults(newYes, newMaybeYes, newNo, newMaybeNo);
        } else {
            fetchNextQuestion(newYes, newMaybeYes, newNo, newMaybeNo, newAsked);
        }
    };

    const handlePrevious = () => {
        if (history.length === 0) {
            onBack();
            return;
        }
        const prev = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setYesTags(prev.yesTags);
        setNoTags(prev.noTags);
        setAskedIds(prev.askedIds);
        setQuestionCount(prev.askedIds.length);
        setCurrentQuestion(prev.question);
        setSelectedOption(prev.selectedOption);
        setViewState('question');
    };

    const handleAskMore = () => {
        fetchNextQuestion(yesTags, maybeYesTags, noTags, maybeNoTags, askedIds);
    };

    const getQuestionText = () => {
        if (!currentQuestion) return "";
        // Use English if lang is 'en' and the field exists, otherwise default to Vietnamese
        if (lang === 'en' && currentQuestion.question_en) {
            return currentQuestion.question_en;
        }
        return currentQuestion.question;
    };

    // --- RENDER ---
    if (loading) return (
        <div className="tm-container" style={{justifyContent:'center', alignItems:'center'}}>
            <div className="spinner"></div>
            <p style={{marginTop:'10px', color:'#666'}}>Thinking...</p>
        </div>
    );

    // 1. Navigation Mode
    if (isNavigating && detailItem) {
        // Pass currentUser if needed
        return (
            <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:21000, background: isDarkMode?'#121212':'white'}}>
                <RestaurantDetail 
                    item={detailItem} 
                    onBack={() => setIsNavigating(false)} 
                    onGetDirection={()=>{}}
                />
            </div>
        );
    }

    // 2. Detail Popup Overlay
    const DetailPopup = () => (
        <div className="tm-popup-overlay">
            <div className="tm-popup-content">
                <div className="tm-popup-scroll" style={{height: '100%', overflowY: 'auto'}}>
                    <RestaurantDetail 
                        item={detailItem} 
                        onBack={() => setDetailItem(null)} 
                        onShuffleAgain={() => { setDetailItem(null); handleAskMore(); }}
                        onGetDirection={() => setIsNavigating(true)}
                        currentUser={currentUser} 
                        onLogout={onLogout}
                    />
                </div>
            </div>
        </div>
    );

    // 3. Results Page
    if (viewState === 'results') {
        return (
            <div className="tm-container">
                {detailItem && <DetailPopup />} 
                
                <div className="tm-bg-bubble bubble-1"></div>
                <div className="tm-bg-bubble bubble-3"></div>

                <div className="tm-header-section" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div onClick={onBack} style={{cursor:'pointer'}}><Icons.Back /></div>
                    <div style={{textAlign:'center'}}>
                        <h1 className="tm-title">{t('tm_title')}</h1>
                        <p className="tm-subtitle">{t('tm_subtitle')}</p>
                    </div>
                    {/* ADD TOGGLES HERE */}
                    <div style={{display:'flex', gap: 5}}>
                        <button className="rm-mini-btn" onClick={toggleTheme}>{isDarkMode ? '☀️' : '🌙'}</button>
                        <button className={`rm-mini-btn ${lang==='vi'?'active':''}`} onClick={() => switchLanguage('vi')}>VI</button>
                        <button className={`rm-mini-btn ${lang==='en'?'active':''}`} onClick={() => switchLanguage('en')}>EN</button>
                    </div>
                </div>

                <div className="tm-result-area">
                    <div className="tm-result-grid">
                        {results.map((item, idx) => (
                            <div key={idx} className="tm-result-card" onClick={() => setDetailItem(item)}>
                                <div className="tm-match-badge">{t('tm_match_badge')}</div>
                                <div className="tm-card-img-container">
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.name} 
                                        className="tm-card-img" 
                                        referrerPolicy="no-referrer" 
                                        onError={(e)=>{e.target.src='https://placehold.co/300x200?text=No+Image'}}
                                    />
                                    <div className="tm-seal-badge"><Icons.ThumbUp /></div>
                                </div>
                                <div className="tm-card-content">
                                    <h3 className="tm-res-name">{item.name}</h3>
                                    <div className="tm-stars">
                                        {(() => {
                                            const ratingRaw = item?.rating_info?.score;
                                            const rating = (() => {
                                                if (ratingRaw == null) return 4.5;
                                                const normalized = String(ratingRaw).replace(',', '.');
                                                const num = parseFloat(normalized);
                                                if (Number.isNaN(num)) return 4.5;
                                                return Math.max(0, Math.min(5, num));
                                            })();
                                            return (
                                                <>
                                                    {[1,2,3,4,5].map(s => <span key={s} style={{color: s <= rating ? '#FFC107' : '#eee'}}>★</span>)}
                                                    {' '}{rating.toFixed(1)}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <button className="tm-view-btn">{t('tm_view_details')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {!detailItem && (
                    <div className="tm-floating-action">
                        <button className="tm-continue-btn" onClick={handleAskMore}>
                            {t('tm_continue')}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (viewState === 'empty') {
        return (
             <div className="tm-container" style={{justifyContent:'center', alignItems:'center', padding:'20px', textAlign:'center'}}>
                <h2 style={{color:'#333'}}>No matches found.</h2>
                <button className="tm-continue-btn" onClick={onBack} style={{maxWidth:'200px'}}>Back to Home</button>
            </div>
        );
    }

    // 4. Question Page
    return (
        <div className="tm-container">
            <div className="tm-bg-bubble bubble-1"></div>
            <div className="tm-bg-bubble bubble-2"></div>

            <div className="tm-header-section">
                <div onClick={onBack} className="tm-back-icon"><Icons.Back /></div>
                <div className="tm-header-center">
                     <h1 className="tm-title">{t('tm_title')}</h1>
                     <p className="tm-subtitle">{t('tm_subtitle')}</p>
                </div>
                {/* LANGUAGE / THEME TOGGLES */}
                <div className="tm-header-actions">
                    <button className="rm-mini-btn" onClick={toggleTheme}>{isDarkMode ? '☀️' : '🌙'}</button>
                    <button className={`rm-mini-btn ${lang==='vi'?'active':''}`} onClick={() => switchLanguage('vi')}>VI</button>
                    <button className={`rm-mini-btn ${lang==='en'?'active':''}`} onClick={() => switchLanguage('en')}>EN</button>
                </div>
            </div>

            <div className="tm-question-area">
                <div className="tm-card">
                    <span className="tm-progress-text">{t('tm_question')}: {questionCount + 1}</span>
                    
                    {currentQuestion && (
                        <>
                            <h2 className="tm-question-text">{getQuestionText()}</h2>
                            
                            <div className="tm-btn-group">
                                <button className={`tm-btn-option btn-outline ${selectedOption === 'yes' ? 'selected' : ''}`} onClick={() => handleOptionSelect('yes')}>
                                    {t('tm_btn_yes')}
                                </button>
                                <button className={`tm-btn-option btn-outline ${selectedOption === 'maybe_yes' ? 'selected' : ''}`} onClick={() => handleOptionSelect('maybe_yes')}>
                                    {t('tm_btn_maybe_yes')}
                                </button>
                                <button className={`tm-btn-option btn-outline ${selectedOption === 'idk' ? 'selected' : ''}`} onClick={() => handleOptionSelect('idk')}>
                                    {t('tm_btn_idk')}
                                </button>
                                <button className={`tm-btn-option btn-outline ${selectedOption === 'maybe_no' ? 'selected' : ''}`} onClick={() => handleOptionSelect('maybe_no')}>
                                    {t('tm_btn_maybe_no')}
                                </button>
                                <button className={`tm-btn-option btn-outline ${selectedOption === 'no' ? 'selected' : ''}`} onClick={() => handleOptionSelect('no')}>
                                    {t('tm_btn_no')}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="tm-nav-row">
                    <button className="tm-nav-btn nav-prev" onClick={handlePrevious}>{t('tm_prev')}</button>
                    <button className="tm-nav-btn" onClick={handleNext}>{t('tm_next')}</button>
                </div>
            </div>
        </div>
    );
}
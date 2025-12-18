import React, { useState, useEffect } from 'react';
import './TasteMode.css'; 
import logo from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
// import MapNavigationPage from './MapNavigationPage'; // Import map navigation if needed

const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>,
    ThumbUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>,
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function TasteMode({ onBack }) {
    // --- STATE ---
    const [yesTags, setYesTags] = useState([]);
    const [noTags, setNoTags] = useState([]);
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

    // --- INITIAL LOAD ---
    useEffect(() => {
        fetchNextQuestion([], [], []);
    }, []);

    // --- API CALLS ---
    const fetchNextQuestion = async (cYes, cNo, cAsked) => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/question-mode/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ yes_tags: cYes, no_tags: cNo, asked_ids: cAsked })
            });
            const data = await res.json();
            
            if (data.next_question) {
                setCurrentQuestion(data.next_question);
                setViewState('question');
                setSelectedOption(null);
            } else {
                if (data.remaining_count > 0) fetchResults(cYes, cNo);
                else setViewState('empty');
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchResults = async (cYes, cNo) => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/question-mode/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ yes_tags: cYes, no_tags: cNo })
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

        const historyEntry = {
            question: currentQuestion,
            yesTags: [...yesTags],
            noTags: [...noTags],
            askedIds: [...askedIds],
            selectedOption: answer
        };
        setHistory([...history, historyEntry]);

        let newYes = [...yesTags];
        let newNo = [...noTags];
        const newAsked = [...askedIds, currentQuestion.id];

        if (answer === 'yes') {
            const tagsToAdd = currentQuestion.yes?.yes_tag || [];
            const noTagsToAdd = currentQuestion.yes?.no_tag || []; 
            newYes = [...new Set([...newYes, ...tagsToAdd])];
            newNo = [...new Set([...newNo, ...noTagsToAdd])];
        } else if (answer === 'no') {
            const tagsToBan = currentQuestion.no?.no_tag || [];
            const yesTagsToAdd = currentQuestion.no?.yes_tag || [];
            newNo = [...new Set([...newNo, ...tagsToBan])];
            newYes = [...new Set([...newYes, ...yesTagsToAdd])];
        }

        setYesTags(newYes);
        setNoTags(newNo);
        setAskedIds(newAsked);
        
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);

        if (nextCount > 0 && nextCount % 5 === 0) {
            fetchResults(newYes, newNo);
        } else {
            fetchNextQuestion(newYes, newNo, newAsked);
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
        fetchNextQuestion(yesTags, noTags, askedIds);
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
        return <MapNavigationPage item={detailItem} onBack={() => setIsNavigating(false)} />;
    }

    // 2. Detail Popup Overlay
    const DetailPopup = () => (
        <div className="tm-popup-overlay">
            <div className="tm-popup-content">
                <button className="tm-popup-close" onClick={() => setDetailItem(null)}><Icons.Close/></button>
                <div style={{height: '100%', overflowY: 'auto'}}>
                    <RestaurantDetail 
                        item={detailItem} 
                        onBack={() => setDetailItem(null)} 
                        onShuffleAgain={() => { setDetailItem(null); handleAskMore(); }}
                        onGetDirection={() => setIsNavigating(true)}
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

                <div className="tm-header-section" style={{display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
                    <div style={{position:'absolute', left:'20px', cursor:'pointer'}} onClick={onBack}>
                       <Icons.Back />
                    </div>
                    <div>
                        <h1 className="tm-title">LET'S GO</h1>
                        <p className="tm-subtitle">with your matchings</p>
                    </div>
                    <img src={logo} alt="logo" style={{height:'40px', position:'absolute', right:'20px'}}/>
                </div>

                <div className="tm-result-area">
                    <div className="tm-result-grid">
                        {results.map((item, idx) => (
                            <div key={idx} className="tm-result-card" onClick={() => setDetailItem(item)}>
                                <div className="tm-match-badge">Restaurant Match</div>
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
                                        {[1,2,3,4,5].map(s => <span key={s} style={{color: s <= (item.rating || 4.5) ? '#FFC107' : '#eee'}}>★</span>)} 
                                        {item.rating || 4.5}
                                    </div>
                                    <button className="tm-view-btn">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tm-floating-action">
                    <button className="tm-continue-btn" onClick={handleAskMore}>
                        Not my type yet, continue!
                    </button>
                </div>
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

            <div className="tm-header-section" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div onClick={onBack} style={{cursor:'pointer'}}><Icons.Back /></div>
                <div style={{textAlign:'center'}}>
                     <h1 className="tm-title">Test Your Taste</h1>
                     <p className="tm-subtitle">Tell us your preferences</p>
                </div>
                <img src={logo} alt="logo" style={{height:'40px'}}/>
            </div>

            <div className="tm-question-area">
                <div className="tm-card">
                    <span className="tm-progress-text">Question: {questionCount + 1}/5</span>
                    
                    {currentQuestion && (
                        <>
                            <h2 className="tm-question-text">{currentQuestion.question}</h2>
                            
                            <div className="tm-btn-group">
                                <button 
                                    className={`tm-btn-option btn-outline ${selectedOption === 'yes' ? 'selected' : ''}`} 
                                    onClick={() => handleOptionSelect('yes')}
                                >
                                    Yes
                                </button>
                                <button 
                                    className={`tm-btn-option btn-outline ${selectedOption === 'no' ? 'selected' : ''}`} 
                                    onClick={() => handleOptionSelect('no')}
                                >
                                    No
                                </button>
                                <button 
                                    className={`tm-btn-option btn-outline ${selectedOption === 'idk' ? 'selected' : ''}`} 
                                    onClick={() => handleOptionSelect('idk')}
                                >
                                    Don't know
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="tm-nav-row">
                    <button className="tm-nav-btn nav-prev" onClick={handlePrevious}>Previous</button>
                    <button className="tm-nav-btn" onClick={handleNext}>Next</button>
                </div>
            </div>
        </div>
    );
}
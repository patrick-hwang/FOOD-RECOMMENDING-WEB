import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';
import axios from 'axios';
import defaultAvatar from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
import PopupRestaurantDetail from './PopupRestaurantDetail';
import { useLanguage } from './Context/LanguageContext';
import { useTheme } from './Context/ThemeContext'; 
import { useNotification } from './Context/NotificationContext';

// --- ICONS SVG ---
const Icons = {
    Gear: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    ),
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Star: ({fill="#FFC107"}) => <svg width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
    Cam: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
    BookmarkFilled: ({filled}) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#666"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>,
    ImgLib: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    PhotoCam: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    Trash: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    Lock: () => <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
};

export default function ProfilePage({ currentUser, onLogout, onBack, onUserUpdate }) {
    const { t, lang, switchLanguage } = useLanguage();
    const { isDarkMode, toggleTheme } = useTheme(); 
    const { isNotifOn, toggleNotification } = useNotification(); 

    const [view, setView] = useState('main'); 
    const [subTab, setSubTab] = useState('history'); 
    const [profileData, setProfileData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
    const [showLangMenu, setShowLangMenu] = useState(false);
    const longPressTimer = useRef(null);

    const API_URL = "http://127.0.0.1:8000/api/user";
    const userId = currentUser?.isGuest ? null : (currentUser?.phone || currentUser?.email || currentUser?.facebook_id);

    const fetchProfile = async () => {
        if (!userId) { setLoading(false); return; }
        try {
            const res = await axios.get(`${API_URL}/${userId}`);
            setProfileData(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchProfile(); }, [userId]);

    const normalizeData = (dbItem) => {
        const menuImages = Array.isArray(dbItem.menu_images) ? dbItem.menu_images : [];
        const viewImages = Array.isArray(dbItem.places_images) ? dbItem.places_images : [];
        let thumb = 'https://placehold.co/300x200?text=No+Image';
        if (dbItem.thumbnail) thumb = dbItem.thumbnail;
        else if (viewImages.length > 0) thumb = viewImages[0];
        else if (menuImages.length > 0) thumb = menuImages[0];

        let cleanTags = [];
        if (Array.isArray(dbItem.tags)) cleanTags = dbItem.tags;
        else if (typeof dbItem.tags === 'object' && dbItem.tags !== null) {
            cleanTags = Object.values(dbItem.tags).flat().filter(t => typeof t === 'string');
        }

        return {
            ...dbItem,
            id: dbItem.id || dbItem._id,
            imageUrl: thumb,
            tags: cleanTags,
            rating: dbItem.rating || 4.5
        };
    };

    const handleToggleSave = async (item) => {
        if (currentUser?.isGuest) {
            if (window.confirm(t('guest_action_alert'))) onLogout();
            return;
        }
        try {
            const rId = item.id || item._id;
            await axios.post(`${API_URL}/${userId}/bookmark`, { restaurant_id: rId });
            fetchProfile(); 
        } catch (e) { console.error(e); }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/${userId}/history?restaurant_id=${deleteModal.item.id}`);
            setDeleteModal({ show: false, item: null });
            fetchProfile();
        } catch (e) { console.error(e); }
    };

    if (selectedItem) {
        return (
            <PopupRestaurantDetail 
                item={selectedItem} 
                onBack={() => {setSelectedItem(null); fetchProfile();}} 
                currentUser={currentUser} 
                onLogout={onLogout} 
            />
        );
    }

    if (view === 'edit_profile') {
        return (
            <EditProfile 
                currentUser={currentUser} 
                profileData={profileData} 
                onBack={() => {fetchProfile(); setView('settings');}} 
                onUserUpdate={onUserUpdate} // <--- PASS PROP DOWN
            />
        );
    }

    if (view === 'story') {
        return (
            <div className="prof-container prof-fullscreen-overlay">
                <div className="custom-sub-header">
                    <div onClick={() => setView('settings')}><Icons.Back /></div>
                    <h2 className="sub-header-title">{t('our_story')}</h2>
                    <div style={{width:24}}></div>
                </div>
                <div className="sub-content-padded">
                    <img src={defaultAvatar} alt="FoodRec" className="story-logo" />
                    <p className="story-text">{t('story_content')}</p>
                </div>
            </div>
        );
    }

    if (view === 'help') {
        return (
            <div className="prof-container prof-fullscreen-overlay">
                <div className="custom-sub-header">
                    <div onClick={() => setView('settings')}><Icons.Back /></div>
                    <h2 className="sub-header-title">{t('help_title')}</h2>
                    <div style={{width:24}}></div>
                </div>
                <div className="sub-content-padded">
                    <div className="help-card"><h3>FoodRec Guide</h3><p>{t('help_desc')}</p></div>
                    <p className="help-contact">{t('contact_us')}</p>
                </div>
            </div>
        );
    }

    if (view === 'settings') {
        return (
            <div className="prof-container prof-fullscreen-overlay">
                <div className="custom-sub-header">
                    <div onClick={() => setView('main')}><Icons.Back /></div>
                    <h2 className="sub-header-title">{t('settings')}</h2>
                    <div style={{width:24}}></div>
                </div>
                <div className="prof-settings-container">
                    {!currentUser?.isGuest && (
                        <div className="setting-row" onClick={() => setView('edit_profile')}>
                            <span className="setting-icon">📝</span> {t('edit_profile')} <span className="setting-arrow">&gt;</span>
                        </div>
                    )}
                    <div className="setting-row" onClick={() => setShowLangMenu(true)}>
                        <span className="setting-icon">🌐</span> {t('language')} <span className="setting-arrow">{lang === 'vi' ? 'Tiếng Việt' : 'English'} &gt;</span>
                    </div>
                    <div className="setting-row" onClick={toggleNotification}>
                        <span className="setting-icon">🔔</span> {t('notification')} <span className="setting-arrow">{isNotifOn ? t('on') : t('off')} &gt;</span>
                    </div>
                    <div className="setting-row" onClick={toggleTheme}>
                        <span className="setting-icon">🌙</span> {t('night_mode')} <span className="setting-arrow">{isDarkMode ? t('on') : t('off')} &gt;</span>
                    </div>
                    <div className="setting-row" onClick={() => setView('story')}>
                        <span className="setting-icon">📖</span> {t('our_story')} <span className="setting-arrow">&gt;</span>
                    </div>
                    <div className="setting-row" onClick={() => setView('help')}>
                        <span className="setting-icon">❓</span> {t('help')} <span className="setting-arrow">&gt;</span>
                    </div>
                    <button className="logout-btn" onClick={onLogout}>{currentUser?.isGuest ? t('sign_in') : t('logout')}</button>
                </div>

                {showLangMenu && (
                    <div className="avatar-menu-overlay" onClick={() => setShowLangMenu(false)}>
                        <div className="avatar-menu-card">
                            <div className="avatar-menu-item" onClick={() => {switchLanguage('en'); setShowLangMenu(false);}}>English</div>
                            <div className="avatar-menu-item" onClick={() => {switchLanguage('vi'); setShowLangMenu(false);}}>Tiếng Việt</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const listItems = subTab === 'history' ? profileData?.history_items : profileData?.bookmark_items;

    return (
        <div className="prof-container">
            <div className="prof-header-bg">
                <div className="prof-back-main" onClick={onBack}><Icons.Back /></div>
                <div className="prof-header-actions" onClick={() => setView('settings')}><Icons.Gear /></div>
            </div>
            
            <div className="prof-avatar-wrapper">
                <img src={profileData?.avatar || currentUser?.avatar || defaultAvatar} className="prof-avatar-img" alt="avt" />
            </div>

            <div className="prof-info-section">
                <div className="prof-name">{currentUser?.isGuest ? t('guest') : (profileData?.username || currentUser?.username)}</div>
            </div>

            <div className="prof-tabs">
                <button className={`prof-tab-btn ${subTab==='history'?'active':''}`} onClick={()=>setSubTab('history')}>{t('history')}</button>
                <button className={`prof-tab-btn ${subTab==='saved'?'active':''}`} onClick={()=>setSubTab('saved')}>{t('saved')}</button>
            </div>

            <div className="prof-content-area">
                {currentUser?.isGuest ? (
                    <div className="prof-empty-guest">
                        <Icons.Lock />
                        <h3>{t('login_req_title')}</h3>
                        <p>{t('login_req_desc')}</p>
                        <button className="edit-btn-submit guest-btn" onClick={onLogout}>{t('login_now')}</button>
                    </div>
                ) : (
                    loading ? <div className="prof-empty">Loading...</div> : (
                        listItems && listItems.length > 0 ? listItems.map((item, idx) => {
                            const isSaved = profileData?.bookmark_items?.some(b => b.id === (item.id || item._id));
                            const cleanItem = normalizeData(item);
                            return (
                                <div key={idx} className="prof-card-grid" onClick={() => setSelectedItem(cleanItem)} 
                                     onContextMenu={(e) => { e.preventDefault(); setDeleteModal({show:true, item:cleanItem}); }}>
                                    <div className="prof-card-img-container">
                                        <img 
                                            src={cleanItem.imageUrl} 
                                            alt={cleanItem.name}
                                            referrerPolicy="no-referrer" // <--- CRITICAL FIX
                                            onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=No+Image'; }} // <--- Fallback fix
                                        />
                                        <div className="prof-card-bookmark-btn" onClick={(e) => { e.stopPropagation(); handleToggleSave(item); }}>
                                            <Icons.BookmarkFilled filled={isSaved} />
                                        </div>
                                    </div>
                                    <div className="prof-card-info">
                                        <h4 className="prof-card-name">{cleanItem.name}</h4>
                                        <div className="prof-card-rating">
                                            {[1,2,3,4,5].map(s => <Icons.Star key={s} fill={s <= cleanItem.rating ? "#FFC107" : "#eee"} />)}
                                            <span style={{color:'#FFC107', marginLeft:4, fontSize:12}}>{cleanItem.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div className="prof-empty">{subTab==='history' ? t('empty_history') : t('empty_saved')}</div>
                    )
                )}
            </div>

            {deleteModal.show && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h3>{t('delete_confirm')}</h3>
                        <p>{deleteModal.item?.name}</p>
                        <div className="delete-modal-actions">
                            <button className="delete-btn-yes" onClick={confirmDelete}>{t('yes')}</button>
                            <button className="delete-btn-no" onClick={() => setDeleteModal({ show: false, item: null })}>{t('no')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==============================================================================
// 5. EDIT PROFILE COMPONENT (KHÔI PHỤC NGUYÊN BẢN)
// ==============================================================================
function EditProfile({ currentUser, profileData, onBack, onUserUpdate }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: profileData?.username || currentUser?.username || currentUser?.name || "",
        email: profileData?.email || currentUser?.email || "",
        phone: profileData?.phone || currentUser?.phone || "",
        age: profileData?.age || "",
        gender: profileData?.gender || "",
        avatar: profileData?.avatar || currentUser?.avatar || defaultAvatar
    });
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const cameraInputRef = useRef(null);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
                setShowAvatarMenu(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            const userId = currentUser.phone || currentUser.email || currentUser.facebook_id;
            await axios.put(`http://127.0.0.1:8000/api/user/${userId}/update`, formData);
            if (onUserUpdate) {
                onUserUpdate(formData);
            }
            alert(t('updated'));
            onBack();
        } catch (e) { 
            console.error(e); // It's good to log the error to see what happens
            alert("Error updating"); 
        }
    };

    const startCamera = async () => {
        setShowAvatarMenu(false); // Close the menu
        setIsCameraOpen(true);    // Open the camera overlay
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera Error:", err);
            setIsCameraOpen(false);
            alert("Cannot access camera.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            // Optional: Mirror the image
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            
            ctx.drawImage(video, 0, 0);
            setFormData(prev => ({ ...prev, avatar: canvas.toDataURL('image/png') }));
            stopCamera();
        }
    };

    return (
        <div className="prof-container prof-fullscreen-overlay">
            <div className="custom-sub-header">
                <div onClick={onBack} style={{cursor:'pointer'}}><Icons.Back /></div>
                <h2 className="sub-header-title">{t('edit_profile')}</h2>
                <div style={{width:24}}></div>
            </div>

            <div style={{position:'relative', width:120, height:120, margin:'30px auto'}}>
                <div className="prof-avatar-wrapper" style={{margin:0, position:'static', width:120, height:120}}>
                    <img src={formData.avatar} className="prof-avatar-img" alt="avt" />
                </div>
                <div className="prof-edit-cam" onClick={() => setShowAvatarMenu(true)}>
                    <Icons.Cam />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display:'none'}} accept="image/*" />
                <input type="file" ref={cameraInputRef} onChange={handleFileChange} style={{display:'none'}} accept="image/*" capture="user" />
            </div>

            <div className="edit-form">
                <div className="edit-group">
                    <div className="edit-input-container">
                        <label className="edit-label">{t('name')}</label>
                        <input className="edit-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                </div>
                <div className="edit-group">
                    <div className="edit-input-container">
                        <label className="edit-label">{t('email')}</label>
                        <input className="edit-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                </div>
                <div className="edit-group">
                    <div className="edit-input-container" style={{flexDirection:'row', alignItems:'center'}}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/320px-Flag_of_Vietnam.svg.png" className="vn-flag" alt="VN" style={{width:24, height:16, marginRight:10}}/>
                        <div style={{flex:1}}>
                            <label className="edit-label">{t('phone')}</label>
                            <input className="edit-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div style={{display:'flex', gap:'15px'}}>
                    <div className="edit-group" style={{flex:1}}>
                        <div className="edit-input-container">
                            <label className="edit-label">{t('gender')}</label>
                            <input className="edit-input" placeholder={t('gender_placeholder')} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} />
                        </div>
                    </div>
                    <div className="edit-group" style={{flex:1}}>
                        <div className="edit-input-container">
                            <label className="edit-label">{t('age')}</label>
                            <input className="edit-input" type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                        </div>
                    </div>
                </div>
                <button onClick={handleSave} className="edit-btn-submit">{t('save_changes')}</button>
            </div>

            {showAvatarMenu && (
                <div className="avatar-menu-overlay" onClick={() => setShowAvatarMenu(false)}>
                    <div className="avatar-menu-card">
                        <div className="avatar-menu-item" onClick={() => fileInputRef.current.click()}>
                            <div className="avatar-menu-icon" style={{marginRight:10}}><Icons.ImgLib /></div>
                            <div className="avatar-menu-text">{t('import_lib')}</div>
                        </div>
                        <div className="avatar-menu-item" onClick={startCamera}>
                            <div className="avatar-menu-icon" style={{marginRight:10}}><Icons.PhotoCam /></div>
                            <div className="avatar-menu-text">{t('take_photo')}</div>
                        </div>
                        <div className="avatar-menu-item" onClick={() => setFormData({...formData, avatar: defaultAvatar})}>
                            <div className="avatar-menu-icon" style={{marginRight:10}}><Icons.Trash /></div>
                            <div className="avatar-menu-text delete" style={{color:'#FF5252'}}>{t('delete_photo')}</div>
                        </div>
                    </div>
                </div>
            )}
            {isCameraOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'black', zIndex: 9999, display: 'flex', 
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <video 
                        ref={videoRef} autoPlay playsInline 
                        style={{ width: '100%', maxHeight: '80%', objectFit: 'contain', transform: 'scaleX(-1)' }} 
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    
                    <div style={{
                        position: 'absolute', bottom: 30, width: '100%', 
                        display: 'flex', justifyContent: 'space-around', alignItems: 'center'
                    }}>
                        <button onClick={stopCamera} style={{ color: 'white', background: 'transparent', border: 'none', fontSize: 16 }}>
                            Cancel
                        </button>
                        <div onClick={capturePhoto} style={{
                            width: 70, height: 70, borderRadius: '50%', backgroundColor: 'white',
                            border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer'
                        }}/>
                        <div style={{ width: 50 }}></div>
                    </div>
                </div>
            )}
            {/* --------------------------------------- */}
        </div>
    );
}
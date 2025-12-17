import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';
import axios from 'axios';
import defaultAvatar from './assets/images/logo.png';
import RestaurantDetail from './RestaurantDetail';
import { useLanguage } from './Context/LanguageContext'; // IMPORT CONTEXT

// Icons SVG
const Icons = {
    Gear: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0-1.51-1z"></path></svg>,
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Star: ({fill="#FFC107"}) => <svg width="12" height="12" viewBox="0 0 24 24" fill={fill} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
    Cam: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
    BookmarkFilled: ({filled}) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#FFC107" : "none"} stroke={filled ? "#FFC107" : "#666"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>,
    TabHistory: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    TabBookmark: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>,
    ImgLib: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    PhotoCam: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    Trash: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5252" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    Lang: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
};

export default function ProfilePage({ currentUser, onLogout }) {
    const { t, lang, switchLanguage } = useLanguage(); // SỬ DỤNG HOOK NGÔN NGỮ
    const [view, setView] = useState('main'); 
    const [subTab, setSubTab] = useState('history'); 
    const [profileData, setProfileData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
    const [showLangMenu, setShowLangMenu] = useState(false); // Menu chọn ngôn ngữ
    const longPressTimer = useRef(null);

    const API_URL = "http://127.0.0.1:8000/api/user";
    const userId = currentUser?.phone || currentUser?.email || currentUser?.facebook_id;

    const fetchProfile = async () => {
        if (!userId) return setLoading(false);
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
        else if (menuImages.length > 0) thumb = menuImages[0];

        let cleanTags = [];
        if (Array.isArray(dbItem.tags)) cleanTags = dbItem.tags;
        else if (typeof dbItem.tags === 'object' && dbItem.tags !== null) {
            cleanTags = Object.values(dbItem.tags).flat().filter(t => typeof t === 'string');
        }

        return {
            ...dbItem,
            id: dbItem.id || dbItem._id,
            name: dbItem.name || "Unknown",
            address: dbItem.address || "",
            rating: dbItem.rating || 4.5,
            openTime: dbItem.opening_hours?.[0]?.hours || "",
            imageUrl: thumb,
            imagesMenu: menuImages,
            imagesViews: viewImages,
            tags: cleanTags
        };
    };

    const handleItemClick = (item) => {
        const cleanItem = normalizeData(item);
        setSelectedItem(cleanItem);
    };

    const confirmDelete = async () => {
        if (!deleteModal.item) return;
        try {
            await axios.delete(`${API_URL}/${userId}/history?restaurant_id=${deleteModal.item.id}`);
            setDeleteModal({ show: false, item: null });
            fetchProfile();
        } catch (e) { console.error("Delete failed:", e); }
    };

    const handleRightClick = (e, item) => {
        if (subTab !== 'history') return;
        e.preventDefault(); e.stopPropagation();
        setDeleteModal({ show: true, item: item });
    };

    const handleTouchStart = (item) => {
        if (subTab !== 'history') return;
        longPressTimer.current = setTimeout(() => setDeleteModal({ show: true, item: item }), 800); 
    };

    const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

    const handleToggleSave = async (item) => {
        try {
            await axios.post(`${API_URL}/${userId}/bookmark`, { restaurant_id: item.id });
            fetchProfile(); 
        } catch (e) { console.error(e); }
    };

    // Chuyển ngôn ngữ
    const handleLanguageChange = (newLang) => {
        switchLanguage(newLang);
        setShowLangMenu(false);
    };

    if (selectedItem) {
        return (
            <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:20000, background:'white'}}>
                <RestaurantDetail 
                    item={selectedItem} 
                    onBack={() => { setSelectedItem(null); fetchProfile(); }} 
                    onShuffleAgain={() => {}} 
                    onGetDirection={() => {}} 
                    currentUser={currentUser}
                />
            </div>
        );
    }

    if (view === 'main') {
        const listItems = subTab === 'history' ? profileData?.history_items : profileData?.bookmark_items;
        
        return (
            <div className="prof-container">
                <div className="prof-header-bg">
                    <div className="prof-header-actions" onClick={() => setView('settings')}>
                        <Icons.Gear />
                    </div>
                </div>
                <div style={{position:'relative'}}>
                    <div className="prof-avatar-wrapper">
                        <img src={profileData?.avatar || currentUser?.avatar || defaultAvatar} className="prof-avatar-img" alt="avatar" />
                    </div>
                </div>
                <div className="prof-info-section">
                    <div className="prof-name">{profileData?.username || currentUser?.name || t('guest')}</div>
                    <div className="prof-badges">
                        <div className="prof-badge-pill"><span style={{color:'gold'}}>★</span> Badges</div>
                        <div className="prof-badge-pill"><span style={{color:'red'}}>★</span> Bagdes</div>
                    </div>
                </div>
                <div className="prof-tabs">
                    <button className={`prof-tab-btn ${subTab==='history'?'active':''}`} onClick={()=>setSubTab('history')}><Icons.TabHistory /></button>
                    <button className={`prof-tab-btn ${subTab==='saved'?'active':''}`} onClick={()=>setSubTab('saved')}><Icons.TabBookmark /></button>
                </div>
                <div className="prof-content-area">
                    {loading ? <div className="prof-empty">Loading...</div> : (
                        listItems && listItems.length > 0 ? listItems.map((item, idx) => {
                            const isSaved = profileData?.bookmark_items?.some(b => b.id === item.id);
                            return (
                                <div key={idx} className="prof-card-grid" onClick={() => handleItemClick(item)} onContextMenu={(e) => handleRightClick(e, item)} onTouchStart={() => handleTouchStart(item)} onTouchEnd={handleTouchEnd}>
                                    <div className="prof-card-img-container">
                                        <img src={item.thumbnail || item.menu_images?.[0] || defaultAvatar} alt=""/>
                                        <div className="prof-card-bookmark-btn" onClick={(e) => { e.stopPropagation(); handleToggleSave(item); }}>
                                            <Icons.BookmarkFilled filled={isSaved} />
                                        </div>
                                    </div>
                                    <div className="prof-card-info">
                                        <h4 className="prof-card-name">{item.name}</h4>
                                        <div className="prof-card-rating">
                                            {[1,2,3,4,5].map(s => <Icons.Star key={s} fill={s <= (item.rating || 4.5) ? "#FFC107" : "#eee"} />)}
                                            <span style={{color:'#FFC107', marginLeft:4, fontSize:12}}>{item.rating||4.5}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div className="prof-empty">{subTab==='history' ? t('empty_history') : t('empty_saved')}</div>
                    )}
                </div>
                {deleteModal.show && (
                    <div className="delete-modal-overlay" onClick={(e)=>e.stopPropagation()}>
                        <div className="delete-modal">
                            <h3>{t('delete_confirm')}</h3>
                            <p style={{fontWeight:'bold', margin:'10px 0'}}>{deleteModal.item?.name}</p>
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

    // SETTINGS VIEW
    if (view === 'settings') {
        return (
            <div className="prof-container prof-fullscreen-overlay">
                <div style={{padding:'20px', display:'flex', alignItems:'center'}}>
                    <div onClick={()=>setView('main')} style={{cursor:'pointer'}}><Icons.Back /></div>
                    <h2 style={{flex:1, textAlign:'center', margin:0}}>{t('settings')}</h2>
                    <div style={{width:24}}></div>
                </div>
                <div className="prof-settings-container">
                    <div className="setting-row" onClick={() => setView('edit_profile')}>
                        <span className="setting-icon">📝</span> {t('edit_profile')} <span className="setting-arrow">&gt;</span>
                    </div>
                    
                    {/* LANGUAGE SETTING */}
                    <div className="setting-row" onClick={() => setShowLangMenu(true)}>
                        <span className="setting-icon">🌐</span> {t('language')} <span className="setting-arrow">{lang === 'vi' ? 'Tiếng Việt' : 'English'} &gt;</span>
                    </div>

                    <div className="setting-row"><span className="setting-icon">🔔</span> {t('notification')} <span className="setting-arrow">{t('on')} &gt;</span></div>
                    <div className="setting-row"><span className="setting-icon">🌙</span> {t('night_mode')} <span className="setting-arrow">{t('off')} &gt;</span></div>
                    <div className="setting-row"><span className="setting-icon">❓</span> {t('help')}</div>
                    <button className="logout-btn" onClick={onLogout}>{t('logout')}</button>
                </div>

                {/* LANGUAGE MENU BOTTOM SHEET */}
                {showLangMenu && (
                    <div className="avatar-menu-overlay" onClick={() => setShowLangMenu(false)}>
                        <div className="avatar-menu-card" onClick={e => e.stopPropagation()}>
                            <div style={{textAlign:'center', fontWeight:'bold', marginBottom:10, fontSize:18}}>{t('language')}</div>
                            
                            <div className="avatar-menu-item" onClick={() => handleLanguageChange('en')}>
                                <div className="avatar-menu-text" style={{fontWeight: lang==='en'?'bold':'normal', color: lang==='en'?'#4CAF50':'#333'}}>English</div>
                                {lang === 'en' && <span style={{marginLeft:'auto', color:'#4CAF50'}}>✔</span>}
                            </div>

                            <div className="avatar-menu-item" onClick={() => handleLanguageChange('vi')}>
                                <div className="avatar-menu-text" style={{fontWeight: lang==='vi'?'bold':'normal', color: lang==='vi'?'#4CAF50':'#333'}}>Tiếng Việt</div>
                                {lang === 'vi' && <span style={{marginLeft:'auto', color:'#4CAF50'}}>✔</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    if (view === 'edit_profile') {
        return <EditProfile currentUser={currentUser} profileData={profileData} onBack={() => {fetchProfile(); setView('settings');}} />;
    }

    return null;
}

function EditProfile({ currentUser, profileData, onBack }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: profileData?.username || currentUser?.name || "",
        email: profileData?.email || currentUser?.email || "",
        phone: profileData?.phone || currentUser?.phone || "",
        age: profileData?.age || "",
        gender: profileData?.gender || "",
        avatar: profileData?.avatar || currentUser?.avatar || defaultAvatar
    });
    const userId = currentUser?.phone || currentUser?.email || currentUser?.facebook_id;
    const fileInputRef = useRef(null);
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

    const handleDeleteAvatar = () => {
        setFormData(prev => ({ ...prev, avatar: defaultAvatar }));
        setShowAvatarMenu(false);
    };

    const handleSave = async () => {
        try {
            await axios.put(`http://127.0.0.1:8000/api/user/${userId}/update`, formData);
            alert(t('updated'));
            onBack();
        } catch (e) { alert("Error updating"); }
    };

    return (
        <div className="prof-container prof-fullscreen-overlay">
            <div style={{padding:'20px', display:'flex', alignItems:'center'}}>
                <div onClick={onBack} style={{cursor:'pointer'}}><Icons.Back /></div>
                <h2 style={{flex:1, textAlign:'center', margin:0}}>{t('edit_profile')}</h2>
                <div style={{width:24}}></div>
            </div>

            <div style={{position:'relative', width:120, height:120, margin:'0 auto 30px auto'}}>
                <div className="prof-avatar-wrapper" style={{bottom:0, background:'#c8e6c9', border:'none', width:120, height:120}}>
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
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/320px-Flag_of_Vietnam.svg.png" className="vn-flag" alt="VN"/>
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
                            <input className="edit-input" placeholder="Female" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} />
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
                    <div className="avatar-menu-card" onClick={e => e.stopPropagation()}>
                        <div className="avatar-menu-preview">
                            <img src={formData.avatar} alt="preview" />
                        </div>
                        <div className="avatar-menu-item" onClick={() => fileInputRef.current.click()}>
                            <div className="avatar-menu-icon"><Icons.ImgLib /></div>
                            <div className="avatar-menu-text">{t('import_lib')}</div>
                        </div>
                        <div className="avatar-menu-item" onClick={() => cameraInputRef.current.click()}>
                            <div className="avatar-menu-icon"><Icons.PhotoCam /></div>
                            <div className="avatar-menu-text">{t('take_photo')}</div>
                        </div>
                        <div className="avatar-menu-item" onClick={handleDeleteAvatar}>
                            <div className="avatar-menu-icon"><Icons.Trash /></div>
                            <div className="avatar-menu-text delete">{t('delete_photo')}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
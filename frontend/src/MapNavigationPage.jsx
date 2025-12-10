import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapNavigationPage.css';
import logo from './assets/images/logo.png'; // Đường dẫn logo

// ICONS
const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
    Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
    Pin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00AA00" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    NavMap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
};

export default function MapNavigationPage({ item, onBack }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            // Tọa độ giả lập (HCM) nếu item không có coords
            const lat = item.coords?.lat || 10.762622;
            const lng = item.coords?.lng || 106.660172;

            // Khởi tạo Map
            const map = L.map(mapRef.current, {
                center: [lat, lng],
                zoom: 15,
                zoomControl: false // Tắt nút zoom mặc định cho gọn
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: ''
            }).addTo(map);

            // Custom Marker Icon (Dùng màu đỏ như trong hình)
            const redIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: #D32F2F; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20]
            });

            // Marker điểm đến
            L.marker([lat, lng], { icon: redIcon }).addTo(map)
                .bindPopup(item.name)
                .openPopup();

            // Vẽ đường đi giả (Polyline) từ điểm A đến B để giống hình
            const userLat = lat - 0.005; // Giả lập người dùng ở gần đó
            const userLng = lng - 0.005;
            
            // Marker người dùng (Xanh dương)
            const blueIcon = L.divIcon({
                className: 'user-marker',
                html: `<div style="background-color: #2196F3; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20]
            });
            L.marker([userLat, userLng], { icon: blueIcon }).addTo(map);

            // Vẽ đường nối
            L.polyline([[userLat, userLng], [lat, lng]], {color: '#4CAF50', weight: 4, opacity: 0.8, dashArray: '10, 10'}).addTo(map);

            mapInstance.current = map;
        }

        // Cleanup map khi unmount
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [item]);

    const handleOpenGoogleMap = () => {
        const query = encodeURIComponent(`${item.name} ${item.address || ''}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    return (
        <div className="nav-container">
            {/* Header */}
            <div className="nav-header">
                <button className="nav-back-btn" onClick={onBack}>
                    <Icons.Back /> Back
                </button>
                <div className="nav-logo-group">
                    <img src={logo} alt="FoodRec" className="nav-logo-img" />
                    <span className="nav-logo-text">FoodRec</span>
                </div>
                <div style={{width: '60px'}}></div> {/* Spacer để cân đối header */}
            </div>

            {/* Map Area */}
            <div className="nav-map-area" ref={mapRef}>
                <button className="nav-google-btn" onClick={handleOpenGoogleMap}>
                    Open in Google Maps
                </button>
            </div>

            {/* Bottom Card */}
            <div className="nav-info-card">
                <h2 className="nav-card-title">{item.name}</h2>
                <div className="nav-rating">
                    {[1,2,3,4].map(i => <Icons.Star key={i} />)}
                    <span className="nav-rating-num">{item.rating || 4.5}</span>
                </div>
                
                <div className="nav-address-row">
                    <Icons.Pin />
                    <span>Address: {item.address || "197A Nguyen Trai, District 1, HCMC"}</span>
                </div>
                
                <div className="nav-time-row">
                    <Icons.Clock />
                    <span><strong>6 mins walking</strong></span>
                </div>
                <div className="nav-secondary-text">0.5 km</div>

                <button className="nav-start-btn" onClick={handleOpenGoogleMap}>
                    Start Navigation <Icons.NavMap />
                </button>
            </div>
        </div>
    );
}
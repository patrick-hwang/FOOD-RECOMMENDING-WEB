import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLanguage } from './LanguageContext'; // Import hook ngôn ngữ

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { t } = useLanguage(); // Lấy hàm dịch
    
    // 1. Trạng thái Bật/Tắt
    const [isNotifOn, setIsNotifOn] = useState(() => {
        return localStorage.getItem('isNotifOn') === 'true';
    });

    // 2. Nội dung thông báo đang hiện
    const [notification, setNotification] = useState(null);

    // Hàm hiển thị Toast
    const showToast = (title, body, icon) => {
        setNotification({ title, body, icon });
        
        // Tự tắt sau 5 giây (nếu người dùng không bấm)
        // Lưu timeout ID để có thể clear nếu cần
        setTimeout(() => {
            setNotification(current => {
                // Chỉ tắt nếu thông báo hiện tại trùng với cái đang muốn tắt
                // (Tránh trường hợp thông báo mới đè lên bị tắt oan)
                if (current && current.title === title) return null;
                return current;
            });
        }, 5000);
    };

    // Hàm đóng thông báo thủ công (khi click vào)
    const closeNotification = () => {
        setNotification(null);
    };

    const toggleNotification = () => {
        const newState = !isNotifOn;
        setIsNotifOn(newState);
        localStorage.setItem('isNotifOn', String(newState));
        
        if (newState) {
            showToast(t('notif_on_title'), t('notif_on_body'), "✅");
        }
    };

    // Timer chạy ngầm: 5 phút hiện 1 lần
    useEffect(() => {
        let interval;
        if (isNotifOn) {
            // 5 phút = 5 * 60 * 1000 = 300000 ms
            interval = setInterval(() => {
                // Random số từ 1 đến 4 để chọn mẫu thông báo
                const index = Math.floor(Math.random() * 4) + 1; 
                
                // Lấy nội dung theo ngôn ngữ hiện tại
                const title = t(`notif_title_${index}`);
                const body = t(`notif_body_${index}`);
                
                // Icon tương ứng
                const icons = ["😋", "🔖", "🔥", "🎲"];
                const icon = icons[index - 1];

                showToast(title, body, icon);
            }, 15000); 
        }
        return () => clearInterval(interval);
    }, [isNotifOn, t]); // Thêm t vào dependency để cập nhật khi đổi ngôn ngữ

    return (
        <NotificationContext.Provider value={{ isNotifOn, toggleNotification, notification, closeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
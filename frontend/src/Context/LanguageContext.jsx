import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // 1. KHỞI TẠO STATE: Kiểm tra localStorage trước
    const [lang, setLang] = useState(() => {
        // Lấy giá trị đã lưu (nếu có)
        const savedLang = localStorage.getItem('appLanguage');
        // Nếu có thì dùng, không thì mặc định là 'en'
        return savedLang || 'en';
    });

    // 2. HÀM CHUYỂN NGÔN NGỮ
    const switchLanguage = (language) => {
        setLang(language);
        // Lưu ngay vào localStorage khi người dùng chọn
        localStorage.setItem('appLanguage', language);
    };

    // Hàm lấy text dịch
    const t = (key) => {
        // Kiểm tra nếu key tồn tại trong từ điển thì trả về, không thì trả về key gốc
        return translations[lang]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook
export const useLanguage = () => useContext(LanguageContext);
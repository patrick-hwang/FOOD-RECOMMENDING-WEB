// src/Context/LanguageContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Mặc định là tiếng Anh ('en')
    const [lang, setLang] = useState('en'); 

    // Hàm chuyển đổi ngôn ngữ
    const switchLanguage = (language) => {
        setLang(language);
    };

    // Hàm lấy text: t('hello') -> trả về "Xin chào" nếu lang là 'vi'
    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook để dùng nhanh ở các file khác
export const useLanguage = () => useContext(LanguageContext);
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Lấy trạng thái từ localStorage hoặc mặc định là false (Sáng)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('isDarkMode');
        return savedMode === 'true';
    });

    // 2. Toggle chế độ
    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    // 3. Cập nhật class 'dark-mode' vào body và lưu localStorage
    useEffect(() => {
        localStorage.setItem('isDarkMode', isDarkMode);
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
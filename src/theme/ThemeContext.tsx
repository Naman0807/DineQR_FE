import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider, App } from 'antd';
import { getThemeConfig } from './themeConfig';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('theme-mode');
        return savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newMode = !prev;
            localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
            return newMode;
        });
    };

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            <ConfigProvider theme={getThemeConfig(isDarkMode)}>
                <App>
                    {children}
                </App>
            </ConfigProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

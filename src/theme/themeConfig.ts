import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

export const brandColor = '#f97316'; // Orange-500
export const fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const getThemeConfig = (isDarkMode: boolean): ThemeConfig => ({
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
        colorPrimary: brandColor,
        borderRadius: 8,
        fontFamily: fontFamily,
    },
    components: {
        Button: {
            colorPrimary: brandColor,
            algorithm: true,
        },
        Tabs: {
            colorPrimary: brandColor,
            algorithm: true,
        },
        Checkbox: {
            colorPrimary: brandColor,
        },
        Radio: {
            colorPrimary: brandColor,
        },
    },
});

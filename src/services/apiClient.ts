import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, removeToken } from './tokenService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
    },
});

// Custom headers storage
const customHeaders: Record<string, string> = {};

/**
 * Adds or updates a global custom header for all requests.
 * @param name Header name
 * @param value Header value
 */
export const setHeader = (name: string, value: string) => {
    customHeaders[name] = value;
};

/**
 * Removes a global custom header.
 * @param name Header name
 */
export const removeHeader = (name: string) => {
    delete customHeaders[name];
};

// Request Interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        // Merge custom headers
        Object.entries(customHeaders).forEach(([key, value]) => {
            config.headers.set(key, value);
        });

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error) => {
        if (error.response) {
            const { status, data, config } = error.response;

            if (status === 401) {
                removeToken();

                // Only redirect if not already on an auth-related page and not an auth request
                const currentPath = window.location.pathname;
                const isAuthRequest = config.url?.includes('/auth/');
                const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');

                if (!isAuthRequest && !isAuthPage) {
                    const isSuperadminPath = currentPath.startsWith('/superadmin');
                    const redirectPath = isSuperadminPath ? '/superadmin/login' : '/admin/login';
                    window.location.href = redirectPath;
                }

                return Promise.reject(new Error(data?.detail || 'Session expired. Please login again.'));
            }

            if (status === 403) {
                const detail = data?.detail || '';
                if (detail.includes('pending') || detail.includes('deactivated') || data?.status === 'pending' || data?.status === 'deactivated') {
                    removeToken();
                    window.location.href = '/admin/suspended';
                }
                return Promise.reject(new Error(detail || 'Access denied'));
            }

            return Promise.reject(new Error(data?.detail || 'An error occurred'));
        }
        return Promise.reject(error);
    }
);

export default apiClient;

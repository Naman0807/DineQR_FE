export const TOKEN_KEY = 'auth_token';
export const CUSTOMER_TOKEN_KEY = 'customer_token';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function getCustomerToken(): string | null {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string): void {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function removeCustomerToken(): void {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

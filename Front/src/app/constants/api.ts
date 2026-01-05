const getBaseApiUrl = (): string => {
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.BASE_API_URL) {
            // @ts-ignore
            return process.env.BASE_API_URL as string;
        }
    } catch (e) {
        console.error('Error reading BASE_API_URL from process.env', e);
    }

    try {
        if (typeof window !== 'undefined' && (window as any).__env && (window as any).__env.BASE_API_URL) {
            return (window as any).__env.BASE_API_URL as string;
        }
    } catch (e) {
        console.error('Error reading BASE_API_URL from window.__env', e);
    }

    return 'http://localhost:4000/api';
};

export const BASE_API_URL = getBaseApiUrl();
export const CATEGORIES_API = BASE_API_URL + '/categories';
export const TRANSACTIONS_API = BASE_API_URL + '/transactions';
export const SERVICES_API = BASE_API_URL + '/services';
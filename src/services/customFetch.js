import refreshSession from "../utils/refreshSession";

export async function customFetch(url, options = {}) {

    options.credentials = 'include';
    options.cache = 'no-store';
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'x-api-key':import.meta.env.VITE_BACKEND_KEY
    };

    let response = await fetch(url, options);
    if (response.status === 401 && !options._retry) {
    
        options._retry = true;
        const refreshed = await refreshSession();
        if (refreshed) {
            return fetch(url, options);
        }
    
        throw new Error("SESSION_EXPIRED PLEASE LOGIN");
    }

    return response;
}
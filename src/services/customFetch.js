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

        try {
            // console.log("Access token expired. Attempting silent refresh...");
            
            const refreshRes = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',
                headers:{
                    'x-api-key':import.meta.env.VITE_BACKEND_KEY
                }
            });

            if (refreshRes.ok) {
                // console.log("Refresh successful! Retrying original request...");
                return await fetch(url, options);
            }
        } catch (refreshError) {
            console.error("Refresh token network error:", refreshError);
        }
        return { error: 'SESSION_EXPIRED' };
    }

    return response;
}
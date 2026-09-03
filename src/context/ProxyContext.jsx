import { createContext, useState, useEffect } from 'react';

export const ProxyContext = createContext();

export function ProxyProvider({ children }) {
    const [isProxyRunning, setIsProxyRunning] = useState(false);
    const [proxyPort, setProxyPort] = useState(17777); // Default port from Vlang server

    useEffect(() => {
        let intervalId;

        const checkProxyHealth = async () => {
            try {
                // The Vlang proxy responds to OPTIONS requests with 200 OK for preflight CORS
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const response = await fetch(`http://127.0.0.1:${proxyPort}/`, {
                    method: 'OPTIONS',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (response.ok) {
                    setIsProxyRunning(true);
                    window.__is_proxy_running = true;
                } else {
                    setIsProxyRunning(false);
                    window.__is_proxy_running = false;
                }
            } catch (error) {
                // Network error, connection refused, or aborted timeout means it's offline
                setIsProxyRunning(false);
                window.__is_proxy_running = false;
            }
        };

        // Initialize proxy port in window
        window.__proxy_port = proxyPort;

        // Initial check
        checkProxyHealth();

        // Poll every 5 seconds
        intervalId = setInterval(checkProxyHealth, 5000);

        return () => clearInterval(intervalId);
    }, [proxyPort]);

    return (
        <ProxyContext.Provider value={{ isProxyRunning, proxyPort, setProxyPort }}>
            {children}
        </ProxyContext.Provider>
    );
}

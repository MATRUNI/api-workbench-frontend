import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { MobileContext } from './MobileContext';

export const ProxyContext = createContext();

export function ProxyProvider({ children }) {
    const [isProxyRunning, setIsProxyRunning] = useState(false);
    const [proxyPort, setProxyPort] = useState(17777);
    const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
    const [lastPingMs, setLastPingMs] = useState(null);
    const { isMobile } = useContext(MobileContext);

    const checkProxyHealth = useCallback(async (customPort) => {
        const port = customPort || proxyPort;
        if (isMobile) {
            setIsProxyRunning(false);
            return false;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const start = performance.now();
        try {
            // Sankram C proxy answers OPTIONS preflight immediately with 204 No Content & CORS headers
            const response = await fetch(`http://127.0.0.1:${port}/`, {
                method: 'OPTIONS',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const ping = Math.round(performance.now() - start);

            if (response.ok || response.status === 204) {
                setIsProxyRunning(true);
                setLastPingMs(ping);
                window.__isProxyRunning = true;
                window.__proxy_port = port;
                return true;
            } else {
                setIsProxyRunning(false);
                window.__isProxyRunning = false;
                return false;
            }
        } catch (error) {
            // Network error, connection refused, or aborted timeout means it's offline
            setIsProxyRunning(false);
            window.__isProxyRunning = false;
            return false;
        } finally {
            clearTimeout(timeoutId);
        }
    }, [proxyPort, isMobile]);

    useEffect(() => {
        if (isMobile) {
            setIsProxyRunning(false);
            return;
        }

        // Initial check
        checkProxyHealth();

        // Poll every 5 seconds
        const intervalId = setInterval(() => checkProxyHealth(), 5000);

        return () => clearInterval(intervalId);
    }, [checkProxyHealth, isMobile]);

    return (
        <ProxyContext.Provider value={{ 
            isProxyRunning, 
            proxyPort, 
            setProxyPort, 
            isProxyModalOpen, 
            setIsProxyModalOpen,
            checkProxyHealth,
            lastPingMs
        }}>
            {children}
        </ProxyContext.Provider>
    );
}

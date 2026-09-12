import { createContext, useState, useEffect, useContext } from 'react';
import { MobileContext } from './MobileContext';

export const ProxyContext = createContext();

export function ProxyProvider({ children }) {
    const [isProxyRunning, setIsProxyRunning] = useState(false);
    const [proxyPort, setProxyPort] = useState(17777);
    const { isMobile } = useContext(MobileContext);

    useEffect(() => {
        if (isMobile) {
            setIsProxyRunning(false);
            return;
        }

        let intervalId;

        const checkProxyHealth = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            try {
                // The Vlang proxy responds to OPTIONS requests with 200 OK for preflight CORS

                const response = await fetch(`http://127.0.0.1:${proxyPort}/`, {
                    method: 'OPTIONS',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (response.ok) {
                    setIsProxyRunning(true);
                } else {
                    setIsProxyRunning(false);
                }
            } catch (error) {
                // Network error, connection refused, or aborted timeout means it's offline
                setIsProxyRunning(false);
            }
            finally{
                clearTimeout(timeoutId)
            }
        };

        // Initial check
        checkProxyHealth();

        // Poll every 5 seconds
        intervalId = setInterval(checkProxyHealth, 5000);

        return () => clearInterval(intervalId);
    }, [proxyPort, isMobile]); // Added isMobile so it resets correctly if screen size changes

    return (
        <ProxyContext.Provider value={{ isProxyRunning, proxyPort, setProxyPort }}>
            {children}
        </ProxyContext.Provider>
    );
}
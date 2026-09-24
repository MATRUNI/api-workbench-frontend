import { ArrayToObject } from "./ArrayToObject";
import { contentTypeHandlers } from '../services/contentTypeHandler';
import APIMask from "../utils/APIMask";
import { customFetch } from "./customFetch";
import { prepareRequest } from "../utils/requestUtils";
import { calculateLatencyWaterfall } from "../utils/networkTiming";

/**
 * Executes an HTTP request with intelligent auto-routing:
 * - Uses the local Vlang proxy when available (bypassing CORS, capturing OS socket metrics).
 * - Automatically falls back to browser direct fetch when the proxy is offline or unreachable.
 */
export async function callAPI(url, method, request, isProxyEnable) {
    const header = ArrayToObject(request.headers);
    const authHeaders = prepareRequest(request.auth);
    
    let queryString = "";
    try {
        queryString = new URLSearchParams({
            ...Object.fromEntries(new URL(url).searchParams),
            ...ArrayToObject(request.query || {})
        }).toString();
    } catch {
        queryString = new URLSearchParams(ArrayToObject(request.query || {})).toString();
    }

    const options = {
        method,
        headers: {
            ...(method !== "GET" && request.body ? { 'Content-Type': request.contentType || 'application/json' } : {}),
            ...authHeaders,
            ...header
        },
        body: method !== "GET" && request.body 
            ? (typeof request.body === "string" ? request.body : JSON.stringify(request.body)) 
            : undefined
    };

    const { isMasked, finalUrl } = APIMask(url);
    const targetUrl = `${finalUrl.split("?")[0]}${queryString ? "?" + queryString : ""}`;

    // Route through local proxy server if user enabled it, otherwise use browser direct call
    const shouldUseProxy = Boolean(isProxyEnable) && !isMasked;

    try {
        const startTime = performance.now();
        let res;
        let usedProxy = false;
        let executedUrl = targetUrl;

        if (shouldUseProxy) {
            const proxyPort = window.__proxy_port || 17777;
            const proxyUrl = `http://127.0.0.1:${proxyPort}/?url=${encodeURIComponent(targetUrl)}`;
            const proxyOptions = {
                ...options,
                credentials: "include"
            };

            try {
                res = await fetch(proxyUrl, proxyOptions);
                usedProxy = true;
                executedUrl = proxyUrl;
                window.__isProxyRunning = true;
            } catch (proxyError) {
                // Proxy unreachable (connection refused, daemon stopped) -> Fall back to browser direct fetch
                console.warn(`[Proxy Fallback] Vlang proxy at 127.0.0.1:${proxyPort} unavailable (${proxyError.message}). Routing via browser fetch.`);
                window.__isProxyRunning = false;
                
                res = isMasked
                    ? await customFetch(targetUrl, options)
                    : await fetch(targetUrl, options);
                usedProxy = false;
                executedUrl = targetUrl;
            }
        } else {
            // Direct browser fetch
            res = isMasked
                ? await customFetch(targetUrl, options)
                : await fetch(targetUrl, options);
            usedProxy = false;
            executedUrl = targetUrl;
        }

        const headerTime = performance.now();
        const resClone = res.clone();

        const contentType = (res.headers.get("content-type") || "").split(';')[0];
        const handlerFunction = contentTypeHandlers[contentType] || contentTypeHandlers["default"];
        const { length, data, rawData, type, category } = await handlerFunction(resClone);
        
        const endTime = performance.now();
        const timeTaken = Math.round(endTime - startTime);

        const headersObj = Object.fromEntries(res.headers.entries());
        const timing = calculateLatencyWaterfall({
            url: executedUrl,
            headers: headersObj,
            startTime,
            headerTime,
            endTime,
            isProxy: usedProxy
        });

        return {
            status: res.status,
            headers: headersObj,
            data,
            rawData: rawData !== undefined ? rawData : data,
            time: timeTaken,
            timing,
            length,
            type,
            category,
            proxyUsed: usedProxy,
            executionRoute: usedProxy ? 'proxy' : 'browser'
        };
    } catch (error) {
        console.error("FETCH FAILED", error);
        throw error;
    }
}
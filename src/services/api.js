import { ArrayToObject } from "./ArrayToObject"
import {contentTypeHandlers} from '../services/contentTypeHandler'
import APIMask from "../utils/APIMask";
import { customFetch } from "./customFetch";
export async function callAPI(url,method,request)
{
    const header=ArrayToObject(request.headers);
    const queryString = new URLSearchParams({...Object.fromEntries(new URL(url).searchParams),
      ...ArrayToObject(request.query || {})
    }).toString();
    const options={
        method,
        headers:{
            ...header,
            ...(method !== "GET" && request.body ? { 'Content-Type': 'application/json' } : {})
        },
        body:  method !== "GET" && request.body ? typeof request.body === "string"? request.body: JSON.stringify(request.body): undefined
    }
    const {isMasked, finalUrl} = APIMask(url)
    try{
        const startTime=Date.now()
        let requestUrl = `${finalUrl}${queryString ? "?" + queryString : ""}`;
        
        if (window.__is_proxy_running && !isMasked) {
            requestUrl = `http://127.0.0.1:${window.__proxy_port || 17777}/?url=${encodeURIComponent(requestUrl)}`;
        }

        const res = isMasked
          ? await customFetch(requestUrl, options)
          : await fetch(requestUrl, options);
        const endTime=Date.now();
        const timeTaken = endTime - startTime;
        const resClone=res.clone();

        const contentType = (res.headers.get("content-type")||"").split(';')[0];
        let handlerFunction=contentTypeHandlers[contentType] || contentTypeHandlers["default"];
        let {length,data,rawData,type, category}=await handlerFunction(resClone);
        return {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          data,
          rawData: rawData !== undefined ? rawData : data,
          time:timeTaken,
          length,
          type,
          category
        };
    }catch(error)
    {
      console.error("FETCH FAILED");
      console.error(error);
      console.error(error.name);
      console.error(error.message);
      throw error;
    }
}
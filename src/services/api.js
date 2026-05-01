import { getDefaultErrorMessage } from "../utils/errors";
import { ArrayToObject } from "./ArrayToObject"
export async function callAPI(url,method,request)
{
    const header=ArrayToObject(request.header);
    const queryString=new URLSearchParams(ArrayToObject(request.query)||{}).toString();
    const finalUrl = queryString? `${url}${url.includes('?') ? '&' : '?'}${queryString}`: url;
    const options={
        method,
        headers:{
            ...header,
            ...(method !== "GET" && request.body ? { 'Content-Type': 'application/json' } : {})
        },
        body:  method !== "GET" && request.body ? typeof request.body === "string"? request.body: JSON.stringify(request.body): undefined
    }
    try{
        const startTime=Date.now()
        let res=await fetch(finalUrl,options)
        const endTime=Date.now();
        const timeTaken = endTime - startTime;
        if(!res.ok)
        {
            let errorMessage = "";

            const contentType = res.headers.get("content-type");

            if (contentType?.includes("application/json")) {
              const data = await res.json().catch(() => null);
              errorMessage =
                data?.message || getDefaultErrorMessage(res.status);
            } else {
              const text = await res.text();
              errorMessage = text || getDefaultErrorMessage(res.status);
            }
            const error = new Error(errorMessage);
            error.status = res.status;
            throw error;
        }
        const contentType = res.headers.get("content-type");
        const data = contentType && contentType.includes("application/json")? await res.json(): await res.text();
        return {
          status: res.status,
          header: Object.fromEntries(res.headers.entries()),
          data,
          time:timeTaken
        };
    }catch(error)
    {
        throw error;
    }
}
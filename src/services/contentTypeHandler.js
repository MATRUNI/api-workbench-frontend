import {getResponseSize} from '../utils/getResponseSize'

let pI=null;
async function loadPrettier()
{
  if(!pI)
  {
    const prettier = await import("prettier/standalone");
    const parserBabel = await import("prettier/parser-babel");
    const parserHtml = await import("prettier/parser-html");
    const parserPostcss = await import("prettier/parser-postcss");

    pI={
      prettier,
      plugins:[parserBabel,parserHtml,parserPostcss]
    }
  }
  return pI;
}

export const contentTypeHandlers = {
  // JSON content
  "application/json": async (res) => {
    let length=await getResponseSize(res);
    let data=await res.json();
    data=JSON.stringify(data,null,2)
    return {length,data,type:"JSON"}; // Parse as JSON
  },

  // Text-based content
  "text/plain": async (res) => {
    let length=await getResponseSize(res);
    let data=await res.text();
    return {length,data,type:"TEXT"};
  },
  
  // HTML content (render or show as raw)
  "text/html": async (res) => {
    let length=await getResponseSize(res);
    let html = await res.text();
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(html,{parser:'html',plugins})
    return {length,data,type:"HTML"};
  },
  
  // CSS content (render or show as raw)
  "text/css": async (res) => {
    let length=await getResponseSize(res);
    let css = await res.text();
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(css,{parser:'css',plugins})
    return {length,data,type:"CSS"};
  },
  
  // JavaScript content (render or show as raw)
  "text/javascript": async (res) => {
    let length=await getResponseSize(res);
    let js = await res.text();
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(js,{parser:'babel',plugins});
    return {length,data,type:"JS"};
  },

  // XML content
  "application/xml": async (res) => {
    let length=await getResponseSize(res);
    const xml = await res.text();
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, "application/xml");
    return {length,data,type:"XML"};
  },
  "text/xml": async (res) => {
    let length=await getResponseSize(res);
    const xml = await res.text();
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, "application/xml");
    return {length,data,type:"XML"};
  },

  "image/png": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data, type:"PNG" };
  },
  "image/jpeg": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data, type:"JPEG" };
  },
  "application/pdf": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data, type:"PDF" };
  },
  "audio/mpeg": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data, type:"MPEG" };
  },
  "video/mp4": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data, type:"MP4" };
  },

  // Default fallback
  "default": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data, type:"BLOB" };
  }
};
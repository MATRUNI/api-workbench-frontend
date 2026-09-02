import {getDataSize} from '../utils/getResponseSize'

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
    let rawData=await res.text();
    let length=getDataSize(rawData);
    let data = rawData;
    try {
      data=JSON.stringify(JSON.parse(rawData),null,2);
    } catch(e) {}
    return {length,data,rawData,type:"JSON"}; // Parse as JSON
  },

  // Text-based content
  "text/plain": async (res) => {
    let rawData=await res.text();
    let length=getDataSize(rawData);
    return {length,data:rawData,rawData,type:"TEXT"};
  },
  
  // HTML content (render or show as raw)
  "text/html": async (res) => {
    let html = await res.text();
    let length=getDataSize(html);
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(html,{parser:'html',plugins})
    return {length,data,rawData:html,type:"HTML"};
  },
  
  // CSS content (render or show as raw)
  "text/css": async (res) => {
    let css = await res.text();
    let length=getDataSize(css);
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(css,{parser:'css',plugins})
    return {length,data,rawData:css,type:"CSS"};
  },
  
  // JavaScript content (render or show as raw)
  "text/javascript": async (res) => {
    let js = await res.text();
    let length=getDataSize(js);
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(js,{parser:'babel',plugins});
    return {length,data,rawData:js,type:"JS"};
  },

  // XML content
  "application/xml": async (res) => {
    const xml = await res.text();
    let length=getDataSize(xml);
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, "application/xml");
    return {length,data,rawData:xml,type:"XML"};
  },
  "text/xml": async (res) => {
    const xml = await res.text();
    let length=getDataSize(xml);
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, "application/xml");
    return {length,data,rawData:xml,type:"XML"};
  },

  "image/png": async (res) => {
    const data = await res.blob();
    const length = getDataSize(data);
    return { length, data, rawData: data, type:"PNG" };
  },
  "image/jpeg": async (res) => {
    const data = await res.blob();
    const length = getDataSize(data);
    return { length, data, rawData: data, type:"JPEG" };
  },
  "application/pdf": async (res) => {
    const data = await res.blob();
    const length = getDataSize(data);
    return { length, data, rawData: data, type:"PDF" };
  },
  "audio/mpeg": async (res) => {
    const data = await res.blob();
    const length = getDataSize(data);
    return { length, data, rawData: data, type:"MPEG" };
  },
  "video/mp4": async (res) => {
    const data = await res.blob();
    const length = getDataSize(data);
    return { length, data, rawData: data, type:"MP4" };
  },

  // Default fallback
  "default": async (res) => {
    const data = await res.blob();
    const length = getDataSize(data);
    return { length, data, rawData: data, type:"BLOB" };
  }
};
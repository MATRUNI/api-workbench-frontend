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
    console.log("called json")
    let length=await getResponseSize(res);
    let data=await res.json();
    data=JSON.stringify(data,null,2)
    return {length,data}; // Parse as JSON
  },

  // Text-based content
  "text/plain": async (res) => {
    console.log("called for text")
    let length=await getResponseSize(res);
    let data=await res.text();
    return {length,data};
  },
  
  // HTML content (render or show as raw)
  "text/html": async (res) => {
    console.log("called for html")
    let length=await getResponseSize(res);
    let html = await res.text();
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(html,{parser:'html',plugins})
    return {length,data};
  },
  
  // CSS content (render or show as raw)
  "text/css": async (res) => {
    console.log('called for css')
    let length=await getResponseSize(res);
    let css = await res.text();
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(css,{parser:'css',plugins})
    return {length,data};
  },
  
  // JavaScript content (render or show as raw)
  "text/javascript": async (res) => {
    let length=await getResponseSize(res);
    let js = await res.text();
    const {prettier,plugins}=await loadPrettier();
    let data=prettier.format(js,{parser:'babel',plugins});
    return {length,data};
  },

  // XML content
  "application/xml": async (res) => {
    let length=await getResponseSize(res);
    const xml = await res.text();
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, "application/xml");
    return {length,data};
  },
  "text/xml": async (res) => {
    let length=await getResponseSize(res);
    const xml = await res.text();
    const parser = new DOMParser();
    const data = parser.parseFromString(xml, "application/xml");
    return {length,data};
  },

  "image/png": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data };
  },
  "image/jpeg": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data };
  },
  "application/pdf": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data };
  },
  "audio/mpeg": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data };
  },
  "video/mp4": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data };
  },

  // Default fallback
  "default": async (res) => {
    const length = await getResponseSize(res);
    const data = await res.blob();
    return { length, data };
  }
};
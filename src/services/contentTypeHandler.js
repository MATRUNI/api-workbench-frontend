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

export async function formatContent(rawData, type)
{
  switch (type) {
    case "JSON":
      try {
        return JSON.stringify(JSON.parse(rawData), null, 2);
      } catch (e) {
        return rawData; // Fallback to raw text if it's not valid JSON
      }
    case "HTML":
    {
      const {prettier,plugins}=await loadPrettier();
      return prettier.format(rawData,{parser:'html',plugins});
    }
    case "CSS":
    {
      const {prettier,plugins} = await loadPrettier();
      return prettier.format(rawData,{parser:"css",plugins});
    }
    case "JS":
    {
      const {prettier,plugins}=await loadPrettier();
      return prettier.format(rawData,{parser:'babel',plugins});
    }
    case "XML":
    {
      const parser = new DOMParser();
      return parser.parseFromString(rawData, "application/xml");
    }
    default:
      return rawData;
  }
}

export const contentTypeHandlers = {
  // JSON content
  "application/json": async (res) => {
    let rawData=await res.text();
    let length=getDataSize(rawData);
    const data = await formatContent(rawData, "JSON")
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
    const data = await formatContent(html, "HTML")
    return {length,data,rawData:html,type:"HTML"};
  },
  
  // CSS content (render or show as raw)
  "text/css": async (res) => {
    let css = await res.text();
    let length=getDataSize(css);
    const data = await formatContent(css, "CSS")
    return {length,data,rawData:css,type:"CSS"};
  },
  
  // JavaScript content (render or show as raw)
  "text/javascript": async (res) => {
    let js = await res.text();
    let length=getDataSize(js);
    const data = await formatContent(js, "JS")
    return {length,data,rawData:js,type:"JS"};
  },

  // XML content
  "application/xml": async (res) => {
    const xml = await res.text();
    let length=getDataSize(xml);
    const data = await formatContent(xml, "XML")
    return {length,data,rawData:xml,type:"XML"};
  },
  "text/xml": async (res) => {
    const xml = await res.text();
    let length=getDataSize(xml);
    const data = await formatContent(xml, "XML")
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
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
function detectCSV(text) {
  if (typeof text !== 'string') return false;
  const lines = text.trim().split('\n');
  return lines.length > 1 && lines[0].includes(',');
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
      const doc = parser.parseFromString(rawData, "application/xml");
      if(doc.querySelector("parsererror"))
      {
        return {
          message:"Invalid XML"
        }
      }
      return rawData
    }
    default:
      return rawData;
  }
}

const SUPPORTED_TYPES = {
  "application/json":     { type: "JSON",     category: "TEXT",     method: "text" },
  "text/plain":           { type: "TEXT",     category: "TEXT",     method: "text" },
  "text/html":            { type: "HTML",     category: "TEXT",     method: "text" },
  "text/css":             { type: "CSS",      category: "TEXT",     method: "text" },
  "text/javascript":      { type: "JS",       category: "TEXT",     method: "text" },
  "application/typescript":{ type: "TS",      category: "TEXT",     method: "text" },
  "application/xml":      { type: "XML",      category: "TEXT",     method: "text" },
  "text/xml":             { type: "XML",      category: "TEXT",     method: "text" },
  "application/yaml":     { type: "YAML",     category: "TEXT",     method: "text" },
  "text/markdown":        { type: "MARKDOWN", category: "TEXT",     method: "text" },
  "text/csv":             { type: "CSV",      category: "DOCUMENT", method: "text" },

  "image/png":            { type: "PNG",      category: "IMAGE",    method: "blob" },
  "image/jpeg":           { type: "JPEG",     category: "IMAGE",    method: "blob" },
  "image/gif":            { type: "GIF",      category: "IMAGE",    method: "blob" },
  "image/webp":           { type: "WEBP",     category: "IMAGE",    method: "blob" },
  "image/svg+xml":        { type: "SVG",      category: "IMAGE",    method: "text" },
  "image/x-icon":         { type: "ICO",      category: "IMAGE",    method: "blob" },

  "application/pdf":      { type: "PDF",      category: "DOCUMENT", method: "blob" },

  "audio/mpeg":           { type: "MP3",      category: "AUDIO",    method: "blob" },
  "audio/wav":            { type: "WAV",      category: "AUDIO",    method: "blob" },
  "audio/ogg":            { type: "OGG",      category: "AUDIO",    method: "blob" },

  "video/mp4":            { type: "MP4",      category: "VIDEO",    method: "blob" },
  "video/webm":           { type: "WEBM",     category: "VIDEO",    method: "blob" },

  "application/zip":      { type: "ZIP",      category: "ARCHIVE",  method: "blob" }
};

export const contentTypeHandlers = Object.fromEntries(
  Object.entries(SUPPORTED_TYPES).map(([mime, config]) => [
    mime,
    async (res) => {
      const rawData = await res[config.method]();
      let type = config.type;
      let category = config.category;
      if (mime === "text/plain" && detectCSV(rawData)) {
        type = "CSV";
        category = "DOCUMENT";
      }
      const length = getDataSize(rawData);
      const data = config.method === "text" ? await formatContent(rawData, config.type) : rawData;
      return { length, data, rawData, type, category };
    }
  ])
);

contentTypeHandlers["default"] = async (res) => {
  const data = await res.blob();
  const length = getDataSize(data);
  return { length, data, rawData: data, type: "BLOB", category: "BLOB" };
};
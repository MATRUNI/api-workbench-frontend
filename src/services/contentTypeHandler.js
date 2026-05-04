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
    return await res.json(); // Parse as JSON
  },

  // Text-based content
  "text/plain": async (res) => {
    console.log("called for text")
    return await res.text(); // Return plain text
  },
  
  // HTML content (render or show as raw)
  "text/html": async (res) => {
    console.log("called for html")
    let html = await res.text();
    const {prettier,plugins}=await loadPrettier();
    html=prettier.format(html,{parser:'html',plugins})
    return html;
  },
  
  // CSS content (render or show as raw)
  "text/css": async (res) => {
    console.log('called for css')
    let css = await res.text();
    const {prettier,plugins}=await loadPrettier();
    css=prettier.format(css,{parser:'css',plugins})
    return css;
  },
  
  // JavaScript content (render or show as raw)
  "text/javascript": async (res) => {
    let js = await res.text();
    const {prettier,plugins}=await loadPrettier();
    js=prettier.format(js,{parser:'babel',plugins});
    return js;
  },

  // XML content
  "application/xml": async (res) => {
    const xml = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "application/xml");
    return xmlDoc;
  },
  "text/xml": async (res) => {
    const xml = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "application/xml");
    return xmlDoc;
  },

  "image/png": async (res) => {
    return await res.blob();
  },
  "image/jpeg": async (res) => {
    return await res.blob();
  },
  "application/pdf": async (res) => {
    return await res.blob();
  },
  "audio/mpeg": async (res) => {
    return await res.blob();
  },
  "video/mp4": async (res) => {
    return await res.blob();
  },

  "default": async (res) => {
    return await res.blob();
  },
};
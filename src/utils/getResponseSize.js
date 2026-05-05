function formatBytes(bytes)
{
    if(bytes<1024) return bytes+" B";
    if(bytes<1024*1024) return (bytes/1024).toFixed(2)+" KB";
    return (bytes/(1024*1024)).toFixed(2)+ " MB"
}
export async function getResponseSize(res)
{
    let clone=res.clone();
    let text=await clone.text();
    return formatBytes(new TextEncoder().encode(text).length)
}
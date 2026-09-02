export function formatBytes(bytes)
{
    if(bytes<1024) return bytes+" B";
    if(bytes<1024*1024) return (bytes/1024).toFixed(2)+" KB";
    return (bytes/(1024*1024)).toFixed(2)+ " MB"
}

export function getDataSize(data)
{
    if (data instanceof Blob) {
        return formatBytes(data.size);
    }
    if (typeof data === 'string') {
        return formatBytes(new TextEncoder().encode(data).length);
    }
    return formatBytes(0);
}
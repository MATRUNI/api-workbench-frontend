
export default function APIMask(url='')
{
    const { hostname, pathname, protocol } = new URL(url)
    console.log('host',hostname)
    console.log('path',pathname)
    if(hostname==='api.os.runtime')
    {
        if(protocol==='https:')
        return {isMasked: true, finalUrl:import.meta.env.VITE_BACKEND_URL+`/runtime${pathname}`}
        throw new Error("wrong protocol")
    }
    else 
    {
        return {isMasked: false, finalUrl:url}
    }
}
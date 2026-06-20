

export default async function callConfigAPI(id) 
{
    try 
    {
        let res = await fetch(import.meta.env.VITE_BACKEND_URL+`/config/api/${id}`,{
            headers:{
                'x-api-key':import.meta.env.VITE_BACKEND_KEY
            }
        });

        if(!res.ok)
        {
            throw new Error("Request failed with status code:",res.status)
        }
        return await res.json();
    } 
    catch (error) 
    {
        throw new Error("Failed to fetch API configuration",error.message)
    }
}
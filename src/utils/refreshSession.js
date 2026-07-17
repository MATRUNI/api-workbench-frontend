export default async function refreshSession() 
{
    try 
    {
        const response = await fetch(
            import.meta.env.VITE_BACKEND_URL + "/api/auth/refresh",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "x-api-key": import.meta.env.VITE_BACKEND_KEY
                }
            }
        );
    
        return response.ok;    
    } catch (error) {
        return false;
    }

}
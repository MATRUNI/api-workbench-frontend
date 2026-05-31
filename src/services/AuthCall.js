import { customFetch } from "./customFetch";

async function AuthCall({username,email,password})
{
    let res=await customFetch(import.meta.env.VITE_BACKEND_URL+"/api/auth/register",{
        method:"POST",
        body: JSON.stringify({username,email,password}),
    })
    let data=await res.json();
    return data;
}
export default AuthCall
export async function LoginCall({email,password})
{
    let res=await customFetch(import.meta.env.VITE_BACKEND_URL+"/api/auth/login",{
        method:"POST",
        body: JSON.stringify({email,password}),
    })
    let data=await res.json();
    return data;
}

export async function me() {
    try {
        const res = await customFetch(import.meta.env.VITE_BACKEND_URL + '/api/users/me', {
            method: 'GET'
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP_ERROR: STATUS_${res.status}`);
        }

        return await res.json();
        
    } catch (error) {
        throw error; // Re-throw so your UserContext catch-block can handle it
    }
}export async function LogoutCall() {
    const res = await customFetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/logout", {
        method: "POST"
    });
    return await res.json();
}
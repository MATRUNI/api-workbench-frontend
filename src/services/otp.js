export async function sendOTP(data) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      'x-api-key':import.meta.env.VITE_BACKEND_KEY
    },
    body: JSON.stringify(data)
  });

  return res
}

export async function verifyOTP(data) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, {
    method: "POST",
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      'x-api-key':import.meta.env.VITE_BACKEND_KEY
    },
    body: JSON.stringify(data)
  });

  return res;
}
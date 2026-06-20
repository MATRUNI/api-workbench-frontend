export async function sendOTP({ email }) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'x-api-key':import.meta.env.VITE_BACKEND_KEY
    },
    body: JSON.stringify({ email })
  });

  const payload = await res.json();
  return res.ok && payload.success === true;
}

export async function verifyOTP({ email, otp }) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'x-api-key':import.meta.env.VITE_BACKEND_KEY
    },
    body: JSON.stringify({ email, otp })
  });

  const payload = await res.json();
  return res.ok && payload.success === true;
}
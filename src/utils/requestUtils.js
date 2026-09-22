export function encodeBasicAuth({ username = '', password = '' } = {}) {
  try {
    const raw = `${username}:${password}`;
    return "Basic " + btoa(unescape(encodeURIComponent(raw)));
  } catch {
    return "Basic " + btoa(`${username}:${password}`);
  }
}

export function encodeBearerAuth(token = '') {
  const cleanToken = String(token || '').trim();
  return cleanToken ? `Bearer ${cleanToken}` : '';
}

export function prepareRequest(auth) {
  if (!auth || typeof auth !== 'object') return {};

  switch (auth.type) {
    case "basic": {
      if (!auth.username && !auth.password) return {};
      const val = encodeBasicAuth(auth);
      return val ? { Authorization: val } : {};
    }
    case "bearer": {
      if (!auth.token || !String(auth.token).trim()) return {};
      const val = encodeBearerAuth(auth.token);
      return val ? { Authorization: val } : {};
    }
    default:
      return {};
  }
}
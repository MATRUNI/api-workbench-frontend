export const FALLBACK_APIS = [
  {
    name: 'JSONPlaceholder Posts',
    method: 'GET',
    category: 'Testing',
    endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
    description: 'Fake online REST API for testing and prototyping'
  },
  {
    name: 'JSONPlaceholder Users',
    method: 'GET',
    category: 'Testing',
    endpoint: 'https://jsonplaceholder.typicode.com/users',
    description: 'Mock user records with address and company'
  },
  {
    name: 'Cat Facts',
    method: 'GET',
    category: 'Animals',
    endpoint: 'https://catfact.ninja/fact',
    description: 'Random daily facts about cats'
  },
  {
    name: 'ReqRes Users',
    method: 'GET',
    category: 'Testing',
    endpoint: 'https://reqres.in/api/users',
    description: 'Real-world HTTP requests and responses simulation'
  },
  {
    name: 'GitHub Octocat',
    method: 'GET',
    category: 'Developer',
    endpoint: 'https://api.github.com/users/octocat',
    description: 'Public GitHub developer user profile endpoint'
  },
  {
    name: 'DummyJSON Products',
    method: 'GET',
    category: 'E-Commerce',
    endpoint: 'https://dummyjson.com/products/1',
    description: 'E-commerce mock catalog with inventory and pricing'
  }
];

let lastTimingTelemetry = null;

export function getLastTimingTelemetry() {
  return lastTimingTelemetry;
}

export function setLastTimingTelemetry(timing) {
  lastTimingTelemetry = timing;
}

export function parseWithClauses(withStr) {
  const result = {
    auth: null,
    headers: [],
    query: [],
    body: null
  };

  if (!withStr) return result;

  const rawClauses = withStr.split('&').map(c => c.trim()).filter(Boolean);

  for (const clause of rawClauses) {
    const authMatch = clause.match(/^(-a|auth:?)\s+(.*)$/i);
    if (authMatch) {
      const val = authMatch[2].trim();
      if (/^bearer\s+/i.test(val)) {
        result.auth = { type: 'bearer', token: val.replace(/^bearer\s+/i, '').trim() };
      } else if (/^basic\s+/i.test(val)) {
        const creds = val.replace(/^basic\s+/i, '').trim().split(':');
        result.auth = { type: 'basic', username: creds[0] || '', password: creds[1] || '' };
      } else {
        result.auth = { type: 'bearer', token: val };
      }
      continue;
    }

    const headerMatch = clause.match(/^(-h|headers:?|h:?)\s+(.*)$/i);
    if (headerMatch) {
      const rawPairs = headerMatch[2].trim();
      const pairs = rawPairs.split(/,\s*(?=[A-Za-z0-9_-]+=)/);
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx !== -1) {
          result.headers.push({
            key: pair.slice(0, eqIdx).trim(),
            value: pair.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim()
          });
        }
      }
      continue;
    }

    const queryMatch = clause.match(/^(-q|query:?|q:?)\s+(.*)$/i);
    if (queryMatch) {
      const rawPairs = queryMatch[2].trim();
      const pairs = rawPairs.split(/,\s*(?=[A-Za-z0-9_-]+=)/);
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx !== -1) {
          result.query.push({
            key: pair.slice(0, eqIdx).trim(),
            value: pair.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim()
          });
        }
      }
      continue;
    }

    const bodyMatch = clause.match(/^(-b|body:?|b:?)\s+([\s\S]*)$/i);
    if (bodyMatch) {
      const rawBody = bodyMatch[2].trim();
      try {
        result.body = JSON.parse(rawBody);
      } catch (e) {
        result.body = rawBody.replace(/^["']|["']$/g, '');
      }
      continue;
    }
  }

  return result;
}

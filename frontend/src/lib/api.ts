import { getLocalKeyObject } from '@/lib/localStorage';

type InvokePayload = Record<string, unknown>;

export async function call<T = any>(action: string, payload?: InvokePayload): Promise<T | any> {
  let request = { ...payload };
  const config = getLocalKeyObject('currentCluster');
  if (config.hasOwnProperty('server') && config.server !== '') {
    request.server = config.server;
  }
  const token = localStorage.getItem('token');
  if (payload) {
    if (action !== 'lookup_configs' && action !== 'ping') {
      console.debug(`[${action}] hit payload [${JSON.stringify(request)}]`);
    }
    const res = await fetch(`/api/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Token: token ? token : '',
      },
      body: JSON.stringify(request),
    });
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return res.json();
    }
    if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
      return res.text();
    }
    return res.text();
  }
  if (action !== 'lookup_configs' && action !== 'ping') {
    console.debug(`[${action}] hit`);
  }
  const res = await fetch(`/api/${action}`, {
    headers: {
      'Content-Type': 'application/json',
      Token: token ? token : '',
    },
  });
  if (res.status === 401) {
    const err = await res.json();
    throw new Error(`Unauthorized request ${err.message}`);
  }
  return res.json();
}

export async function cleanup() {
  const config = getLocalKeyObject('currentCluster');
  const token = localStorage.getItem('token');
  const server = config.server;
  await fetch(`/api/cleanup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Token: token ? token : '',
    },
    body: JSON.stringify({ server }),
  });
}

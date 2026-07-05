const GATEWAY_BASE = '/api';

export interface ConnectionConfig {
  id: string;
  label: string;
  host: string;
  port: number;
  apiKey: string;
  useHttps: boolean;
  gatewayPrefix?: string;
  dashboardPrefix?: string;
  dashboardProxied: boolean;
  dashboardPortOverride?: number;
  dashboardUsername?: string;
  dashboardPassword?: string;
}

export function buildBaseUrl(cfg: ConnectionConfig): string {
  const scheme = cfg.useHttps ? 'https' : 'http';
  let base = `${scheme}://${cfg.host}:${cfg.port}`;
  if (cfg.gatewayPrefix) {
    base += '/' + cfg.gatewayPrefix.replace(/^\/+|\/+$/g, '');
  }
  return base;
}

function joinPrefix(base: string, prefix?: string): string {
  let url = base.replace(/\/+$/, '');
  if (prefix) {
    url += '/' + prefix.replace(/^\/+|\/+$/g, '');
  }
  return url;
}

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function apiGet<T>(
  cfg: ConnectionConfig,
  endpoint: string,
): Promise<T> {
  const url = `${buildBaseUrl(cfg)}/${endpoint}`;
  const res = await fetch(url, { headers: authHeaders(cfg.apiKey) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function apiGetList(
  cfg: ConnectionConfig,
  endpoint: string,
): Promise<any[]> {
  const url = `${buildBaseUrl(cfg)}/${endpoint}`;
  const res = await fetch(url, { headers: authHeaders(cfg.apiKey) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

export async function apiPost<T>(
  cfg: ConnectionConfig,
  endpoint: string,
  body?: Record<string, any>,
): Promise<T> {
  const url = `${buildBaseUrl(cfg)}/${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(cfg.apiKey),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function apiPut<T>(
  cfg: ConnectionConfig,
  endpoint: string,
  body: Record<string, any>,
): Promise<T> {
  const url = `${buildBaseUrl(cfg)}/${endpoint}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: authHeaders(cfg.apiKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function apiDelete(
  cfg: ConnectionConfig,
  endpoint: string,
): Promise<void> {
  const url = `${buildBaseUrl(cfg)}/${endpoint}`;
  const res = await fetch(url, { headers: authHeaders(cfg.apiKey), method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Dashboard auth ──────────────────────────────────────────────

async function getDashboardBase(cfg: ConnectionConfig): Promise<string> {
  const scheme = cfg.useHttps ? 'https' : 'http';
  const port = cfg.dashboardPortOverride ?? (cfg.useHttps ? cfg.port : 9119);
  let base = `${scheme}://${cfg.host}:${port}`;
  if (cfg.dashboardPrefix) {
    base += '/' + cfg.dashboardPrefix.replace(/^\/+|\/+$/g, '');
  }
  return base;
}

async function getDashboardHeaders(cfg: ConnectionConfig): Promise<HeadersInit> {
  if (cfg.dashboardProxied) return { 'Content-Type': 'application/json' };

  if (cfg.dashboardUsername && cfg.dashboardPassword) {
    const base = await getDashboardBase(cfg);
    const res = await fetch(`${base}/auth/password-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'basic',
        username: cfg.dashboardUsername,
        password: cfg.dashboardPassword,
      }),
    });
    if (res.status === 401) throw new Error('Dashboard login failed');
    if (!res.ok) throw new Error(`Dashboard login: HTTP ${res.status}`);

    const setCookie = res.headers.get('set-cookie') || '';
    const match = setCookie.match(
      /((?:__Host-|__Secure-)?hermes_session_at)=([^;,\s]+)/,
    );
    if (!match) throw new Error('No session cookie in login response');
    const cookie = `${match[1]}=${match[2]}`;
    return { Cookie: cookie, 'Content-Type': 'application/json' };
  }

  const base = await getDashboardBase(cfg);
  const res = await fetch(base + '/');
  if (res.status !== 200) throw new Error('Dashboard not reachable');
  const html = await res.text();
  const tokenMatch = html.match(/window\.__HERMES_SESSION_TOKEN__="([^"]+)";/);
  if (!tokenMatch) throw new Error('No session token in dashboard');
  return {
    'X-Hermes-Session-Token': tokenMatch[1],
    'Content-Type': 'application/json',
  };
}

async function dashboardFetch(
  cfg: ConnectionConfig,
  endpoint: string,
  init?: RequestInit,
  retried = false,
): Promise<Response> {
  const base = await getDashboardBase(cfg);
  const headers = await getDashboardHeaders(cfg);
  const res = await fetch(`${base}/api/${endpoint}`, {
    ...init,
    headers: { ...headers, ...(init?.headers || {}) },
  });
  if (res.status === 401 && !retried) {
    // Reset and retry once
    return dashboardFetch(cfg, endpoint, init, true);
  }
  return res;
}

export async function dashboardGetList<T>(
  cfg: ConnectionConfig,
  endpoint: string,
): Promise<T[]> {
  const res = await dashboardFetch(cfg, endpoint);
  if (!res.ok) throw new Error(`Dashboard HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) return [];
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : data.data || [];
}

export async function dashboardGet<T>(
  cfg: ConnectionConfig,
  endpoint: string,
): Promise<T> {
  const res = await dashboardFetch(cfg, endpoint);
  if (!res.ok) throw new Error(`Dashboard HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text);
}

export async function dashboardPost<T>(
  cfg: ConnectionConfig,
  endpoint: string,
  body?: Record<string, any>,
): Promise<T> {
  const res = await dashboardFetch(cfg, endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Dashboard HTTP ${res.status}`);
  return res.json();
}

export async function dashboardPut<T>(
  cfg: ConnectionConfig,
  endpoint: string,
  body: Record<string, any>,
): Promise<T> {
  const res = await dashboardFetch(cfg, endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Dashboard HTTP ${res.status}`);
  return res.json();
}

export async function dashboardDelete(
  cfg: ConnectionConfig,
  endpoint: string,
): Promise<void> {
  const res = await dashboardFetch(cfg, endpoint, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Dashboard HTTP ${res.status}`);
}

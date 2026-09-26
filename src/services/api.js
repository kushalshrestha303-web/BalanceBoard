export async function api(path, options = {}) {
  try {
    const response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.code === 'SESSION_EXPIRED') window.dispatchEvent(new Event('balanceboard:session-expired'));
      throw Object.assign(new Error(data.error || `Request failed (${response.status})`), { status: response.status });
    }
    return data;
  } catch (e) {
    if (e.name === 'TimeoutError') throw new Error('The server took too long to respond. Reconnect and check your saved data before trying again.');
    if (e instanceof TypeError) throw new Error('Cannot reach the server. Check your connection and try again.');
    throw e;
  }
}
export function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const BASE_URL = 'http://localhost:5093/api/distribucion'

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

async function parseError(res) {
  try {
    const json = await res.json()
    const msg = json?.mesg || json?.message || JSON.stringify(json)
    throw new Error(msg)
  } catch (e) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Error en la respuesta del servidor')
  }
}

export async function getDistribuciones() {
  const res = await fetch(BASE_URL, { headers: authHeaders() })
  if (!res.ok) await parseError(res)
  return res.json()
}

export async function getDistribucion(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: authHeaders() })
  if (!res.ok) await parseError(res)
  return res.json()
}

export async function createDistribucion(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) await parseError(res)
  return res.json()
}

export async function updateDistribucion(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) await parseError(res)
  return res.json()
}

export async function deleteDistribucion(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) await parseError(res)
  return true
}

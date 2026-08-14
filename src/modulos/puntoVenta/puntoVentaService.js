const BASE_URL = 'http://localhost:5093/api/puntos-venta'

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export async function getPuntosVenta() {
  const res = await fetch(BASE_URL, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status} al obtener puntos de venta`)
  return res.json()
}

export async function createPuntoVenta(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || `Error ${res.status} al crear punto de venta`)
  }
  return res.json()
}

export async function updatePuntoVenta(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || `Error ${res.status} al actualizar punto de venta`)
  }
  return res.json()
}

export async function deletePuntoVenta(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || `Error ${res.status} al eliminar punto de venta`)
  }
  return true
}

export default { getPuntosVenta, createPuntoVenta, updatePuntoVenta, deletePuntoVenta }

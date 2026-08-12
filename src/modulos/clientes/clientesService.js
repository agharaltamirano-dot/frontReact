const BASE_URL = 'http://localhost:5093/api/clientes'

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

export async function getClientes() {
  const res = await fetch(BASE_URL, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status} al obtener clientes`)
  return res.json()
}

export async function createCliente(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || `Error ${res.status} al crear cliente`)
  }
  return res.json()
}

export async function updateCliente(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || `Error ${res.status} al actualizar cliente`)
  }
  return res.json()
}

export async function deleteCliente(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || `Error ${res.status} al eliminar cliente`)
  }
  return true
}

export default { getClientes, createCliente, updateCliente, deleteCliente }

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

function withQuery(url, filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const query = params.toString()
  return query ? `${url}?${query}` : url
}

async function getFile(url, filters) {
  const res = await fetch(withQuery(url, filters), { headers: authHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status} al generar el reporte`)
  return res.blob()
}

export async function getClientes(filters = {}) {
  const res = await fetch(withQuery(BASE_URL, filters), { headers: authHeaders() })
  if (!res.ok) throw new Error(`Error ${res.status} al obtener clientes`)
  return res.json()
}

export function getReporteClientesPdf(filters = {}) {
  return getFile('http://localhost:5093/api/reporteCliente/reporte-clientes/pdf', filters)
}

export function getReporteClientesXlsx(filters = {}) {
  return getFile('http://localhost:5093/api/reporteCliente/reporte-clientes/xlsx', filters)
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

export default { getClientes, getReporteClientesPdf, getReporteClientesXlsx, createCliente, updateCliente, deleteCliente }

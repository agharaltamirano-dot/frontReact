const BASE_URL_PASAJES = 'http://localhost:5093/api/pasajes'

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
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getPasajes() {
  const res = await fetch(BASE_URL_PASAJES, { headers: authHeaders() })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error fetching pasajes: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function deletePasaje(id) {
  const res = await fetch(`${BASE_URL_PASAJES}/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error deleting pasaje: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function getTicketBlob(pasajeId) {
  const url = `http://localhost:5093/api/ticket/${pasajeId}`
  const res = await fetch(url, { method: 'GET', headers: authHeaders() })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error fetching ticket: ${res.status} ${txt}`)
  }
  return res.blob()
}

export default { getPasajes, deletePasaje, getTicketBlob }

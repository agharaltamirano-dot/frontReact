const BASE_URL_PASAJES = 'http://localhost:5093/api/pasajes'
const BASE_URL_PASAJES_REPORTE = 'http://localhost:5093/api/reportePasajes'
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

function withQuery(url, filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'todos') params.set(key, value)
  })
  const query = params.toString()
  return query ? `${url}?${query}` : url
}

async function getFile(url, filters) {
  const res = await fetch(withQuery(url, filters), { headers: authHeaders() })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error ${res.status} al generar el reporte: ${txt}`)
  }
  return res.blob()
}

export async function getPasajes(filters = {}) {
  const res = await fetch(withQuery(BASE_URL_PASAJES, filters), { headers: authHeaders() })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error fetching pasajes: ${res.status} ${txt}`)
  }
  return res.json()
}
export async function getReportePasajes(filters = {}) {
  const res = await fetch(withQuery(`${BASE_URL_PASAJES_REPORTE}/reporte-pasajes/json`, filters), { headers: authHeaders() })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error fetching pasajes: ${res.status} ${txt}`)
  }
  const data = await res.json()
  return data.pasajes
}
export function getReportePasajesPdf(filters = {}) {
  return getFile(`${BASE_URL_PASAJES_REPORTE}/reporte-pasajes/pdf`, filters)
}

export function getReportePasajesXlsx(filters = {}) {
  return getFile(`${BASE_URL_PASAJES_REPORTE}/reporte-pasajes/xlsx`, filters)
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

export default { getPasajes, getReportePasajesPdf, getReportePasajesXlsx, deletePasaje, getTicketBlob }

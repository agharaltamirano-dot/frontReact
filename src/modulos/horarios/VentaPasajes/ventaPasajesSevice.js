const BASE_URL_HORARIOS = 'http://localhost:5093/api/horarios'

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

export async function getHorarioById(id) {
  const res = await fetch(`${BASE_URL_HORARIOS}/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error fetching horario')
  return res.json()
}

const BASE_URL_PASAJES = 'http://localhost:5093/api/pasajes'

export async function postPasajesBatch(items) {
    console.log('Posting pasajes batch:', items)  // Log the items being sent
  const res = await fetch(BASE_URL_PASAJES, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(items)
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error posting pasajes: ${res.status} ${txt}`)
  }
  return res.json()
}

export async function deletePasaje(id) {
  const res = await fetch(`${BASE_URL_PASAJES}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error deleting pasaje: ${res.status} ${txt}`)
  }
  return res.json()
}

// Descargar hoja de ruta (PDF) para un horario
export async function getHojaRuta(horarioId) {
  const url = `http://localhost:5093/api/ticket/horarioHojaRuta/${horarioId}`
  const headers = { 'Authorization': `Bearer ${getToken()}` }
  const res = await fetch(url, { method: 'GET', headers })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Error fetching hoja de ruta: ${res.status} ${txt}`)
  }
  return res.blob()
}

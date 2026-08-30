const BASE_URL = 'http://localhost:5093/api/rutas'

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

export async function getRutas() {
  const res = await fetch(BASE_URL, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error fetching rutas')
  return res.json()
}

export async function createRuta(payload) {
  console.log('datos de nueva o edit ruta', payload)
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error creating ruta')
  return res.json()
}

export async function updateRuta(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error updating ruta')
  return res.json()
}

export async function deleteRuta(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) throw new Error('Error deleting ruta')
  return null
}

export default { getRutas, createRuta, updateRuta, deleteRuta }

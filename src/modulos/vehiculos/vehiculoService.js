const BASE_URL = 'http://localhost:5093/api/vehiculos'

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

export async function getVehiculos() {
  const res = await fetch(BASE_URL, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error fetching vehiculos')
  return res.json()
}

export async function createVehiculo(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error creating vehiculo')
  return res.json()
}

export async function updateVehiculo(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Error updating vehiculo')
  return res.json()
}

export async function deleteVehiculo(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) throw new Error('Error deleting vehiculo')
  return true
}

const BASE_URL_CONDUCTORES = 'http://localhost:5093/api/conductores'

export async function getConductores() {
  const res = await fetch(BASE_URL_CONDUCTORES, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error fetching conductores')
  return res.json()
}

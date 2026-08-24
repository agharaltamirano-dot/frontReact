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
  const isFormData = payload instanceof FormData;
  const headers = isFormData 
    ? { 'Authorization': `Bearer ${getToken()}` }
    : authHeaders();
  
  const body = isFormData ? payload : JSON.stringify(payload);

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers,
    body
  })
  if (!res.ok) throw new Error('Error creating vehiculo')
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export async function updateVehiculo(id, payload) {
  const isFormData = payload instanceof FormData;
  const headers = isFormData 
    ? { 'Authorization': `Bearer ${getToken()}` }
    : authHeaders();
  
  const body = isFormData ? payload : JSON.stringify(payload);

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers,
    body
  })
  if (!res.ok) throw new Error('Error updating vehiculo')
  const text = await res.text()
  return text ? JSON.parse(text) : {}
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

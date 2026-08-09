const BASE_URL_DISTRIBUCION = 'http://localhost:5093/api/distribucion'

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

export async function getDistribuciones() {
  const res = await fetch(BASE_URL_DISTRIBUCION, { headers: authHeaders() })
  if (!res.ok) throw new Error('Error fetching distribuciones')
  return res.json()
}

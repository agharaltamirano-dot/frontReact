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

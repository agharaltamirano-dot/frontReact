export function telefonoValido(value) {
  return /^\d{8,10}$/.test(String(value ?? '').trim())
}

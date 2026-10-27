export function nombreValido(value) {
  if (typeof value !== 'string') return false
  const length = Array.from(value.trim()).length
  return length >= 3 && length <= 20
}

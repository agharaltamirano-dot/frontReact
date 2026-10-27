const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function parseDate(value) {
  const text = String(value).trim()
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?=$|[T\s,])/)
  const local = !iso && text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?=$|[\s,])/)
  if (!iso && !local) return null

  const year = Number(iso ? iso[1] : local[3])
  const month = Number(iso ? iso[2] : local[2])
  const day = Number(iso ? iso[3] : local[1])
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  const remainder = text.slice((iso || local)[0].length).replace(/^[T\s,]+/, '')
  const time = remainder.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:\s*(?:[ap]\.?\s*m\.?|Z|[+-]\d{2}:?\d{2}))?$/i)
  if (remainder && (!time || Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3] || 0) > 59)) return null

  return { year, month, day, time: remainder, iso: Boolean(iso) }
}

function shortDate(year, month, day) {
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`
}

function invalidDate(value) {
  console.warn('No se pudo formatear la fecha:', value)
  return String(value)
}

export function formatShortDate(value) {
  if (value == null || value === '') return ''
  const parsed = parseDate(value)
  return parsed ? shortDate(parsed.year, parsed.month, parsed.day) : invalidDate(value)
}

export function formatShortDateTime(value, { localizeTime = false } = {}) {
  if (value == null || value === '') return ''
  const parsed = parseDate(value)
  if (!parsed) return invalidDate(value)

  if (parsed.time && localizeTime && parsed.iso) {
    const date = new Date(String(value).trim().replace(' ', 'T'))
    if (Number.isNaN(date.getTime())) return invalidDate(value)
    return `${shortDate(date.getFullYear(), date.getMonth() + 1, date.getDate())}, ${date.toLocaleTimeString('es-BO')}`
  }

  const date = shortDate(parsed.year, parsed.month, parsed.day)
  return parsed.time ? `${date}, ${parsed.time}` : date
}

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatShortDate, formatShortDateTime } from './formatDate.js'

test('formatea fechas sin desplazar el día', () => {
  assert.equal(formatShortDate('2026-10-20'), '20 Oct 2026')
  assert.equal(formatShortDate('2026-10-20T00:00:00Z'), '20 Oct 2026')
  assert.equal(formatShortDate('20/10/2026'), '20 Oct 2026')
  assert.equal(formatShortDate('2024-02-29'), '29 Feb 2024')
  assert.equal(formatShortDate(''), '')
})

test('mantiene la hora original de envío y recepción', () => {
  assert.equal(formatShortDateTime('2026-10-20 14:05:07'), '20 Oct 2026, 14:05:07')
  assert.equal(formatShortDateTime('2026-10-20T08:03:00.123Z'), '20 Oct 2026, 08:03:00.123Z')
  assert.equal(formatShortDateTime('2026-10-20'), '20 Oct 2026')
  assert.equal(formatShortDateTime(null), '')
})

test('conserva la hora local mostrada anteriormente en el reporte de pasajes', () => {
  const value = '2026-10-20T14:05:07'
  assert.equal(
    formatShortDateTime(value, { localizeTime: true }),
    `20 Oct 2026, ${new Date(value).toLocaleTimeString('es-BO')}`
  )
  assert.equal(formatShortDateTime('2026-10-20', { localizeTime: true }), '20 Oct 2026')
})

test('muestra el valor original y advierte si la fecha no es válida', () => {
  const originalWarn = console.warn
  const warnings = []
  console.warn = (...args) => warnings.push(args)
  try {
    assert.equal(formatShortDate('2026-02-29'), '2026-02-29')
    assert.equal(formatShortDateTime('fecha desconocida'), 'fecha desconocida')
    assert.equal(formatShortDateTime('2026-10-20 99:05:00'), '2026-10-20 99:05:00')
    assert.equal(warnings.length, 3)
  } finally {
    console.warn = originalWarn
  }
})

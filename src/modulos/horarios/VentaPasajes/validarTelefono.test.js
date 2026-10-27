import test from 'node:test'
import assert from 'node:assert/strict'
import { telefonoValido } from './validarTelefono.js'

test('acepta teléfonos de 8 a 10 dígitos, incluso los recibidos como número', () => {
  for (const telefono of ['12345678', '123456789', '1234567890', 12345678, ' 12345678 ']) {
    assert.equal(telefonoValido(telefono), true, String(telefono))
  }
})

test('rechaza teléfonos vacíos, fuera de rango o con caracteres que no son dígitos', () => {
  for (const telefono of ['', null, undefined, '1234567', '12345678901', '1234abcd', '1234-5678', '+12345678', '1234 5678']) {
    assert.equal(telefonoValido(telefono), false, String(telefono))
  }
})

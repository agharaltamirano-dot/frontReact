import test from 'node:test'
import assert from 'node:assert/strict'
import { nombreValido } from './validarNombre.js'

test('acepta nombres de 3 a 20 caracteres sin contar espacios exteriores', () => {
  for (const nombre of ['Ana', 'a'.repeat(20), '  Ana  ', 'José Pérez']) {
    assert.equal(nombreValido(nombre), true, nombre)
  }
})

test('rechaza nombres vacíos o fuera del límite', () => {
  for (const nombre of ['', '   ', '  An  ', 'a'.repeat(21), null, undefined]) {
    assert.equal(nombreValido(nombre), false, String(nombre))
  }
})

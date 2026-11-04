import { describe, it, expect } from 'vitest'
import { parsePayload, type CasoPractico } from './types'
import { gradeCaso, gradeRelacionar, newAttemptId } from './grade'

const WHY = 'El cable directo sirve para unir equipos distintos, como una PC y un switch.'
const caso: CasoPractico = {
  kind: 'caso_practico',
  question: '¿Qué cable usas para conectar dos laptops?',
  scene: 'Dos laptops, sin switch.',
  explanation: 'Equipos iguales usan cable cruzado.',
  options: [
    { text: 'Cable directo', correct: false, whyWrong: WHY },
    { text: 'Cable cruzado', correct: true },
    { text: 'Cable coaxial', correct: false, whyWrong: 'El coaxial no se usa en redes Ethernet modernas.' },
    { text: 'Cable serial', correct: false, whyWrong: 'El serial sirve para consola, no para enlazar laptops.' },
  ],
}

describe('ejercicios', () => {
  it('rechaza dos opciones correctas', () => {
    expect(() =>
      parsePayload({ kind: 'caso_practico', question: 'q', scene: 's', explanation: 'e',
        options: [{ text: 'a', correct: true }, { text: 'b', correct: true, whyWrong: 'x' }] }),
    ).toThrow()
  })
  it('rechaza incorrecta sin whyWrong', () => {
    expect(() =>
      parsePayload({ kind: 'caso_practico', question: 'q', scene: 's', explanation: 'e',
        options: [{ text: 'a', correct: true }, { text: 'b', correct: false }] }),
    ).toThrow()
  })
  it('acepta un caso válido', () => {
    expect(parsePayload(caso)).toEqual(caso)
  })
  it('gradeCaso', () => {
    expect(gradeCaso(caso, 0)).toEqual({ correct: false, score: 0, whyWrong: WHY })
    expect(gradeCaso(caso, 1)).toEqual({ correct: true, score: 1 })
  })
  it('gradeRelacionar', () => {
    expect(gradeRelacionar(4, 3)).toEqual({ score: 0.75, correct: false })
    expect(gradeRelacionar(4, 4)).toEqual({ score: 1, correct: true })
  })
  it('newAttemptId es único', () => {
    expect(newAttemptId()).not.toBe(newAttemptId())
  })
})

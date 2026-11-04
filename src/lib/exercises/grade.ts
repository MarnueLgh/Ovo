import type { CasoPractico } from './types'

export function gradeCaso(p: CasoPractico, chosen: number): { correct: boolean; score: 0 | 1; whyWrong?: string } {
  const opt = p.options[chosen]
  if (opt?.correct) return { correct: true, score: 1 }
  return { correct: false, score: 0, whyWrong: opt?.whyWrong }
}

export function gradeRelacionar(pairs: number, firstTryCorrect: number): { score: number; correct: boolean } {
  return { score: pairs > 0 ? firstTryCorrect / pairs : 0, correct: pairs > 0 && firstTryCorrect === pairs }
}

export function gradeAbierta(total: number, checked: number): { score: number; correct: boolean } {
  return { score: total > 0 ? checked / total : 0, correct: total > 0 && checked === total }
}

export const newAttemptId = (): string => crypto.randomUUID()

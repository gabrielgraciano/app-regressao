/**
 * Gerador de números pseudoaleatórios com semente.
 *
 * Reprodutibilidade é requisito de sala de aula: "todos digitem semente 42" tem
 * de produzir exatamente a mesma amostra em todas as máquinas.
 *
 * Este arquivo é matemática pura — sem React, sem DOM.
 */

/**
 * PRNG `mulberry32`: rápido, com estado de 32 bits e período 2³².
 * Devolve uma função que gera uniformes em [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function random(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Transforma um gerador uniforme em gerador normal padrão N(0, 1) pelo método
 * de Box–Muller (forma polar). Cada par de uniformes produz dois normais; o
 * segundo fica guardado para a chamada seguinte.
 */
export function makeNormal(rand: () => number): () => number {
  let guardado: number | null = null
  return function normal(): number {
    if (guardado !== null) {
      const z = guardado
      guardado = null
      return z
    }
    // Evita u1 = 0, que levaria log(0) = -Infinity.
    let u1 = rand()
    while (u1 <= Number.EPSILON) u1 = rand()
    const u2 = rand()
    const r = Math.sqrt(-2 * Math.log(u1))
    const theta = 2 * Math.PI * u2
    guardado = r * Math.sin(theta)
    return r * Math.cos(theta)
  }
}

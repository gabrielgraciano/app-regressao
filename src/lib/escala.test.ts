import { describe, expect, it } from 'vitest'
import { ajustaDominio, comFolga, extento, type Intervalo } from './escala'

describe('comFolga', () => {
  it('acrescenta folga simétrica', () => {
    expect(comFolga([0, 10], 0.1)).toEqual([-1, 11])
  })

  it('usa folga fixa quando o intervalo é degenerado', () => {
    expect(comFolga([3, 3])).toEqual([2, 4])
  })
})

describe('ajustaDominio', () => {
  it('cria o domínio quando ainda não existe', () => {
    expect(ajustaDominio(null, [0, 10], 0.1)).toEqual([-1, 11])
  })

  it('preserva a referência quando o conteúdo cabe', () => {
    const atual: Intervalo = [-5, 15]
    expect(ajustaDominio(atual, [0, 10])).toBe(atual)
  })

  it('reenquadra quando o conteúdo sai por cima ou por baixo', () => {
    const atual: Intervalo = [0, 10]
    expect(ajustaDominio(atual, [2, 12])).not.toBe(atual)
    expect(ajustaDominio(atual, [-2, 8])).not.toBe(atual)
  })

  it('reenquadra quando sobra folga demais', () => {
    const atual: Intervalo = [0, 100]
    expect(ajustaDominio(atual, [49, 51])).not.toBe(atual)
  })

  /**
   * O defeito que motivou este módulo: deslocar todos os y por uma constante
   * (mexer em β₀) tem de mover o conteúdo na tela, não o eixo — enquanto
   * couber na janela.
   */
  it('mantém o eixo parado sob deslocamento constante que ainda cabe', () => {
    const dados = [4, 5, 6] // extento 2 → folga padrão de 0,6 para cada lado
    let dominio = ajustaDominio(null, extento(dados))
    const inicial = dominio
    for (const desloc of [0.2, 0.5, -0.4, -0.55]) {
      dominio = ajustaDominio(dominio, extento(dados.map((v) => v + desloc)))
    }
    expect(dominio).toBe(inicial)
  })

  it('a folga padrão dá espaço real de movimento antes de reenquadrar', () => {
    const dominio = ajustaDominio(null, [0, 10])
    // um deslocamento de 25% do intervalo dos dados ainda tem de caber
    expect(ajustaDominio(dominio, [2.5, 12.5])).toBe(dominio)
  })

  it('acaba cedendo quando o deslocamento é grande', () => {
    const dados = [4, 5, 6]
    const inicial = ajustaDominio(null, extento(dados))
    const depois = ajustaDominio(inicial, extento(dados.map((v) => v + 50)))
    expect(depois).not.toBe(inicial)
    expect(depois[0]).toBeLessThanOrEqual(54)
    expect(depois[1]).toBeGreaterThanOrEqual(56)
  })
})

describe('extento', () => {
  it('ignora valores não finitos', () => {
    expect(extento([1, NaN, 5, Infinity, 3])).toEqual([1, 5])
  })

  it('devolve um intervalo utilizável quando não há valor finito', () => {
    expect(extento([NaN, Infinity])).toEqual([0, 1])
  })
})

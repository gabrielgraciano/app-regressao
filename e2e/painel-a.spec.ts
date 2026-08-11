import { expect, test, type Page } from '@playwright/test'

/** Move um slider dos controles pelo seu rótulo. */
async function defineSlider(page: Page, rotulo: string, valor: number) {
  const slider = page.locator(`input[data-teste="${rotulo}"]`)
  await slider.fill(String(valor))
  await slider.dispatchEvent('change')
}

const cy = async (page: Page, seletor: string) =>
  Number(await page.locator(seletor).first().getAttribute('cy'))

test.beforeEach(async ({ page }) => {
  await page.goto('')
  await expect(page.locator('svg[aria-label*="dispersão"]')).toBeVisible()
})

test('a página carrega com os três painéis', async ({ page }) => {
  // só os títulos de painel (h2): o corpo tem subtítulos com os mesmos termos
  const titulos = page.getByRole('heading', { level: 2 })
  await expect(titulos.filter({ hasText: 'Dispersão' })).toBeVisible()
  await expect(titulos.filter({ hasText: 'log-verossimilhança' })).toBeVisible()
  await expect(titulos.filter({ hasText: 'Perfil em σ²' })).toBeVisible()
})

/**
 * Regressão do defeito relatado: o domínio de y era recalculado a partir dos
 * próprios yᵢ, então mexer em β₀ deslocava dados e eixo pela mesma constante e
 * nada se movia na tela. Aqui o que se afirma é o oposto: os pontos têm de
 * mudar de posição.
 */
test('mexer no intercepto verdadeiro move os pontos na tela', async ({
  page,
}) => {
  const antes = await cy(page, '[data-teste="ponto"]')
  await defineSlider(page, 'intercepto verdadeiro', 4)
  const depois = await cy(page, '[data-teste="ponto"]')

  // 2 unidades de deslocamento cabem na janela pegajosa: o eixo fica parado e
  // é o conteúdo que anda.
  expect(Math.abs(depois - antes)).toBeGreaterThan(8)
})

test('o intercepto candidato é marcado sobre a vertical x = 0', async ({
  page,
}) => {
  // uma linha vertical tem área zero: `toBeVisible` a considera oculta.
  const eixo = page.locator('[data-teste="eixo-x0"]')
  await expect(eixo).toHaveCount(1)

  const xEixo = Number(await eixo.getAttribute('x1'))
  const marcador = page.locator('[data-teste="intercepto-candidato"]')
  await expect(marcador).toHaveCount(1)
  expect(Number(await marcador.getAttribute('cx'))).toBeCloseTo(xEixo, 1)
})

test('arrastar a alça do intercepto move a reta candidata', async ({
  page,
}) => {
  // a alça é o elemento do SVG, não o slider de β₀ verdadeiro dos controles
  const alca = page.locator(
    'svg [role="slider"][aria-label*="Alça de intercepto"]',
  )
  // no celular o painel fica abaixo da dobra: sem rolar até ele, as
  // coordenadas do ponteiro caem fora do gráfico
  await alca.scrollIntoViewIfNeeded()
  const caixa = await alca.boundingBox()
  expect(caixa).not.toBeNull()
  if (!caixa) return

  const marcadorAntes = await cy(page, '[data-teste="intercepto-candidato"]')

  const cx = caixa.x + caixa.width / 2
  const cyAlca = caixa.y + caixa.height / 2
  await page.mouse.move(cx, cyAlca)
  await page.mouse.down()
  await page.mouse.move(cx, cyAlca - 60, { steps: 8 })
  await page.mouse.up()

  const marcadorDepois = await cy(page, '[data-teste="intercepto-candidato"]')
  expect(marcadorDepois).toBeLessThan(marcadorAntes) // subiu na tela
})

test('a semente torna a amostra reprodutível', async ({ page }) => {
  const semente = page.locator('#semente')
  const primeiro = await cy(page, '[data-teste="ponto"]')

  await semente.fill('7')
  await semente.dispatchEvent('change')
  expect(await cy(page, '[data-teste="ponto"]')).not.toBeCloseTo(primeiro, 1)

  await semente.fill('42')
  await semente.dispatchEvent('change')
  expect(await cy(page, '[data-teste="ponto"]')).toBeCloseTo(primeiro, 1)
})

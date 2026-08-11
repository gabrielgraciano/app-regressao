import { test } from '@playwright/test'

/**
 * Capturas da página inteira. Não afirmam nada sozinhas — servem para alguém
 * (ou algum agente) olhar o resultado sem precisar publicar antes. No CI vão
 * como artefato do PR.
 */
test('captura a página', async ({ page }, info) => {
  await page.goto('')
  await page.locator('svg[aria-label*="dispersão"]').waitFor()
  // dá tempo do heatmap do painel B ser desenhado no canvas
  await page.waitForTimeout(700)

  await page.screenshot({
    path: `e2e/telas/${info.project.name}.png`,
    fullPage: true,
  })
})

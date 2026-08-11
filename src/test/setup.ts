/**
 * Configuração dos testes.
 *
 * O jsdom não implementa `<canvas>`. O painel B já trata `getContext` nulo
 * (não desenha), então aqui só silenciamos o aviso repetido do jsdom.
 */
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => null,
  writable: true,
})

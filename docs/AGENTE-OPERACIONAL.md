# Instruções para o agente operacional — Sprint 1

Contexto de arquitetura e justificativas: [`PLANO.md`](./PLANO.md). Leia antes
de começar. Este documento é a lista de tarefas; o PLANO é o porquê.

**Repositório:** `gabrielgraciano/app-regressao`
**Branch de trabalho:** `claude/regression-simulation-app-pjeurb`
**Entrega:** app rodando em `https://gabrielgraciano.github.io/app-regressao/`

Regras gerais:
- Não invente dependências fora da lista da tarefa T1.
- `src/lib/` é matemática pura: **proibido importar React ou tocar no DOM lá**.
- Toda a interface em **português**.
- Commits pequenos e descritivos, um por tarefa (T1, T2, ...).
- Ao final de cada tarefa: `npm run typecheck && npm test && npm run build`.

---

## T1 — Andaime do projeto

Crie na raiz um projeto **Vite + React + TypeScript**:

```bash
npm create vite@latest . -- --template react-ts
npm i d3-scale katex
npm i -D @types/d3-scale tailwindcss @tailwindcss/postcss postcss autoprefixer vitest jsdom @testing-library/react
```

Configurar:
- `vite.config.ts` → **`base: '/app-regressao/'`** (crítico para o GitHub Pages)
  e `test: { environment: 'jsdom' }`.
- Tailwind conforme a documentação da versão instalada; importar o CSS em `main.tsx`.
- `public/.nojekyll` (arquivo vazio).
- Scripts em `package.json`: `dev`, `build`, `preview`,
  `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- `.gitignore` cobrindo `node_modules`, `dist`.
- `README.md` curto: o que é, como rodar (`npm i && npm run dev`), link do site
  publicado e link para `docs/PLANO.md`.

**Critério de aceite:** `npm run dev` sobe e `npm run build` gera `dist/`.

---

## T2 — Núcleo matemático (`src/lib/`) + testes

Sem nenhuma UI ainda. Assinaturas sugeridas (ajuste nomes se necessário, mas
mantenha as funções puras e sem estado global):

```ts
// rng.ts
export function mulberry32(seed: number): () => number;
export function makeNormal(rand: () => number): () => number; // Box–Muller

// simulate.ts
export type Params = { n: number; beta0: number; beta1: number; sigma: number;
                       xMin: number; xMax: number; seed: number };
export type Sample = { x: number[]; y: number[] };
export function simulate(p: Params): Sample; // x equiespaçado em [xMin,xMax]

// regression.ts
export type Sums = { n: number; sx: number; sy: number; sxx: number; sxy: number;
                     xbar: number; ybar: number; Sxx: number; Sxy: number };
export function sums(s: Sample): Sums;
export function ols(s: Sample): { beta0: number; beta1: number };
export function rss(s: Sample, b0: number, b1: number): number;      // SQRes
export function logLik(s: Sample, b0: number, b1: number, sigma2: number): number;
export function sigma2Mle(s: Sample, b0: number, b1: number): number; // SQRes/n
export function s2Unbiased(s: Sample, b0: number, b1: number): number; // SQRes/(n−2)

// fisher.ts — exatamente a matriz do plano (esperança do negativo da hessiana)
export type Mat3 = number[][];
export function fisherInfo(s: Sample, sigma2: number): Mat3;
export function invert3x3(m: Mat3): Mat3;
export function standardErrors(inv: Mat3): { se0: number; se1: number; seSigma2: number };

// ellipse.ts
// elipse de confiança 95% para (β₀, β₁) a partir do bloco 2×2 de I⁻¹;
// retorne pontos parametrizados para desenhar em SVG (eigen-decomposição 2×2 fechada)
export function confidenceEllipse(inv2x2: number[][], center: [number, number],
                                  level: number, points: number): [number, number][];
```

Testes (`vitest`) que **devem** existir:
1. `ols` reproduz um conjunto pequeno calculado à mão (ex.: x = [1,2,3,4],
   y = [2,4,5,8] → conferir com a fórmula `Sxy/Sxx`).
2. `logLik(β̂₀, β̂₁, σ̂²_EMV)` é maior que em ~20 perturbações aleatórias dos
   parâmetros — o EMV é de fato o máximo.
3. `sigma2Mle` = `s2Unbiased × (n−2)/n`.
4. `invert3x3(fisherInfo(...))` multiplicada pela original dá a identidade
   (tolerância `1e-9`).
5. `simulate` com a mesma semente devolve exatamente a mesma amostra.

**Critério de aceite:** `npm test` verde, cobertura das 5 propriedades acima.

---

## T3 — Casca da UI e estado

- `App.tsx`: cabeçalho com o título ("Regressão: simulação e aprendizado"),
  espaço para navegação de módulos (só "EMV" ativo por ora) e rodapé com uma
  linha explicando que é material de estudo de MAE0350.
- `src/modules/emv/useEmvState.ts`: um `useReducer` (ou hook) com **todo** o
  estado do módulo — `Params`, reta candidata `(b0, b1)`, `sigma2` do candidato,
  flag `modoDesafio`. Amostra e estatísticas derivadas via `useMemo`.
- Componentes reutilizáveis em `src/components/`: `Slider` (rótulo + valor +
  faixa), `Panel` (card com título), `Formula` (KaTeX), `Readout` (símbolo,
  valor formatado, legenda).
- Layout responsivo: em telas largas, controles à esquerda e gráficos à direita;
  em celular, tudo empilhado.

**Critério de aceite:** mexer nos sliders regenera a amostra e os números
derivados aparecem na tela (mesmo que ainda sem gráficos).

---

## T4 — Painel A: dispersão interativa

SVG com escalas de `d3-scale`:
- pontos da amostra;
- reta **verdadeira** (tracejada, discreta);
- reta **candidata** (sólida, destacada) com **duas alças arrastáveis** — uma
  move a reta inteira (muda β₀), a outra gira (muda β₁); suportar mouse e toque
  (Pointer Events);
- reta **EMV** (cor distinta; escondida quando `modoDesafio` está ligado);
- resíduos como segmentos verticais entre ponto e reta candidata, com opacidade
  proporcional ao quadrado do resíduo;
- eixos rotulados `x` e `y`.

**Critério de aceite:** arrastar as alças atualiza SQRes e ℓ em tempo real, sem
travar com `n = 500`; funciona com o dedo no celular.

---

## T5 — Painel B: superfície de log-verossimilhança

- `<canvas>` com grade ~120×120 sobre uma janela de `(β₀, β₁)` centrada no EMV e
  dimensionada pelos erros-padrão (ex.: `β̂ ± 4·EP`).
- Plotar a **deviance** `ℓ − ℓ_máx` (evita o problema de contraste descrito no
  PLANO §7.3), com escala de cor perceptualmente uniforme.
- Curvas de nível em `ℓ_máx − {0.5, 1, 2, 4, 8}` (marching squares simples ou
  contornos aproximados — não puxe uma biblioteca só para isso).
- Marcadores: candidato (arrastável), EMV, valor verdadeiro.
- **Elipse de confiança 95%** de `confidenceEllipse`, sobreposta.
- Clicar ou arrastar no canvas move a reta candidata → o painel A reage.
- Recalcular só quando `(amostra, janela)` mudar; mover o candidato **não**
  redesenha o heatmap.

**Critério de aceite:** painéis A e B sincronizados nos dois sentidos; o mínimo
da deviance coincide visualmente com o EMV analítico.

---

## T6 — Painel C, painel numérico e modo desafio

Painel C: curva de `ℓ(β₀ᶜ, β₁ᶜ, σ²)` variando σ², com linha vertical no
`σ̂² = SQRes/n` e slider para o aluno explorar.

Painel numérico (KaTeX + valores ao vivo):
- `ℓ(candidato)`, `ℓ(θ̂)` e o **gap**;
- `SQRes`, `β̂₀`, `β̂₁`;
- `σ̂²_EMV` **lado a lado** com `s² = SQRes/(n−2)`, com uma frase curta sobre o
  viés do EMV de σ²;
- matriz `I(θ̂)` 3×3 renderizada com as fórmulas (`n/σ²`, `Σxᵢ/σ²`, `Σxᵢ²/σ²`,
  `n/(2σ⁴)`) e, ao lado, os valores numéricos;
- `I(θ̂)⁻¹` e os erros-padrão `EP(β̂₀)`, `EP(β̂₁)`.

Modo desafio: esconde reta EMV e marcador do EMV, mostra placar com o gap de
log-verossimilhança e um botão "revelar".

Textos didáticos: um parágrafo curto por painel, dizendo o que olhar.

**Critério de aceite:** os símbolos na tela batem com as fórmulas do PLANO §2.

---

## T7 — Publicação (GitHub Pages)

Criar `.github/workflows/deploy.yml`:

- gatilhos: `push` na `main` e `workflow_dispatch`;
- permissões `contents: read`, `pages: write`, `id-token: write`;
- `concurrency: { group: "pages", cancel-in-progress: false }`;
- job **build**: `actions/checkout@v4` → `actions/setup-node@v4` (node 22,
  `cache: npm`) → `npm ci` → `npm run typecheck` → `npm test` → `npm run build`
  → `actions/upload-pages-artifact@v3` com `path: dist`;
- job **deploy**: `needs: build`, `environment: github-pages`,
  `actions/deploy-pages@v4`.

Criar também `.github/workflows/ci.yml`: em `pull_request` e em push na branch de
trabalho, rodar `npm ci && npm run typecheck && npm test && npm run build`.

Depois de subir os workflows, **escreva no README** (seção "Publicação") o passo
manual que só o dono do repositório pode fazer:

> Em **Settings → Pages → Build and deployment → Source**, selecionar
> **GitHub Actions**. Sem isso o deploy falha com "Pages não habilitado".

Se o `deploy` falhar por Pages não habilitado, **não tente contornar** — relate
esse passo ao usuário.

**Critério de aceite:** workflows commitados e válidos; README explicando o
passo manual e a URL final.

---

## T8 — Fechamento

1. `npm run build && npm run preview` e confira a página localmente.
2. Push: `git push -u origin claude/regression-simulation-app-pjeurb`.
3. **Não abra Pull Request sem o usuário pedir.** Ao terminar, informe:
   - o que foi entregue por tarefa;
   - o passo manual do Settings → Pages;
   - que o deploy roda ao integrar na `main` (o repositório ainda não tem
     `main`; a integração é decisão do usuário).

---

## Se algo travar

- Requisito ambíguo → escolha a opção mais simples que satisfaça o critério de
  aceite, implemente e **registre a decisão** no relatório final.
- Conflito entre este documento e o `PLANO.md` → o `PLANO.md` manda.
- Performance ruim no painel B → reduza a grade para 80×80 antes de trocar de
  abordagem.

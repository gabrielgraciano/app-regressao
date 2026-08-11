# Plano de engenharia — App de Simulação e Aprendizado de Regressão

> Documento de arquitetura e roadmap. As instruções acionáveis para o agente
> operacional estão em [`AGENTE-OPERACIONAL.md`](./AGENTE-OPERACIONAL.md).

## 1. Objetivo

Aplicativo web (site estático, sem backend) de **simulação e aprendizado de
regressão**, para uso em sala de aula (disciplina MAE0350, IME-USP) e por
colegas. O aluno mexe em parâmetros, vê os dados e as estatísticas mudando em
tempo real, e conecta a fórmula do quadro com o comportamento numérico.

Princípio de produto: **cada tela existe para tornar uma fórmula tangível.**
Se um gráfico não responde a "qual conta do quadro isso ilustra?", ele não entra.

## 2. Escopo da v1 (Módulo 1 — EMV na regressão linear simples)

Modelo: `Yᵢ = β₀ + β₁xᵢ + εᵢ`, com `εᵢ ~ N(0, σ²)` i.i.d., `i = 1..n`.

Log-verossimilhança:

```
ℓ(β₀, β₁, σ²) = −(n/2)·log(2π) − (n/2)·log(σ²) − (1/(2σ²))·Σ(yᵢ − β₀ − β₁xᵢ)²
```

EMV (forma fechada):

```
β̂₁ = Sxy / Sxx        β̂₀ = ȳ − β̂₁x̄        σ̂²_EMV = SQRes / n
```

Matriz de informação de Fisher (é literalmente o conteúdo da lousa —
esperança do negativo da hessiana):

```
              ⎡  n/σ²        Σxᵢ/σ²        0      ⎤
I(θ)  =       ⎢  Σxᵢ/σ²      Σxᵢ²/σ²       0      ⎥
              ⎣  0           0             n/(2σ⁴)⎦
```

Daí `Var̂(θ̂) ≈ I(θ̂)⁻¹` e os erros-padrão assintóticos `EP = √diag(I⁻¹)`.

### Telas / interações da v1

Uma única página com 3 painéis sincronizados pelo mesmo estado:

| Painel | Conteúdo | Interação |
|---|---|---|
| **A. Dispersão** | pontos simulados, reta verdadeira (tracejada), reta candidata (sólida), reta EMV (destacada), resíduos como segmentos verticais | arrastar as duas alças da reta candidata |
| **B. Superfície de ℓ** | heatmap + curvas de nível de `ℓ(β₀, β₁, σ̂²(β₀,β₁))` no plano (β₀, β₁); marcadores do candidato, do EMV e do valor verdadeiro; elipse de confiança 95% via `I⁻¹` | clicar/arrastar move o candidato |
| **C. Perfil em σ²** | `ℓ` como função de σ² com (β₀, β₁) fixos no candidato, máximo em `σ̂² = SQRes/n` | slider de σ² |

Controles (painel lateral): `n`, `β₀` verdadeiro, `β₁` verdadeiro, `σ`,
faixa de `x`, **semente** do gerador, botões "nova amostra" e "ir para o EMV".

Painel numérico (sempre visível): `ℓ(candidato)` vs `ℓ(θ̂)` e o *gap*, `SQRes`,
`β̂₀`, `β̂₁`, `σ̂²_EMV` **vs** `s² = SQRes/(n−2)` (com nota sobre o viés),
`I(θ̂)`, `I(θ̂)⁻¹` e os erros-padrão.

Modo **desafio**: esconde a reta EMV e pede para o aluno chegar nela arrastando;
mostra o gap de log-verossimilhança como placar.

### Fora do escopo da v1

Regressão múltipla, GLM, dados reais/upload, contas de usuário, backend,
persistência, i18n. Ver roadmap.

## 3. Decisões técnicas (fixadas)

| Decisão | Escolha | Motivo |
|---|---|---|
| Stack | **Vite + React 18 + TypeScript** | build estático simples, tipagem ajuda a manter a matemática honesta |
| Estilo | **Tailwind CSS** | rápido, sem inventar design system |
| Gráficos | **SVG à mão + `d3-scale`** (sem lib de charts) | arrastar reta e clicar na superfície exige controle total; libs de chart atrapalham |
| Heatmap | `<canvas>` só para o painel B | grade de ~120×120 avaliações de ℓ por frame |
| Fórmulas | **KaTeX** (pacote npm, self-hosted) | fórmulas do quadro renderizadas de verdade |
| Matemática | código próprio em `src/lib/` | forma fechada; nada de dependência numérica pesada |
| Aleatoriedade | PRNG com semente (`mulberry32`) + Box–Muller | **reprodutibilidade em aula**: "todos digitem semente 42" |
| Testes | **Vitest** para `src/lib/` | as fórmulas precisam de rede de segurança |
| Idioma da UI | **Português** | público-alvo é a turma |
| Deploy | **GitHub Pages via GitHub Actions** | repo já está no GitHub, custo zero, URL estável |

URL final: `https://gabrielgraciano.github.io/app-regressao/`
(por isso `base: '/app-regressao/'` no `vite.config.ts` — errar isso quebra
todos os assets em produção).

## 4. Arquitetura de pastas

```
.
├─ .github/workflows/ci.yml         # typecheck + testes em PR
├─ .github/workflows/deploy.yml     # build + GitHub Pages em push na main
├─ docs/                            # este plano e as instruções
├─ public/.nojekyll
├─ index.html
├─ vite.config.ts                   # base: '/app-regressao/'
└─ src/
   ├─ main.tsx, App.tsx
   ├─ lib/                          # ZERO React aqui — só matemática pura
   │  ├─ rng.ts                     # mulberry32 + normal(Box–Muller)
   │  ├─ simulate.ts                # gera amostra a partir dos parâmetros
   │  ├─ regression.ts              # ols, logLik, sigma2Mle, s2, sums
   │  ├─ fisher.ts                  # fisherInfo3x3, invert3x3, standardErrors
   │  ├─ ellipse.ts                 # elipse de confiança a partir de I⁻¹
   │  └─ *.test.ts
   ├─ components/                   # Slider, NumberReadout, Formula(KaTeX), Panel
   └─ modules/emv/                  # painéis A, B, C + estado do módulo
```

Regra dura: **`src/lib` não importa React nem nada de DOM.** É o que permite
testar a matemática e reaproveitá-la nos próximos módulos.

## 5. Roadmap — alinhado ao programa de MAE0350

Disciplina: **MAE0350 — Análise de Regressão** (IME-USP), Prof. Alexandre Galvão
Patriota. 4 créditos-aula + 1 crédito-trabalho, 90h. Bibliografia principal:
Montgomery, Peck & Vining (2021); Draper & Smith (2014); Weisberg (2013).

Cada módulo é uma pasta em `src/modules/` e uma aba na navegação, **numerada
como o programa da disciplina** — assim o aluno acha a tela pelo tópico da aula.
A `lib` cresce por acumulação, nunca por reescrita.

| Módulo | Tópico do programa | O que a tela faz |
|---|---|---|
| **M1** | 1. Regressão Linear Simples | EMV interativo (v1, §2): ℓ(θ), β̂, σ̂², informação de Fisher, erros-padrão |
| **M1b** | 1. (inferência) | distribuição amostral de β̂ por Monte Carlo, cobertura empírica de IC, teste `H₀: β₁ = 0` |
| **M2** | 2. Regressão Linear Múltipla | matriz `X`, `β̂ = (XᵀX)⁻¹Xᵀy`, projeção/chapéu `H`, tabela ANOVA (2.5) |
| **M2b** | 2.2–2.4 | regressão polinomial, variáveis binárias (mudança de intercepto vs de inclinação) e segmentada com nó arrastável |
| **M3** | 3. Métodos de Diagnóstico | resíduos vs ajustados, QQ-plot, alavancagem `hᵢᵢ`, DFFITS/DFBETAS, distância de Cook; **envelopes simulados** (3.3) e ponto arrastável que gira a reta |
| **M4** | 4. Seleção de Variáveis | todas as regressões possíveis num painel de `Cp`/`AIC`/`R²aj`, métodos sequenciais passo a passo, custo da seleção pós-hoc |
| **M5** | 5. Transformação de Variáveis | família Box–Cox com λ deslizante, efeito simultâneo em ajuste e resíduos |
| **M6** | 6. Multicolinearidade | correlação entre preditores controlável, VIF, **ridge** com traço de `λ`, componentes principais |
| **M7** | 7. Regressão Heterocedástica | σ² função de `x`, MQ ponderados vs ordinários, modelagem dupla (média e dispersão) |
| **M8** | 8. Tópicos Especiais | bootstrap vs assintótico lado a lado, regressão robusta sob outliers, ajuste aditivo/suavização |
| **M9** | — | colar CSV e rodar o ferramental dos módulos anteriores em dados reais |

Ordem sugerida de construção: **M1 → M3 → M2 → M1b → M6 → M7 → M5 → M4 → M8**.
M3 vem cedo porque diagnóstico é onde a visualização rende mais por hora de
trabalho, e o ferramental (resíduos, alavancagem) já é reaproveitável.

## 6. Critérios de qualidade

- Interação a 60fps com `n = 500` (heatmap recalculado com `requestAnimationFrame`
  e memoizado por `(n, semente, params)`).
- Funciona em celular (a turma vai abrir no celular na aula).
- `npm run typecheck` e `npm test` verdes.
- Nenhum número na tela sem rótulo e sem símbolo correspondente à fórmula.

## 7. Riscos e cuidados

1. **`base` do Vite errado** → página em branco no Pages. Verificar no deploy.
2. **Confundir σ̂²_EMV com s²** — o app deve mostrar *os dois* e explicar; é
   justamente um ponto onde a turma tropeça.
3. **Escala de ℓ**: a log-verossimilhança fica muito negativa; o heatmap deve
   plotar `ℓ − ℓ_máx` (deviance) para ter contraste.
4. **Escopo do roadmap**: o §5 cobre o programa inteiro da disciplina. Não é
   um compromisso de construir tudo — é o mapa para que cada módulo novo caiba
   sem reescrever a `lib`. A v1 é só o M1.

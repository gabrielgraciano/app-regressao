# App de Simulação e Aprendizado de Regressão

Site estático (sem backend) para **simular e entender regressão linear simples**:
o aluno mexe nos parâmetros, arrasta a reta candidata e vê a log-verossimilhança,
os estimadores de máxima verossimilhança (EMV), a informação de Fisher e os
erros-padrão mudarem em tempo real.

Material de estudo da disciplina **MAE0350 — Análise de Regressão** (IME-USP).

**Site publicado:** https://gabrielgraciano.github.io/app-regressao/

## Como rodar localmente

```bash
npm i
npm run dev
```

Outros comandos:

| Comando             | O que faz                                |
| ------------------- | ---------------------------------------- |
| `npm run build`     | gera o site estático em `dist/`          |
| `npm run preview`   | serve o `dist/` localmente               |
| `npm run typecheck` | checagem de tipos (`tsc -b --noEmit`)    |
| `npm test`          | testes das fórmulas (`vitest run`)       |

## Estrutura

- `src/lib/` — **matemática pura** (sem React, sem DOM): PRNG com semente,
  simulação, mínimos quadrados / EMV, informação de Fisher, elipse de confiança.
- `src/components/` — componentes reutilizáveis (`Slider`, `Panel`, `Formula`,
  `Readout`).
- `src/modules/emv/` — o módulo M1: painéis A (dispersão), B (superfície de ℓ)
  e C (perfil em σ²).
- `docs/` — [plano de engenharia](docs/PLANO.md), [tarefas](docs/AGENTE-OPERACIONAL.md)
  e [guia de publicação](docs/PUBLICACAO.md).

## Publicação

O deploy é automático: todo push na branch `main` dispara
`.github/workflows/deploy.yml`, que roda `typecheck`, testes e build e publica o
`dist/` no GitHub Pages. Há também `.github/workflows/ci.yml`, que roda a mesma
verificação em Pull Requests e em pushes das branches `claude/**`.

Passo manual, que **só o dono do repositório pode fazer** (uma única vez):

> Em **Settings → Pages → Build and deployment → Source**, selecionar
> **GitHub Actions**. Sem isso o deploy falha com "Pages não habilitado"
> (_"Get Pages site failed" / "Not Found"_).

O repositório também precisa ser **público** (GitHub Pages em repositório
privado exige plano pago).

Detalhes e solução de problemas: [`docs/PUBLICACAO.md`](docs/PUBLICACAO.md).

> Atenção: o `base` do Vite é `'/app-regressao/'` (em `vite.config.ts`). Se o
> repositório for renomeado ou o site for para outro domínio, esse valor precisa
> mudar — senão a página publicada fica em branco.

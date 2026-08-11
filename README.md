# app-regressao

Aplicativo web de **simulação e aprendizado de regressão** — material de apoio
para a disciplina **MAE0350 (Análise de Regressão)**, IME-USP, e para colegas.

O primeiro módulo é uma visualização interativa do **estimador de máxima
verossimilhança (EMV)** na regressão linear simples: você simula os dados,
arrasta uma reta candidata e vê ao vivo a log-verossimilhança, o EMV analítico,
a matriz de informação de Fisher e os erros-padrão assintóticos.

## Estado

Em construção. Nesta fase o repositório contém apenas a especificação:

- [`docs/PLANO.md`](docs/PLANO.md) — arquitetura, decisões técnicas e roadmap
  alinhado ao programa da disciplina.
- [`docs/AGENTE-OPERACIONAL.md`](docs/AGENTE-OPERACIONAL.md) — tarefas da Sprint 1.
- [`docs/PUBLICACAO.md`](docs/PUBLICACAO.md) — passo a passo para pôr o site no ar.

## Publicação

O app será publicado como site estático em
`https://gabrielgraciano.github.io/app-regressao/` via GitHub Pages.

Três passos manuais do dono do repositório, detalhados em
[`docs/PUBLICACAO.md`](docs/PUBLICACAO.md): tornar o repositório público, criar
a branch `main` como padrão e apontar **Settings → Pages → Source** para
**GitHub Actions**.

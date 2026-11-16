[🇬🇧 English](#-english) | [🇫🇷 Français](#-français)

---

## 🇬🇧 English

# Contributing to Ollama Chat

> [!IMPORTANT]
> **This repository will no longer be maintained after its latest release.**
> For a more actively developed open-source alternative with MCP support, plugins and agents, check out [LibreChat](https://github.com/LibreChat-AI/LibreChat). Please consider contributing there instead.

## What this means

- New features are not planned, and issues or pull requests may not get an answer.
- You are welcome to **fork** the project and adapt it to your needs under the [MIT License](LICENSE).
- Security issues still follow the [security policy](SECURITY.md). Never report them in a public issue.

## If you still want to open a pull request

1. Fork the repository and create a branch from `master`.
2. Set up the project (see the [README](README.md#quick-start)):
   - Node.js 26+ and **pnpm 12**: `npm install -g pnpm@12` (corepack is no longer bundled with Node ≥ 25)
   - `pnpm install`, then `pnpm dev`
3. Use **pnpm** only, never npm or yarn, and commit `pnpm-lock.yaml` with any dependency change.
4. Before pushing, check that everything passes:
   ```bash
   pnpm lint
   pnpm test
   pnpm typecheck
   pnpm build
   ```
5. Keep the pull request small and focused, describe what it changes and why, and update the docs (`README.md` and `README_fr.md`) when behavior changes.
6. The CI (lint, tests, typecheck, build, CodeQL, Dependency Review, Trivy) must be green.

## Conventions

- **Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Mongoose 9. See [`AGENTS.md`](AGENTS.md) for the project structure and conventions.
- **Tests**: Vitest + Testing Library in `tests/`. Add or update tests for any code change.
- **Commits**: short imperative messages, optionally prefixed, e.g. `[FIX] CI - ...`.

---

## 🇫🇷 Français

# Contribuer à Ollama Chat

> [!IMPORTANT]
> **Ce dépôt ne sera plus maintenu après sa dernière release.**
> Pour une alternative open source plus développée, avec la prise en charge de MCP, des plugins et des agents, consultez [LibreChat](https://github.com/LibreChat-AI/LibreChat). Pensez plutôt à contribuer à ce projet.

## Ce que cela implique

- Aucune nouvelle fonctionnalité n'est prévue, et les issues ou pull requests peuvent rester sans réponse.
- Vous pouvez **forker** le projet et l'adapter à vos besoins, sous [licence MIT](LICENSE).
- Les problèmes de sécurité suivent toujours la [politique de sécurité](SECURITY.md). Ne les signalez jamais dans une issue publique.

## Si vous souhaitez tout de même ouvrir une pull request

1. Forkez le dépôt et créez une branche à partir de `master`.
2. Installez le projet (voir le [README](README_fr.md#démarrage-rapide)) :
   - Node.js 26+ et **pnpm 12** : `npm install -g pnpm@12` (corepack n'est plus fourni avec Node ≥ 25)
   - `pnpm install`, puis `pnpm dev`
3. Utilisez uniquement **pnpm**, jamais npm ni yarn, et commitez `pnpm-lock.yaml` avec tout changement de dépendance.
4. Avant de pousser, vérifiez que tout passe :
   ```bash
   pnpm lint
   pnpm test
   pnpm typecheck
   pnpm build
   ```
5. Gardez la pull request petite et ciblée, décrivez ce qu'elle change et pourquoi, et mettez à jour la documentation (`README.md` et `README_fr.md`) quand le comportement change.
6. La CI (lint, tests, typecheck, build, CodeQL, Dependency Review, Trivy) doit être verte.

## Conventions

- **Stack** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Mongoose 9. Voir [`AGENTS.md`](AGENTS.md) pour la structure et les conventions du projet.
- **Tests** : Vitest + Testing Library dans `tests/`. Ajoutez ou mettez à jour les tests pour toute modification de code.
- **Commits** : messages courts à l'impératif, avec un préfixe optionnel, par exemple `[FIX] CI - ...`.

# AGENTS.md — baxyz `baxyz`

This repository inherits the [canonical workspace rules](https://github.com/baxyz/.dev/blob/main/AGENTS.md). Only project-specific details are documented here.

## Scope

The profile README of the `baxyz` GitHub account (a repository named after the user is what github.com/baxyz displays).
It is a one-sheet version of <https://baxyz.dev>: same blueprint look, and every section links to the matching page.

## License

AGPL-3.0-only, the workspace default.

## Commit Scopes

Defined in `scopes.json`: `profile`, `assets`, `docs`, `ai`, `ci`, `deps`.

## Structure

```text
README.md            ← the profile: numbered sections, each linking to baxyz.dev
assets/*.svg         ← generated; dark and light variant of every visual (header, 5 project cards, a Contribute card, footer)
scripts/build.mjs    ← generates assets/ (no dependencies): node scripts/build.mjs
```

## Rules

- Same palette as baxyz.dev (blueprint dark, paper light); the SVGs come in pairs and are picked with `<picture>`.
- Never edit `assets/*.svg` by hand: change `scripts/build.mjs` and regenerate. The REV stamp is the current month.
- Only the first name (Bérenger) appears: no family name, no personal portfolio link. Same rule as baxyz.dev.
- Content follows `site-dev-baxyz` (`src/data/`): update both when a project or a status changes.
- Text inside SVGs is not selectable: every image has a meaningful `alt` and the same information stays in the README text.

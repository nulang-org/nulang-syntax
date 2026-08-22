# Nulang Syntax

TextMate grammar for the [Nulang](https://github.com/nulang-org/nulang)
programming language (`.nula` files).

Scope name: `source.nulang`

## Usage

- **VS Code** — consumed as an npm dependency by the
  [Nulang extension](https://github.com/nulang-org/nulang/tree/main/editors/vscode).
- **GitHub** — submitted to `github/linguist` so `.nula` files get syntax
  highlighting and language statistics on github.com.
- **Other editors** — any TextMate-compatible editor (Sublime Text, TextMate,
  Zed, …) can load `syntaxes/nulang.tmLanguage.json` directly.

## Contents

- `syntaxes/nulang.tmLanguage.json` — the grammar (keywords, reference
  capabilities, types, effects, actors/behaviors, strings, chars, comments,
  numbers, operators, `@annotations`).

## Development

The grammar is generated from the language spec (`spec/grammar.ebnf` in the
main Nulang repo). Keep it in sync with the Frozen Core and Stable tiers of
the spec when the language changes.

## License

Apache-2.0 — see [LICENSE](./LICENSE).

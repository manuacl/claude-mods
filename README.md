# claude-mods

Personal [Claude Code mods](https://code.claude.com/docs/en/plugins). Needs Claude Code 2.1.287 or later.

| Mod | What it does |
| --- | --- |
| [`otto-hud`](plugins/otto-hud) | Otto, a blue octopus, forecasts your context window above the prompt, in the Claude Code desktop app; the terminal gets the same line in text. |

```sh
claude plugin marketplace add manuacl/claude-mods
claude plugin install otto-hud@claude-mods
```

Try one for a session without installing, from a clone: `claude --plugin-dir plugins/otto-hud`.

Checks: `bash scripts/check.sh` (validates the marketplace and every mod, and runs their tests).

License: Apache-2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE), except Otto, the octopus of otto-hud, whose rights are reserved: see [OTTO-LICENSE](plugins/otto-hud/OTTO-LICENSE).

Like Otto? [Buy me a coffee on Ko-fi](https://ko-fi.com/manuel7882).

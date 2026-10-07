# Superscalar Bench — aim key images

One key image per aim, made so that a glance tells which *kind* of coding task the aim is. They depict the shape of each task, never its specifics — the tasks and their hidden suites are unpublished.

| file | aim |
|---|---|
| `aim1.png` | mechanical edit across many files |
| `aim2.png` | build from a complete specification |
| `aim3.png` | add a feature and migrate stored data |
| `aim4.png` | diagnose and fix from a symptom report |
| `aim5.png` | design and build a small language interpreter |
| `aim6.png` | crash-safe transactional store |

## How they were made

- **Generator**: Codex CLI 0.160.1, `codex exec` with the CLI's built-in image tool (the ChatGPT-plan path that needs no API key; the API-key fallback was not used). Generated 2026-10-07, one session per image.
- **Prompts**: [`prompts/style.txt`](prompts/style.txt) (the shared style block) + one subject per aim in [`prompts/aims.json`](prompts/aims.json). Each request asked for one image with no text, letters, numbers or logos — text inside generated images tends to break, and the labels must exist in two languages.
- **Checks on every output**: a new file in that session's own output folder (located by the session id, not by «newest file»), a PNG signature, a square size and a minimum byte size. Originals are 1254 × 1254; the files here are high-quality downscales to 600 × 600.
- **Not deterministic**: rerunning the prompts gives similar, not identical, images.

## The guide sheets

`../trust-cost-aims-en.png` and `../trust-cost-aims-ko.png` assemble the six images into one page. Everything except the pictures — titles, aim numbers, task names, test counts and the rising ladder — is drawn by code, so both languages share the same pictures. The ladder is the **designed** order of difficulty; what was measured, including where it is not a smooth rise, is in [SuperscalarBench.md](../../../../SuperscalarBench.md).

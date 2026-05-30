# Proposal 002 — Repo Residency and `.agent/` Folder Shape

> The seed should decide where agent/developer operation docs live before it decides which `.agent/` folders to scaffold. The default remains a flat `.agent/` in the current project, but public/collaboration repos, sidecar agent-docs repos, multi-project orchestration, and upstream-bound work need named shapes.

## Why this is needed

The original v1.5 draft focused on library/host layouts. Review showed that the first branch must be more general:

- The current working folder may be a real source repo.
- It may be a private agent-docs-only repo for a public or collaboration source repo.
- It may be a coordinator repo that operates several independent project repos.
- It may contain work that should first land in an upstream repo the developer owns or can update.

If the seed assumes one flat `.agent/` too early, private agent notes can leak into public repos, workspace-limited agents can be pointed at inaccessible paths, and upstream-bound work can be misclassified as local-only.

## Bootstrap decision tree

Run this before Phase 3 scaffolding.

```
Q0. Which bootstrap style should be used?
    Minimal bootstrap (recommended) → inspect folder/git/remotes and ask only if ambiguous.
    Full manual setup → ask every residency/source/upstream question.
    Repo provider assisted setup → infer from provider/local git/repo list, then continue.

Q1. Is the current folder empty, seed-only, or not yet a concrete project?
    No → Q4.
    Yes → Q2.

Q2. Is this folder intended to be a developer/agent-docs-only repo?
    No → use Scenario 1 unless later answers say otherwise.
    Yes → Q3.

Q3. Where is the source project?
    Already under this working folder → verify path; if separate source repo, add to root .gitignore unless submodule/gitlink.
    Another local path → warn workspace-limited agents may not access it; user may need to move/link it under workspace.
    Remote-only → create source-map.md and clone/link only if user requests.
    Not created yet → bootstrap source project separately or create an empty source folder under user direction.

Q4. Does one agent-docs repo operate multiple independent project repos?
    No → Q5.
    Yes → ask whether to use .agent/<unit-project-name>/ per project (Scenario 3).

Q5. Does this work have an upstream repo that the developer operates or can update,
    and are upstream-bound changes first implemented here?
    No → Scenario 1 or 2, depending on residency.
    Yes → apply upstream split inside the chosen scope (Scenario 4).
```

Provider-assisted setup can use GitHub, GitLab, Bitbucket, Azure DevOps, Gitea/Forgejo/self-hosted Git, local git remotes, or a user-provided repo list. Do not request passwords or raw tokens in chat.

## Scenario 1 — Single project, agent docs live in the source repo (default)

```
.agent/
├── README.md
├── rules.md
├── architecture.md
├── _lessons/
├── PM/
└── ...
```

This remains the default. Most projects should stay here. Do not introduce `project/`, `upstream/`, or `<unit-project-name>/` folders unless a later scenario applies.

## Scenario 2 — Agent-docs-only sidecar repo for one source project

Use when the source repo is public, shared with external collaborators, owned by another organization, or otherwise not the right place for private agent/developer operation docs.

```
agent-docs-repo/
├── .gitignore
└── .agent/
    ├── README.md
    ├── source-map.md
    ├── public-boundary.md       (or style-guide.md)
    ├── rules.md
    ├── architecture.md
    ├── _lessons/
    ├── PM/
    └── ...
```

If the source project is placed or linked under this repo, add the source folder path to the root `.gitignore` only after the user identifies the folder and the agent verifies it exists. Do not guess paths. Do not ignore submodules/gitlinks.

`source-map.md` records:

- source repo URL or local path
- branch / checkout path
- current source commit when relevant
- access limitations by agent/tool
- whether the source is public, private, collaboration-owned, or remote-only

`public-boundary.md` or `style-guide.md` records what cannot cross from private agent docs into public/collaboration docs.

## Scenario 3 — Multi-project orchestration repo

Use when a single agent-docs repo operates multiple independent project repos. This is for units more independent than FE/BE role folders: each unit project may already contain its own FE+BE stack and has meaningful autonomy.

```
.agent/
├── orchestration/
│   ├── README.md
│   └── cross-project-map.md
├── <unit-project-name-a>/
│   ├── source-map.md
│   ├── rules.md
│   ├── architecture.md
│   ├── PM/
│   └── _lessons/
└── <unit-project-name-b>/
    ├── source-map.md
    ├── rules.md
    ├── architecture.md
    ├── PM/
    └── _lessons/
```

The seed should ask whether to use `.agent/<unit-project-name>/` only when multi-project orchestration applies. Do not use this shape merely because one project has Frontend and Backend roles; those are lower-level role folders inside a project scope.

## Scenario 4 — Upstream split inside a chosen scope

Use when the developer operates or can update an upstream repo, and the current project is where upstream-bound changes are first implemented or tested. This is not upstream-specific.

Default folder name:

```
<scope-root>/
├── upstream/
│   ├── README.md
│   ├── architecture.md
│   ├── review/
│   └── roadmap/
└── project/
    ├── README.md
    ├── upstream-vs-local.md
    ├── style-guide.md
    ├── adaptation-map.md
    ├── PM/
    └── _lessons/
```

The default upstream folder is `upstream/`. If the user explicitly names the upstream (`estreui`, `payments-sdk`, `internal-platform`, etc.), use that name instead:

```
<scope-root>/
├── <upstream-name>/
└── project/
```

For an ordinary single-project repo, `<scope-root>` is `.agent/`. For a multi-project orchestration repo, `<scope-root>` is `.agent/<unit-project-name>/`.

The previously proposed `.agent/estreui/` + `.agent/project/` layout becomes one named instance of this generic upstream split, not the default for all projects.

## Workspace access rule

If the source project is outside the current workspace:

- Workspace-limited agents such as Antigravity IDE or GitHub Copilot may not access it. Tell the user to move or link the source project under the workspace if that agent must work on it.
- Claude Code and Codex may access external paths, but the agent must verify read/write access before treating the path as usable.

## Mount in the seed body

Add this as a Phase 3 prelude or as a new section immediately before Phase 3:

1. Choose bootstrap style.
2. Decide repo residency and source location.
3. Decide whether multi-project orchestration applies.
4. Decide whether upstream split applies.
5. Scaffold the selected `.agent/` shape.

Migration Guides should link here when an existing repo has scattered agent notes, private docs in a public repo, or a source/agent-docs split that needs preserving.

## Catalog rows added or clarified

- **Row H** — `source-map.md` for sidecar or multi-project source location.
- **Row I** — `public-boundary.md` / `style-guide.md` for public/private sanitization.
- **Row J** — `.gitignore` guard for source folders placed under an agent-docs repo.
- **Row K** — `.agent/<unit-project-name>/` multi-project scope folders.
- **Row L** — `upstream/` + `project/` split, with user-provided upstream name allowed.
- **Row M** — `upstream-vs-local.md` classifier.
- **Row N** — mirror sync policy for upstream docs/files copied into the agent-docs scope.

## Real adoption case

An upstream-adopting host project uses the upstream split with a user-named upstream folder: `.agent/estreui/` plus `.agent/project/`. That is a concrete case, not the general default. Generic projects should use `.agent/upstream/` unless the user chooses a clearer upstream name.

## Reverse references

- upstream split case: bundle author's private host project plus public upstream repo context.
- Sidecar repo and workspace-boundary cases: seed maintainer review of this bundle, 2026-05-07.

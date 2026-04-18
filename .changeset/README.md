# Changesets

- **Draft from git:** `pnpm changeset:from-git` (optional `--since <ref>`, `--bump patch|minor|major`, `--max N`). Writes `.changeset/git-<id>.md` from commit subjects. Review before commit.
- **Interactive wizard:** `pnpm exec changeset`.

`CHANGELOG.md` is updated **automatically** when versions are applied (`changeset version` / version PR), not by the git script. See [CONTRIBUTING.md](../CONTRIBUTING.md).

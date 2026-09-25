---
"@pnpm/resolving.npm-resolver": patch
"pnpm": patch
"pacquet": patch
---

When an offline install fails because a package's metadata is missing from the cache, pnpm now checks whether an older pnpm version cached that package under the metadata directory's previous name. If it did, the error names that file and says to run the install once without `--offline` [#15656](https://github.com/pnpm/pnpm/issues/15656).

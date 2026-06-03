---
name: audit
description: >
  Project convention + security audit for dld-native. Sweeps the codebase against the
  AGENTS.md rules (services, styling, RN rules, state machines, component structure) and a
  security/risk checklist, then reports findings grouped by topic and asks per-topic whether
  to fix. Use when the user says "audit", "audit the project", "convention check", "pattern
  sweep", "security review", "check conventions", or invokes /audit.
---

# Project Audit — dld-native

Run a repeatable convention + security sweep of this repo, report findings, then ask the user
**per topic** whether to fix. Default is **report-only** — never edit code until the user picks
topics to fix.

## How to run

1. **Sweep** — run the checks below (each has a concrete `rg` command). Use `rg` from the repo
   root. Read the matched lines before judging; not every match is a violation (e.g. `supabase.auth.*`
   is allowed; allowed `StyleSheet` exceptions exist).
2. **Report** — print findings grouped by topic, severity-tagged, one line each:
   `path:line: <emoji> <severity>: <problem>. <fix>.`
   Severity: `🔴` high · `🟡` medium · `🔵` low.
   **Always end with a risk-comparison table** (not just a count line). One row per finding,
   comparing this run against the last recorded snapshot (the `AGENTS.md` "Known Risks" section).
   Columns: `Topic | Item | Severity | Last run | This run | Owner`, where **Last run / This run** is
   `🆕 new` · `open` · `✅ fixed` · `—` (n/a). `Owner` is `client` or `backend (dld-spb)`. This makes
   it obvious at a glance what changed (newly introduced, fixed since last audit, or still open).
   On a re-run with no changes, every row reads `open → open`. After fixes, the fixed rows read
   `open → ✅ fixed`.
3. **Ask to fix** — call `AskUserQuestion` with a multiSelect of the topics that have findings
   ("which topics should I fix?"). Only after the user picks do you edit code, one topic at a time.
   Re-run the relevant check after fixing to confirm.
   **One commit per topic — never one big commit for all fixes.** After each topic's fixes pass
   verification, commit that topic alone (stage only the files you touched for it) before starting
   the next. This keeps each topic independently revertable. Branch off the default branch first if
   on it. Use a clear scoped message per topic (e.g. `refactor(inbound): …`, `fix(auth): …`).
4. **Backend items** (RLS, edge-function error sanitizing, `get-user-profile` endpoint) live in the
   sibling `dld-spb` repo — **flag them, don't fix here.** Say so in the report.
5. **Update documentation (always — final step, even if nothing was fixed).** Before finishing, bring
   the repo's docs in sync with the post-fix reality:
   - **`AGENTS.md` "Known Risks / Tech Debt"** — remove every item you fixed; keep unfixed/backend
     items; refresh the "What's clean" line and the snapshot date. This is the canonical risk list.
   - **`AGENTS.md` "Project Status" / "Epic Documentation" tables** — update any status cell a fix
     changed (e.g. a 🟡 becoming ✅).
   - **Relevant `docs/<epic>.md`** — if a fix changed an epic's implemented logic, update that epic
     doc (epic docs describe *current logic only*). Match the fix to its epic via the table in
     `AGENTS.md`.
   Commit the doc updates **separately** as `docs: sync after audit fixes` (do not fold them into a
   topic's code commit) — unless `AGENTS.md`/the doc already has unrelated uncommitted edits, in which
   case make the edits but leave them unstaged and say so in the report. If nothing was fixed, still
   verify the docs match the current sweep and note any drift.

## Checklist — Conventions (from AGENTS.md)

**C1. Services — no direct table/RPC access in the client.** Only `supabase.auth.*` is allowed; all
data goes through `/functions/v1/<fn>` from `lib/services/`.
```
rg -nU "supabase[\s\n]*\.(from|rpc)\(" lib app components   # -U: the call may be split across lines
rg -n "\.(from|rpc)\(" lib app components                   # widen, then ignore Array.from / Object.* false positives
rg -n "fetch\(" app components                              # inline fetch outside lib/services/ is a violation
```
Known: `lib/services/user.ts:16` uses `supabase.from("user")` (chained onto `await supabase` on the line above, so a single-line regex misses it) → 🟡.

**C2. Styling — NativeWind only; no raw hex; no stray StyleSheet.** Allowed `StyleSheet`/inline-style
exceptions: `rgba()/hsla()`, `position:"absolute"` w/ computed px, `Dimensions`, `StyleSheet.hairlineWidth`,
Reanimated animated styles, iOS shadow props.
```
rg -n "StyleSheet\.create" app components
rg -n "#[0-9a-fA-F]{3,8}\b" app components --glob '!**/*.test.*'   # raw hex in component code
```
Colors belong in `tailwind.config.js`; use `className` or `getColor()` from `@/lib/color`.

**C3. React Native rules.**
```
rg -n "TouchableOpacity|TouchableHighlight" app components         # banned — Pressable only
rg -n "\{[a-zA-Z0-9_.]+ && <" app components                      # candidate falsy && in JSX
rg -n "top:|left:|width:|height:" app components                  # check none are inside useAnimatedStyle
```
- `FlatList` for dynamic lists; `ScrollView`+`.map()` only for short static content (≤ ~8 items).
- No component functions defined inside other components (module-level only).
- `{count && <X/>}` crashes when `count===0` — only numeric/string-falsy operands are bugs; booleans/null are fine.
- Inside `useAnimatedStyle`, animate `transform`/`opacity` only — never layout props.

**C4. State machines.** Multi-step async flows use `useReducer` + a discriminated-union state type
(see `app/scanner-modal.tsx`, `lib/inbound-reducer.ts`). Flag any multi-step flow built from a tangle
of `useState` booleans instead.

**C5. Component structure.** Feature components live under `components/<feature>/` with co-located
`types.ts` + `constants.ts`.
```
for d in components/*/; do ls "$d" | rg -q '^types\.ts$' || echo "missing types.ts: $d"; ls "$d" | rg -q '^constants\.ts$' || echo "missing constants.ts: $d"; done
```
Known: `components/inbound/` has no `constants.ts` (`EXPIRY_RE` inline in `LineEditor.tsx`) → 🔵.
(Single-component dirs like `auth/`, `dashboard/` don't need both — judge by whether constants/types exist inline.)

**C6. Tests mirror `lib/`.** Tests live under `__tests__/` mirroring `lib/`.
```
rg --files lib | rg '\.ts$'; rg --files __tests__
```

## Checklist — Security / Risk

**S1. Secrets.** Only the publishable/anon key in the client; `service_role` must never appear; `.env`
gitignored.
```
rg -n "service_role|SERVICE_ROLE|SUPABASE_SERVICE" .
rg -n "EXPO_PUBLIC_SUPABASE" lib                  # confirm anon key only
rg -n "^\.env$" .gitignore
```

**S2. Session storage.** `lib/supabase/client.ts` should not persist tokens in plain `AsyncStorage`;
prefer `expo-secure-store` (installed).
```
rg -n "AsyncStorage|expo-secure-store|SecureStore" lib/supabase
```
Known: uses `AsyncStorage` → 🟡.

**S3. RLS reminder.** Manual — RLS is stub-only (`qual = true`) in `dld-spb`. Client branch params are
not a security boundary. Always report as 🔴 until the backend confirms enforcement.

**S4. Input handling.** Edge-fn URL params go through `URLSearchParams` (auto-encoded) — confirm no
manual string concatenation into URLs/queries; backend should validate length/format.
```
rg -n "searchParams\.set|new URL\(" lib/services
```

**S5. Error leakage + swallowed errors.**
```
rg -n "res\.statusText|err\.error|e\.message" lib/services       # raw backend text → UI
rg -n "catch\(\(\) => \{\}\)|catch\(\(\) => \(\{\}\)\)" app components lib   # silent swallow
```

**S6. Logging of secrets/PII.**
```
rg -n "console\.(log|warn|error)" app components lib | rg -i "token|session|password|email|auth"
```

**S7. Dev/mock code in prod path.**
```
rg -n "MOCK_|mock|__DEV__|simulate" app components lib
```
Known: `app/scanner-modal.tsx` `MOCK_SCAN_ITEMS` + simulate button not behind `__DEV__` → 🔵.

## Checklist — Hygiene

```
rg -n "TODO|FIXME|HACK|XXX" app components lib
rg -n "^\s*//.*\b(import|const|function|return)\b" app components lib   # commented-out code blocks
```

## Report format example

```
## Audit — dld-native (<date>)

### Conventions
lib/services/user.ts:14: 🟡 services: direct supabase.from("user") read. Move to a get-user-profile edge fn.
components/inbound/: 🔵 structure: no constants.ts (EXPIRY_RE inline in LineEditor.tsx). Extract to constants.ts.

### Security
(backend, dld-spb) 🔴 rls: policies open (qual=true), no branch-scoping. Enforce in dld-spb.
lib/supabase/client.ts:10: 🟡 session: tokens in AsyncStorage (unencrypted). Use expo-secure-store adapter.
...

### Risk comparison
| Topic       | Item                          | Severity | Last run | This run | Owner            |
| ----------- | ----------------------------- | -------- | -------- | -------- | ---------------- |
| Conventions | user.ts direct supabase.from  | 🟡       | open     | open     | backend (dld-spb)|
| Conventions | inbound EXPIRY_RE inline      | 🔵       | open     | ✅ fixed | client           |
| Security    | RLS stub (qual=true)          | 🔴       | open     | open     | backend (dld-spb)|
| Security    | session in AsyncStorage       | 🟡       | open     | ✅ fixed | client           |
| Hygiene     | (none)                        | —        | —        | —        | —                |

Topics with findings: Conventions (2), Security (4), Hygiene (0).
```

Then: `AskUserQuestion` — "Which topics should I fix now?" (multiSelect: Conventions / Security-client / Hygiene; note backend items can't be fixed here). Fix only the chosen topics, **one commit per topic** (not one combined commit) so each is independently revertable.

Finally (step 5), always **sync the docs** — update `AGENTS.md` (Known Risks, Project Status/Epic tables, "What's clean", snapshot date) and any affected `docs/<epic>.md` to match the post-fix state, committed separately as `docs: sync after audit fixes`.

# Development workflow

How AI agents and the human maintainer collaborate on this repository.
Complements the root `AGENTS.md` rules (especially: agents never commit, never
deploy).

This is a public content site with a lean process: reversible deploys, no SLA,
and the manual deploy is the main quality gate. The process is sized for that:
the default path from idea to commit is **one agent, one pass, one human
scan**. Outside contributions arrive as GitHub pull requests and go through the
same human scan before commit.

## The loop

1. **Build.** One agent implements the task (scope from
   [plan.md](plan.md)), runs the repo's checks (`pnpm check` and `pnpm build`
   once the toolchain lands in M1; see the README for the current commands),
   and ends with a short note: what changed, what was verified.
2. **Commit.** The human scans the note and the diff at whatever depth the
   change warrants, and commits. Agents never commit.
3. **Deploy.** The human runs the deploy script when a set of commits is ready
   to publish. Agents never deploy.

That is the whole gate. There are no mandatory review passes, no multi-agent
review structure, and no verification-of-the-verification.

## Ground rules

- **Agents never commit or deploy** — even if a prompt asks. The working tree
  is the handoff.
- **Don't hand off broken.** Checks pass before you end your turn; if they
  don't, say so plainly instead of papering over it.
- **One stream of work at a time.** Check `git status` first; if there are
  changes you didn't make, you're iterating on in-flight work, not starting
  fresh.
- **Scratch files stay out of the tree.**
- **Fix the docs the change makes wrong** (status paragraph, plan checkbox,
  affected doc, a service's working docs) in the same change. Nothing more is
  owed.
- **Service content is cited and dated.** A change to a service claim carries
  its source URL and bumps the page's last-verified date.

## Reviews happen on demand, not by default

The human asks for a review when a change warrants one. When asked:

- One agent, one pass, over the whole uncommitted diff.
- Hunt real defects — broken build, broken links, wrong or uncited service
  claims, accessibility regressions, security — not style, ceremony, or
  missing log entries.
- Findings are file:line claims ranked by severity. A clean review is a valid
  result.
- Fix what you find directly unless the human asked for a report only.

## When to go heavy

Some changes carry real blast radius: anything that changes the deploy script
(an rsync `--delete` pointed at the wrong path destroys the live site), the
URL structure of published pages, or the content schema every service depends
on. For those the human may explicitly ask for the heavyweight treatment —
multi-agent review, an adversarial challenge pass, fix/verify rounds. That
escalation is the human's call to make; agents don't self-escalate beyond one
pass.

# Project Soul

## Core Principles

- Observability first: every animation maps to a derived event.
- Resilience over schema lock-in: unknown event shapes should still produce meaningful visuals.
- Demo reliability: simulator mode and replay controls must always be available.
- Actionable insight: scorecard and stuck interventions should guide operator decisions.

## Judging Alignment

Everything in this project should map to the official judging criteria:

1. Clarity of idea
- UI must explain "what is happening now" within 5 seconds.
- Labels and captions should use plain language over protocol jargon.

2. Technical execution
- Live Codex app-server integration must be visible and verifiable.
- Fail-fast behavior should be explicit so operators trust runtime status.

3. Completeness
- End-to-end flow should work: ingest -> derive -> visualize -> inspect -> replay.
- Simulator and replay are mandatory reliability paths for stage demos.

4. Impact and insight
- Dashboard must not only display activity, but recommend next interventions.
- Stuck detection and scorecard should support real operator decisions.

5. Use of Codex
- Demo must clearly show Codex-driven events, not synthetic-only behavior.
- Raw event inspector should make Codex signal provenance obvious.

## Singapore Pixel Theme

Visual anchors:

- Merlion HQ at center
- Marina Bay water tiles
- Districts: CBD, Bugis, Jurong, Changi

District semantics:

- `Bugis` for frontend paths
- `Jurong` for infra paths
- `Changi` for tests paths
- `CBD` for everything else

Animation language:

- Tool activity sends vehicles from HQ
- File changes grow district buildings by touch level
- Errors trigger red beacon and smoke
- Success triggers fireworks near Marina
- Stuck score high adds haze and construction stalled sign

## Character Guidance

### Auntie Debug

Trigger:

- repeated error signatures
- high stuck score

Lines:

- "Aiya, same error again."
- "Show logs first lah."
- "Scope too big, break down can?"

### Uncle Ops

Trigger:

- infra-heavy failures

Line:

- "Check env and configs."

### MRT Controller

Trigger:

- sustained tool activity burst

Line:

- "Train running, agent busy."

## UX Tone

- Fast read in under 5 seconds
- Dev-friendly humor without noise
- Keep labels explicit so judges can follow quickly

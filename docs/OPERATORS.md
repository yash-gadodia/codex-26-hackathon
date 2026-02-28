# Operator Runbook

## Problem

Live coding-agent sessions are noisy. Teams can usually see output logs, but still struggle to answer quickly:

- what the agent is doing right now
- where effort is going
- whether progress is healthy or stuck

## Solution

WIMUT converts live Codex app-server notifications into a visual control tower with:

- run lanes and live status
- timeline + raw event inspector
- scorecard + stuck detection
- replay/simulator fallback paths

## Core Runtime Signals

The dashboard tracks:

- duration
- tool activity
- file changes
- error and success counts
- stuck score from repeated-failure and inactivity heuristics

## Technical One-Liner

`relay.mjs` runs `codex app-server` (`initialize -> thread/start -> turn/start`), streams notifications to `ws://localhost:8787`, and the frontend maps those events into stable operational signals.

## Local Operator Flow

1. Start UI: `npm run dev`
2. Start helper (optional): `npm run helper`
3. Start relay: `node relay.mjs --repo <path> --prompt "..."`
4. Open `http://localhost:8788`
5. Confirm websocket status is `connected`
6. Inspect a timeline event and compare raw payload vs derived meaning
7. Use scorecard + intervention text to decide whether to continue, redirect, or stop

## Multi-Agent Stress Flow

For concurrent local testing:

1. Start swarm: `npm run swarm -- --repo <path> --count 4 --port 8899 --continuous true`
2. Open `http://localhost:8788/?ws=ws://localhost:8899`
3. Track lane-level differences in error rates, file activity, and stuck score

## Calm Judge Mode

When the live stream is noisy, use the in-UI calm simulation:

1. Click `Sim calm swarm`
2. Observe one primary active agent per cycle across 5 lanes
3. Use this view to explain phase progression and intervention logic clearly

This mode prioritizes clarity and completeness for judges while preserving visible Codex-style behavior.

## Criteria Mapping

1. Clarity of idea
- Calm swarm keeps activity readable in under 5 seconds.

2. Technical execution
- Live relay/app-server path remains available; calm simulation is a fallback narrative path.

3. Completeness
- Lanes, timeline, scorecard, inspector, and replay remain demonstrable.

4. Impact and insight
- Stuck score/intervention remain visible without visual overload.

5. Use of Codex
- Prefer live mode when available; use calm simulation only when event density harms comprehension.

## Scope Guardrails

- Input source is Codex app-server notifications relayed to websocket
- Unknown event shapes should still produce understandable UI behavior
- Prefer fail-fast error states over silent degraded behavior

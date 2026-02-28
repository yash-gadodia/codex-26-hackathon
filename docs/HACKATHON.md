# Hackathon Brief

## Problem

Live coding-agent sessions are hard to parse under pressure. Judges and teams need to quickly understand:

- what the agent is doing now
- whether progress is healthy or stuck
- where intervention is needed

## Solution

WIMUT converts Codex runtime signals into a visual control tower with run lanes, timeline, scorecard, and replay.

## Judging Criteria

1. Clarity of idea
2. Technical execution
3. Completeness
4. Impact and insight
5. Use of Codex

## Criteria to Feature Mapping

1. Clarity of idea
- Story panel + calm lane simulation make activity understandable in under 5 seconds.

2. Technical execution
- `relay.mjs` uses Codex app-server (`initialize -> thread/start -> turn/start`) and streams to UI websocket.

3. Completeness
- Live mode, inspector, scorecard, replay, simulator, and optional git diff helper are all present.

4. Impact and insight
- Stuck score and intervention guidance support operator decisions.

5. Use of Codex
- Live mode uses Codex app-server notifications as primary runtime source.

## Demo Guidance

- Start with live mode when stable.
- If live stream is too noisy, use `Sim calm swarm` for a readable 5-agent walkthrough.
- Emphasize phase progression: planning -> editing -> testing -> reporting -> approval.

## Submission Requirements

Submissions close at **6:00 PM local time**.

Required deliverables:

1. Public GitHub repo
2. 2 minute video
3. Optional demo link

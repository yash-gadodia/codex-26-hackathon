# Agent Instructions For This Repo

This file defines delivery priorities for contributors and coding agents working on WIMUT.

## Mission

Build and maintain a live observability dashboard for Codex runs that is understandable, reliable in demos, and useful for intervention decisions.

## Product Quality Rubric

Every change should improve at least one of these criteria without harming the others:

1. Clarity
2. Technical execution
3. Completeness
4. Impact and insight
5. Runtime traceability

## Implementation Priorities

1. Protect live demo reliability first
- Keep simulator and replay working.
- Prefer fail-fast errors over silent broken states.

2. Preserve traceability from Codex to UI
- Keep raw event visibility in the inspector.
- Maintain clear mapping from incoming events to derived signals.

3. Keep the product narrative obvious
- "What is happening now" must remain instantly legible.
- Scorecard + intervention text must stay actionable, not decorative.

4. Avoid architecture drift during active development
- Prefer focused, reversible changes.
- Do not introduce large refactors unless they directly improve reliability or clarity.

## Definition of Done For Any Feature

- Works in live mode with Codex input.
- Works in fallback mode (simulator/replay).
- Does not reduce dashboard clarity.
- Includes a short reproducible local run/test flow.

## Required Delivery Behavior

- Always relate implementation decisions back to the product quality rubric.
- Prefer work that improves runtime certainty before work that expands scope.
- Keep documentation synchronized with runtime behavior after every major change.
- Treat broken live ingestion as priority-zero.

import test from "node:test";
import assert from "node:assert/strict";

import {
  computeDisplayLabel,
  deriveWorkflowHint,
  extractDeveloperName,
  extractFilePaths,
  extractThreadTitle,
  getRawEventTimestamp,
  mapCodexToVizEvents,
} from "../public/mapping.js";

test("getRawEventTimestamp handles unix seconds", () => {
  const ts = getRawEventTimestamp({ ts: 1735600000 });
  assert.equal(ts, 1735600000 * 1000);
});

test("extractFilePaths finds explicit and embedded paths", () => {
  const event = {
    params: {
      file: "src/app.ts",
      output: "updated docs/README.md and server.mjs",
    },
  };
  const files = extractFilePaths(event);
  assert(files.includes("src/app.ts"));
  assert(files.includes("docs/README.md"));
  assert(files.includes("server.mjs"));
});

test("mapCodexToVizEvents creates error event with critical attention", () => {
  const events = mapCodexToVizEvents({
    method: "error",
    params: { message: "Command failed with timeout" },
  });

  const error = events.find((item) => item.kind === "error");
  assert.ok(error, "expected an error event");
  assert.equal(error.attentionSeverity, "critical");
  assert.equal(error.attentionCode, "error");
});

test("naming precedence prefers developer name over thread title", () => {
  const result = computeDisplayLabel({
    developerName: "Verifier Lane",
    threadTitle: "Thread A",
    workflowHint: "Execute",
    runId: "explicit:abc-123",
  });
  assert.equal(result.label, "Verifier Lane");
  assert.equal(result.labelSource, "developer_name");
});

test("computeDisplayLabel uses thread title when developer name missing", () => {
  const result = computeDisplayLabel({
    developerName: null,
    threadTitle: "Fix flaky test workflow",
    workflowHint: "Execute",
    runId: "explicit:abc-123",
  });
  assert.equal(result.label, "Fix flaky test workflow");
  assert.equal(result.labelSource, "thread_title");
});

test("computeDisplayLabel falls back to workflow and short id", () => {
  const result = computeDisplayLabel({
    developerName: null,
    threadTitle: null,
    workflowHint: "Verify",
    runId: "explicit:thread-01acbd12ff",
  });
  assert.match(result.label, /^Verify · [a-z0-9]+$/);
  assert.equal(result.labelSource, "workflow_fallback");
});

test("extractDeveloperName ignores generic placeholders", () => {
  assert.equal(extractDeveloperName({ params: { agent_name: "agent-1" } }), null);
  assert.equal(extractDeveloperName({ params: { agentName: "codex:main" } }), null);
  assert.equal(extractDeveloperName({ swarm: { agentName: "sim-lane-exe" } }), null);
  assert.equal(extractDeveloperName({ params: { agent_name: "Planner" } }), "Planner");
});

test("extractThreadTitle handles supported fields", () => {
  assert.equal(extractThreadTitle({ threadTitle: "Thread title A" }), "Thread title A");
  assert.equal(extractThreadTitle({ params: { thread: { title: "Thread title B" } } }), "Thread title B");
});

test("deriveWorkflowHint uses lane/prompt hints", () => {
  assert.equal(deriveWorkflowHint({ lane: "plan lane" }), "Plan");
  assert.equal(deriveWorkflowHint({ prompt: "Please verify tests" }), "Verify");
  assert.equal(deriveWorkflowHint({ prompt: "summarize findings" }), "Report");
  assert.equal(deriveWorkflowHint({ prompt: "fix bug in module" }), "Execute");
});

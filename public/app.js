const canvas = document.getElementById("cityCanvas");
const ctx = canvas.getContext("2d");

const wsStatusEl = document.getElementById("wsStatus");
const metricsEl = document.getElementById("metrics");
const lastTypeEl = document.getElementById("lastType");
const logLinesEl = document.getElementById("logLines");

const WORLD = {
  width: 1280,
  height: 720,
  tile: 16,
  cols: 80,
  rows: 45,
};

const DISTRICTS = {
  Frontend: { x1: 0, y1: 0, x2: 39, y2: 21 },
  Backend: { x1: 40, y1: 0, x2: 79, y2: 21 },
  Infra: { x1: 0, y1: 22, x2: 39, y2: 44 },
  Tests: { x1: 40, y1: 22, x2: 79, y2: 44 },
};

const HQ = { x: 40, y: 22 };

const state = {
  buildings: new Map(),
  vehicles: [],
  effects: [],
  lastEvents: [],
  wsState: "connecting",
  lastEventType: "none",
};

const DISTRICT_COLORS = {
  Frontend: "#63d1c6",
  Backend: "#6fa8ff",
  Infra: "#5eb5ff",
  Tests: "#82df9b",
};

const FILE_REGEX = /([\w./-]+\.(?:ts|tsx|js|jsx|py|md|json|yml|yaml|go|rs|java|c|cpp|h))/gi;

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function districtCenter(name) {
  const d = DISTRICTS[name];
  return {
    x: Math.floor((d.x1 + d.x2) / 2),
    y: Math.floor((d.y1 + d.y2) / 2),
  };
}

function chooseDistrictFromPath(filePath) {
  const p = filePath.toLowerCase();
  if (/(^|\/)(test|tests|__tests__)(\/|$)/.test(p)) return "Tests";
  if (/(infra|docker|k8s|terraform)/.test(p)) return "Infra";
  if (/(ui|frontend|components)/.test(p)) return "Frontend";
  return "Backend";
}

function chooseDistrictFromEvent(evt, fallback = "Backend") {
  const blob = JSON.stringify(evt).toLowerCase();
  if (/(test|__tests__|jest|vitest|pytest)/.test(blob)) return "Tests";
  if (/(infra|docker|k8s|terraform|deploy|ci)/.test(blob)) return "Infra";
  if (/(ui|frontend|component|css|dom|react|vue)/.test(blob)) return "Frontend";
  if (/(api|server|backend|db|sql)/.test(blob)) return "Backend";
  return fallback;
}

function typeOfEvent(evt) {
  const candidates = [
    evt?.type,
    evt?.event,
    evt?.name,
    evt?.kind,
    evt?.status,
    evt?.level,
  ];
  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) return item;
  }
  return "unknown";
}

function extractFilePaths(evt) {
  const found = new Set();
  const text = JSON.stringify(evt);
  let match;
  while ((match = FILE_REGEX.exec(text)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

function buildingLevel(touches) {
  if (touches >= 5) return 3;
  if (touches >= 2) return 2;
  return 1;
}

function fileTileWithinDistrict(filePath, districtName) {
  const d = DISTRICTS[districtName];
  const width = d.x2 - d.x1 + 1;
  const height = d.y2 - d.y1 + 1;
  const h = hashString(filePath);
  const x = d.x1 + (h % width);
  const y = d.y1 + (Math.floor(h / width) % height);
  return { x, y };
}

function addLogLine(line) {
  state.lastEvents.unshift(line);
  if (state.lastEvents.length > 6) state.lastEvents.length = 6;
}

function spawnVehicleToDistrict(district, color = "#f1c40f") {
  const target = districtCenter(district);
  state.vehicles.push({
    x: HQ.x,
    y: HQ.y,
    targetX: target.x,
    targetY: target.y,
    speed: 18,
    color,
  });
}

function spawnEffectPulse(x, y, color = "#2ecc71", ttl = 0.8) {
  state.effects.push({ type: "pulse", x, y, color, ttl, age: 0 });
}

function spawnEffectBeacon(x, y, color = "#e74c3c", ttl = 2.0) {
  state.effects.push({ type: "beacon", x, y, color, ttl, age: 0, blink: 0 });
}

function isToolCallEvent(evt, eventType) {
  const raw = `${eventType} ${JSON.stringify(evt)}`.toLowerCase();
  return /(tool_call|tool.call|turn.started|turn_start|assistant.turn.started|step.started)/.test(raw);
}

function isErrorEvent(evt, eventType) {
  const raw = `${eventType} ${JSON.stringify(evt)}`.toLowerCase();
  return /(error|failed|exception|fatal|timeout)/.test(raw);
}

function isSuccessEvent(evt, eventType) {
  const raw = `${eventType} ${JSON.stringify(evt)}`.toLowerCase();
  return /(completed|passed|succeeded|success|done|exit"?:0)/.test(raw);
}

function applyFileChange(filePath, district) {
  const tile = fileTileWithinDistrict(filePath, district);
  const key = `${tile.x},${tile.y}`;
  const prev = state.buildings.get(key) || { touches: 0, level: 0, district };

  const touches = prev.touches + 1;
  const level = buildingLevel(touches);
  state.buildings.set(key, { touches, level, district });

  if (level > prev.level) {
    spawnEffectPulse(tile.x, tile.y, "#2ecc71", 0.7);
  }
}

function handleCodexEvent(evt) {
  const eventType = typeOfEvent(evt);
  state.lastEventType = eventType;
  addLogLine(`${new Date().toLocaleTimeString()}  ${eventType}`);

  const guessedDistrict = chooseDistrictFromEvent(evt, "Backend");

  if (isToolCallEvent(evt, eventType)) {
    spawnVehicleToDistrict(guessedDistrict, "#f1c40f");
  }

  const paths = extractFilePaths(evt);
  for (const filePath of paths) {
    const district = chooseDistrictFromPath(filePath);
    applyFileChange(filePath, district);
  }

  const center = districtCenter(guessedDistrict);

  if (isErrorEvent(evt, eventType)) {
    spawnEffectBeacon(center.x, center.y, "#ff4f64", 2.0);
  } else if (isSuccessEvent(evt, eventType)) {
    spawnEffectPulse(center.x, center.y, "#35d07f", 1.0);
  }

  updateHud();
}

function updateVehicles(dt) {
  for (let i = state.vehicles.length - 1; i >= 0; i -= 1) {
    const v = state.vehicles[i];
    const dx = v.targetX - v.x;
    const dy = v.targetY - v.y;
    const distance = Math.hypot(dx, dy);
    const move = v.speed * dt;

    if (distance <= move || distance < 0.02) {
      state.vehicles.splice(i, 1);
      continue;
    }

    v.x += (dx / distance) * move;
    v.y += (dy / distance) * move;
  }
}

function updateEffects(dt) {
  for (let i = state.effects.length - 1; i >= 0; i -= 1) {
    const effect = state.effects[i];
    effect.age += dt;
    if (effect.type === "beacon") {
      effect.blink += dt;
    }
    if (effect.age >= effect.ttl) {
      state.effects.splice(i, 1);
    }
  }
}

function tileToPoint(tx, ty) {
  return {
    x: tx * WORLD.tile + WORLD.tile / 2,
    y: ty * WORLD.tile + WORLD.tile / 2,
  };
}

function drawBackdrop(time) {
  const gradient = ctx.createRadialGradient(
    WORLD.width * 0.45,
    WORLD.height * 0.35,
    80,
    WORLD.width * 0.5,
    WORLD.height * 0.5,
    WORLD.width * 0.7
  );
  gradient.addColorStop(0, "#213253");
  gradient.addColorStop(0.55, "#101d35");
  gradient.addColorStop(1, "#080f1e");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.strokeStyle = "rgba(116, 166, 255, 0.08)";
  ctx.lineWidth = 1.2;
  for (let y = 0; y <= WORLD.rows; y += 2) {
    const py = y * WORLD.tile + Math.sin(time * 0.7 + y * 0.16) * 2.4;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.cols; x += 1) {
      const px = x * WORLD.tile;
      const offset = Math.sin(time * 1.4 + x * 0.2 + y * 0.05) * 2.6;
      if (x === 0) ctx.moveTo(px, py + offset);
      else ctx.lineTo(px, py + offset);
    }
    ctx.stroke();
  }
}

function drawDistrictShapes(time) {
  for (const [name, d] of Object.entries(DISTRICTS)) {
    const center = tileToPoint((d.x1 + d.x2) / 2, (d.y1 + d.y2) / 2);
    const rx = ((d.x2 - d.x1 + 1) * WORLD.tile) / 2 - 18;
    const ry = ((d.y2 - d.y1 + 1) * WORLD.tile) / 2 - 18;
    const tint = DISTRICT_COLORS[name];
    const drift = Math.sin(time * 1.1 + center.x * 0.003 + center.y * 0.002) * 7;

    ctx.beginPath();
    ctx.ellipse(center.x, center.y + drift, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = `${tint}1f`;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `${tint}66`;
    ctx.stroke();

    ctx.font = "600 15px 'Avenir Next', sans-serif";
    ctx.fillStyle = `${tint}ee`;
    ctx.fillText(name, center.x - 34, center.y - ry + 28 + drift);
  }
}

function drawConnectors(time) {
  const hq = tileToPoint(HQ.x, HQ.y);
  for (const [name] of Object.entries(DISTRICTS)) {
    const target = districtCenter(name);
    const point = tileToPoint(target.x, target.y);
    const tint = DISTRICT_COLORS[name];
    const curve = Math.sin(time * 1.6 + point.x * 0.004) * 40;

    ctx.beginPath();
    ctx.moveTo(hq.x, hq.y);
    ctx.bezierCurveTo(
      hq.x + curve,
      hq.y - curve * 0.4,
      point.x - curve,
      point.y + curve * 0.3,
      point.x,
      point.y
    );
    ctx.strokeStyle = `${tint}4f`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawHQ(time) {
  const hq = tileToPoint(HQ.x, HQ.y);
  const pulse = 11 + Math.sin(time * 3) * 1.8;

  ctx.beginPath();
  ctx.arc(hq.x, hq.y, pulse + 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(94, 181, 255, 0.15)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(hq.x, hq.y, pulse, 0, Math.PI * 2);
  ctx.fillStyle = "#d9f0ff";
  ctx.fill();

  ctx.font = "600 12px 'Avenir Next', sans-serif";
  ctx.fillStyle = "#a9d2ff";
  ctx.fillText("HQ", hq.x - 9, hq.y - 16);
}

function drawBuildings(time) {
  for (const [key, b] of state.buildings.entries()) {
    const [xStr, yStr] = key.split(",");
    const x = Number(xStr);
    const y = Number(yStr);
    const p = tileToPoint(x, y);
    const tint = DISTRICT_COLORS[b.district] || "#88b4ff";
    const base = 3.5 + b.level * 2.5;
    const wobble = Math.sin(time * 2.2 + x * 0.34 + y * 0.22) * 0.9;
    const radius = base + wobble;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = `${tint}24`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    if (b.level === 1) ctx.fillStyle = `${tint}88`;
    if (b.level === 2) ctx.fillStyle = `${tint}bb`;
    if (b.level === 3) ctx.fillStyle = `${tint}ff`;
    ctx.fill();
  }
}

function drawVehicles() {
  for (const v of state.vehicles) {
    const p = tileToPoint(v.x, v.y);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
    glow.addColorStop(0, `${v.color}ee`);
    glow.addColorStop(1, `${v.color}00`);

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = v.color;
    ctx.fill();
  }
}

function drawEffects() {
  for (const e of state.effects) {
    const p = tileToPoint(e.x, e.y);
    const progress = Math.min(1, e.age / e.ttl);

    if (e.type === "pulse") {
      const size = 5 + progress * 26;
      const alpha = 1 - progress;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.strokeStyle = `${e.color}${Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    if (e.type === "beacon") {
      const on = Math.floor(e.blink / 0.2) % 2 === 0;
      if (on) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = `${e.color}b0`;
        ctx.fill();
      }
    }
  }
}

function render(now) {
  const time = now / 1000;
  drawBackdrop(time);
  drawDistrictShapes(time);
  drawConnectors(time);
  drawBuildings(time);
  drawHQ(time);
  drawVehicles();
  drawEffects();
}

function updateHud() {
  wsStatusEl.textContent = `WS: ${state.wsState}`;
  metricsEl.textContent = `buildings=${state.buildings.size} vehicles=${state.vehicles.length} effects=${state.effects.length}`;
  lastTypeEl.textContent = `last event: ${state.lastEventType}`;
  logLinesEl.textContent = state.lastEvents.join("\n");
}

function connectWebSocket() {
  const ws = new WebSocket("ws://localhost:8787");

  ws.addEventListener("open", () => {
    state.wsState = "connected";
    updateHud();
  });

  ws.addEventListener("close", () => {
    state.wsState = "disconnected";
    updateHud();
    setTimeout(connectWebSocket, 1200);
  });

  ws.addEventListener("error", () => {
    state.wsState = "error";
    updateHud();
  });

  ws.addEventListener("message", (msg) => {
    try {
      const evt = JSON.parse(msg.data);
      handleCodexEvent(evt);
    } catch {
      addLogLine("invalid ws payload");
      updateHud();
    }
  });
}

let previous = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;

  updateVehicles(dt);
  updateEffects(dt);
  render(now);
  updateHud();

  requestAnimationFrame(frame);
}

window.dispatchAgentEvent = (evt) => {
  if (!evt || typeof evt !== "object") return;
  handleCodexEvent(evt);
};

connectWebSocket();
updateHud();
requestAnimationFrame(frame);

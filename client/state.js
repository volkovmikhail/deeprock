export let username = null;

export function setUsername(name) {
  username = name;
}

// DEPRECATED: score is no longer tracked or shown in-game (replaced by metals/minerals).
// Kept only for backwards compatibility; nothing updates it anymore.
let score = 0;

export function getScore() {
  return score;
}

export function setScore(value) {
  const n = Number(value);
  score = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

let metals = 0;

export function getMetals() {
  return metals;
}

export function setMetals(value) {
  const n = Number(value);
  metals = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

let minerals = 0;

export function getMinerals() {
  return minerals;
}

export function setMinerals(value) {
  const n = Number(value);
  minerals = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export let username = null;

export function setUsername(name) {
  username = name;
}

let score = 0;

export function getScore() {
  return score;
}

export function setScore(value) {
  const n = Number(value);
  score = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** Ore types and how often each one spawns on the board, used by GameScene. */
export const ORE_KEYS = ['ore_copper', 'ore_gold', 'ore_emerald', 'ore_lapis', 'ore_ruby', 'ore_silver'];

/**
 * Spawn probability per ore key, in percent (must sum to 100).
 * Emerald/ruby/gold are rare; the remaining ore types split what's left evenly.
 */
export const ORE_SPAWN_WEIGHTS = {
  ore_emerald: 2,
  ore_ruby: 3,
  ore_gold: 5,
  ore_copper: 30,
  ore_lapis: 30,
  ore_silver: 30,
};

/** Metal/mineral resources granted per matched ore of this type. */
export const ORE_RESOURCE_VALUES = {
  ore_copper: { metals: 1, minerals: 0 },
  ore_silver: { metals: 2, minerals: 0 },
  ore_gold: { metals: 10, minerals: 0 },
  ore_lapis: { metals: 0, minerals: 1 },
  ore_ruby: { metals: 0, minerals: 3 },
  ore_emerald: { metals: 0, minerals: 5 },
};

/** Picks a random index into ORE_KEYS according to ORE_SPAWN_WEIGHTS. */
export function pickWeightedOreIndex() {
  const total = ORE_KEYS.reduce((sum, key) => sum + ORE_SPAWN_WEIGHTS[key], 0);
  let roll = Math.random() * total;
  for (let i = 0; i < ORE_KEYS.length; i++) {
    roll -= ORE_SPAWN_WEIGHTS[ORE_KEYS[i]];
    if (roll < 0) {
      return i;
    }
  }
  return ORE_KEYS.length - 1;
}

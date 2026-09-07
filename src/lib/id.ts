let counter = 0;

/** Collision-safe enough for local-first data; avoids a uuid dependency. */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

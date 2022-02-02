export type NonNullableKeys<T, K extends keyof T> = T & {
  [key in K]-?: NonNullable<T[key]>
}

export const hasNonNullableKeys = <T, K extends keyof T>(
  obj: T,
  keys: K[],
): obj is NonNullableKeys<T, K> => {
  return keys.every((k) => obj[k] !== undefined && obj[k] !== null)
}

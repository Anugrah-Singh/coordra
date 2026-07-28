type RemoveUndefined<T extends Record<string, unknown>> = {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
} & {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
};

export const removeUndefined = <T extends Record<string, unknown>>(
  object: T
): RemoveUndefined<T> => {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  ) as RemoveUndefined<T>;
};

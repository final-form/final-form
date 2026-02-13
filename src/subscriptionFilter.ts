import shallowEqual from "./shallowEqual";

export default function subscriptionFilter<T extends Record<string, any>>(
  dest: T,
  src: T,
  previous: T | undefined,
  subscription: Record<string, boolean>,
  keys: string[],
  shallowEqualKeys: string[],
): boolean {
  let different = false;
  keys.forEach((key) => {
    if (subscription[key]) {
      (dest as any)[key] = src[key];
      if (
        !previous ||
        (~shallowEqualKeys.indexOf(key)
          ? !shallowEqual(src[key], previous[key])
          : src[key] !== previous[key])
      ) {
        different = true;
      }
    }
  });
  return different;
}

import shallowEqual from "./shallowEqual";
export default function<T extends {
  [key: string]: any
}>(
  dest: T,
  src: T,
  previous: T | null | undefined,
  subscription: {
    [key: string]: boolean
  },
  keys: string[],
  shallowEqualKeys: string[],
): boolean {
  let different = false;
  keys.forEach((key) => {
    if (subscription[key]) {
      dest[key] = src[key];
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

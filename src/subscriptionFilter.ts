import shallowEqual from "./shallowEqual";
import { PartialRecord } from "./types";
export default function <
  T extends {
    [key: string]: any;
  },
>(
  dest: T,
  src: T,
  previous: T | null | undefined,
  subscription: PartialRecord<keyof T, boolean | undefined>,
  keys: Array<keyof T>,
  shallowEqualKeys: Array<keyof T>,
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

import toPath from "./toPath";
import type { GetIn } from "../types";

const getIn: GetIn = (state: object, complexKey: string): any => {
  // Intentionally using iteration rather than recursion
  const path = toPath(complexKey);
  let current: any = state;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (
      current === undefined ||
      current === null ||
      typeof current !== "object" ||
      (Array.isArray(current) && isNaN(Number(key)))
    ) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};

export default getIn;

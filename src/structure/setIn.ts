import toPath from "./toPath";
import type { SetIn } from "../types";

type State = any | Array<any> | undefined;

const setInRecursor = (
  current: State,
  index: number,
  path: string[],
  value: any,
  destroyArrays: boolean,
): State => {
  if (index >= path.length) {
    // end of recursion
    return value;
  }
  const key = path[index];

  // determine type of key
  if (isNaN(key as any)) {
    // object set
    if (current === undefined || current === null) {
      // recurse
      const result = setInRecursor(
        undefined,
        index + 1,
        path,
        value,
        destroyArrays,
      );

      // delete or create an object
      return result === undefined ? undefined : { [key]: result };
    }
    if (Array.isArray(current)) {
      throw new Error("Cannot set a non-numeric property on an array");
    }
    // current exists, so make a copy of all its values, and add/update the new one
    const result = setInRecursor(
      current[key],
      index + 1,
      path,
      value,
      destroyArrays,
    );
    if (result === undefined) {
      const numKeys = Object.keys(current).length;
      if (current[key] === undefined && numKeys === 0) {
        // object was already empty
        return undefined;
      }
      if (current[key] !== undefined && numKeys <= 1) {
        // only key we had was the one we are deleting
        if (!isNaN(path[index - 1] as any) && !destroyArrays) {
          // we are in an array, so return an empty object
          return {};
        } else {
          return undefined;
        }
      }
      const { [key]: _removed, ...final } = current;
      return final;
    }
    // set result in key
    return {
      ...current,
      [key]: result,
    };
  }
  // array set
  const numericKey = Number(key);
  if (current === undefined || current === null) {
    // recurse
    const result = setInRecursor(
      undefined,
      index + 1,
      path,
      value,
      destroyArrays,
    );

    // if nothing returned, delete it
    if (result === undefined) {
      return undefined;
    }

    // create an array
    const array = [];
    array[numericKey] = result;
    return array as Array<any>;
  }
  if (!Array.isArray(current)) {
    throw new Error("Cannot set a numeric property on an object");
  }
  // recurse
  const existingValue = current[numericKey];
  const result = setInRecursor(
    existingValue,
    index + 1,
    path,
    value,
    destroyArrays,
  );

  // current exists, so make a copy of all its values, and add/update the new one
  const array = [...current];
  if (destroyArrays && result === undefined) {
    array.splice(numericKey, 1);
    if (array.length === 0) {
      return undefined;
    }
  } else {
    array[numericKey] = result;
  }
  return array;
};

const setIn: SetIn = (state: any, key: string, value: any, destroyArrays: boolean = false): any => {
  if (state === undefined || state === null) {
    throw new Error(`Cannot call setIn() with ${String(state)} state`);
  }
  if (key === undefined || key === null) {
    throw new Error(`Cannot call setIn() with ${String(key)} key`);
  }
  // Recursive function needs to accept and return State, but public API should
  // only deal with Objects
  return setInRecursor(
    state,
    0,
    toPath(key),
    value,
    destroyArrays,
  ) as any;
};

export default setIn;

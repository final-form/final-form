// @flow
import shallowEqual from "./shallowEqual";

const memoize = (fn: Function): Function => {
  let lastArgs;
  let lastResult;
  return (...args) => {
    if (
      !lastArgs ||
      args.length !== lastArgs.length ||
      args.some((arg, index) => !shallowEqual(lastArgs[index], arg))
    ) {
      lastArgs = args;
      lastResult = fn(...args);
    }
    return lastResult;
  };
};

export default memoize;

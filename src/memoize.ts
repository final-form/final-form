import shallowEqual from "./shallowEqual";

const memoize = (fn: any): any => {
  let lastArgs: Array<any>;
  let lastResult: any;
  return (...args: Array<any>) => {
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

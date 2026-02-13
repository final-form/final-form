import shallowEqual from "./shallowEqual";

const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  let lastArgs: any[] | undefined;
  let lastResult: any;
  return ((...args: any[]) => {
    if (
      !lastArgs ||
      args.length !== lastArgs.length ||
      args.some((arg, index) => !shallowEqual(lastArgs![index], arg))
    ) {
      lastArgs = args;
      lastResult = fn(...args);
    }
    return lastResult;
  }) as T;
};

export default memoize;

import memoize from "./memoize";

const add = (...args) => args.reduce((sum, addend) => sum + addend, 0);

describe("memoize", () => {
  it("should NOT call with same args", () => {
    const spy = jest.fn(add);
    const fn = memoize(spy);

    expect(spy).not.toHaveBeenCalled();
    expect(fn(1)).toBe(1);
    expect(fn(1)).toBe(1);
    expect(fn(1)).toBe(1);
    expect(fn(1)).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(fn(1, 2)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should call if number of arguments changes", () => {
    const spy = jest.fn(add);
    const fn = memoize(spy);

    expect(spy).not.toHaveBeenCalled();
    expect(fn(1)).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fn(1, 2)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(fn(1, 2, 4)).toBe(7);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("should call if value of argument changes", () => {
    const spy = jest.fn(add);
    const fn = memoize(spy);

    expect(spy).not.toHaveBeenCalled();
    expect(fn(1, 2)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fn(1, 3)).toBe(4);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(fn(1, 2)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(fn(10, 3)).toBe(13);
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it("should use shallowEqual to determine argument changes", () => {
    const spy = jest.fn((a, b) => a.value + b.value);
    const fn = memoize(spy);

    const one = { value: 1 };
    const two = { value: 2 };
    const anotherTwo = { value: 2 };

    expect(spy).not.toHaveBeenCalled();
    expect(fn(one, two)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fn(one, anotherTwo)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fn(one, two)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not go deeper than a shallowEqual to determine argument changes", () => {
    const spy = jest.fn((a, b) => a.deeper.value + b.deeper.value);
    const fn = memoize(spy);

    const one = { deeper: { value: 1 } };
    const two = { deeper: { value: 2 } };
    const anotherTwo = { deeper: { value: 2 } };

    expect(spy).not.toHaveBeenCalled();
    expect(fn(one, two)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fn(one, anotherTwo)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(fn(one, two)).toBe(3);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});

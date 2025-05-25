import setIn from "./setIn";

describe("structure.setIn", () => {
  describe("invalid input", () => {
    it("should throw an error when state is undefined", () => {
      expect(() => setIn(undefined, "whatever", "some value")).toThrow(
        /setIn\(\) with undefined state/,
      );
    });
    it("should throw an error when state is null", () => {
      expect(() => setIn(null, "whatever", "some value")).toThrow(
        /setIn\(\) with null state/,
      );
    });
    it("should throw an error when key is undefined", () => {
      expect(() => setIn({}, undefined, "some value")).toThrow(
        /setIn\(\) with undefined key/,
      );
    });
    it("should throw an error when key is null", () => {
      expect(() => setIn({}, null, "some value")).toThrow(
        /setIn\(\) with null key/,
      );
    });
    it("should throw an error when trying to set a non-numeric key into an array", () => {
      expect(() => setIn([], "foo", "bar")).toThrow(
        /non-numeric property on an array/,
      );
    });
    it("should throw an error when trying to set a numeric key into an object", () => {
      expect(() => setIn({}, "42", "bar")).toThrow(
        /numeric property on an object/,
      );
    });
  });

  it("should set new simple object keys using new structure, but same instances of other values", () => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const e = {};
    const input = { a, b, c, d };
    const output = setIn(input, "e", e);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.c).toBe(c);
    expect(output.d).toBe(d);
    expect(output.e).toBe(e);
  });

  it("should set new simple array keys using new structure, but same instances of other values", () => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const e = {};
    const input = [a, b, c, d];
    const output = setIn(input, "4", e);
    expect(input).not.toBe(output);
    expect(output[0]).toBe(a);
    expect(output[1]).toBe(b);
    expect(output[2]).toBe(c);
    expect(output[3]).toBe(d);
    expect(output[4]).toBe(e);
  });

  it("should update existing simple object keys using existing structure, but same instances of other values", () => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const newC = {};
    const input = { a, b, c, d };
    const output = setIn(input, "c", newC);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.c).toBe(newC);
    expect(output.d).toBe(d);
  });

  it("should update existing simple array keys using existing structure, but same instances of other values", () => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const newC = {};
    const input = [a, b, c, d];
    const output = setIn(input, "2", newC);
    expect(input).not.toBe(output);
    expect(output[0]).toBe(a);
    expect(output[1]).toBe(b);
    expect(output[2]).toBe(newC);
    expect(output[3]).toBe(d);
  });

  it("should create a new object structure when it needs to", () => {
    const a = {};
    const b = {};
    const deepCDE = {};
    const input = { a, b };
    const output = setIn(input, "c.d.e", deepCDE);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(typeof output.c).toBe("object");
    expect(typeof output.c.d).toBe("object");
    expect(output.c.d.e).toBe(deepCDE);
  });

  it("should create a new array structure when it needs to", () => {
    const a = {};
    const b = {};
    const deepValue = {};
    const input = { a, b };
    const output = setIn(input, "c[2].d[0][1]", deepValue);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(Array.isArray(output.c)).toBe(true);
    expect(output.c.length).toBe(3);
    expect(typeof output.c[2]).toBe("object");
    expect(Array.isArray(output.c[2].d)).toBe(true);
    expect(output.c[2].d.length).toBe(1);
    expect(Array.isArray(output.c[2].d[0])).toBe(true);
    expect(output.c[2].d[0].length).toBe(2);
    expect(output.c[2].d[0][1]).toBe(deepValue);
  });

  it("should delete structure when setting undefined", () => {
    const a = {};
    const b = {};
    const input = { a, b, dog: { cat: { rat: "foo" } } };
    const output = setIn(input, "dog.cat.rat", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeUndefined();
  });

  it("should delete structure when setting undefined on non-existing key", () => {
    const a = {};
    const b = {};
    const input = { a, b, dog: {} };
    const output = setIn(input, "dog.cat", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeUndefined();
  });

  it("should remove property when setting its value to undefined", () => {
    const a = {};
    const b = {};
    const input = { a, b, dog: {} };
    const output = setIn(input, "dog", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output).not.toHaveProperty("dog");
  });

  it("should not delete structure when setting undefined and other keys exist", () => {
    const a = {};
    const b = {};
    const input = { a, b };
    const output = setIn(input, "b", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBeUndefined();
  });

  it("should not delete structure when setting undefined to a nonexistent key and other keys exist", () => {
    const a = {};
    const input = { a };
    const output = setIn(input, "b", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
  });

  it("should not delete array structure when setting undefined (and destroyArrays is false)", () => {
    const a = {};
    const b = {};
    const input = { a, b, dog: [{ rat: "foo" }] };
    const output = setIn(input, "dog[0].rat", undefined, false);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeDefined();
    expect(Array.isArray(output.dog)).toBe(true);
    expect(output.dog.length).toBe(1);
    expect(output.dog[0]).toEqual({});
  });

  it("should delete array structure when setting undefined (and destroyArrays is true)", () => {
    const a = {};
    const b = {};
    const input = { a, b, dog: [{ rat: "foo" }] };
    const output = setIn(input, "dog[0].rat", undefined, true);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeUndefined();
  });

  it("should not delete array structure when setting undefined to one value of many (and destroyArrays is true)", () => {
    const a = {};
    const b = {};
    const input = { a, b, dog: [{ rat: "foo" }, { rat: "bar" }] };
    const output = setIn(input, "dog[0].rat", undefined, true);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeDefined();
    expect(output.dog).toEqual([{ rat: "bar" }]);
  });

  it("should not delete array structure when setting undefined and other items exist", () => {
    const a = {};
    const b = {};
    const c = {};
    const d = {};
    const input = { a, b, dog: [c, d] };
    const output = setIn(input, "dog[1]", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeDefined();
    expect(output.dog.length).toBe(2);
    expect(output.dog[0]).toBe(c);
  });

  it("should delete array structure when setting undefined to a nonexistent key and other keys exist", () => {
    const a = {};
    const b = {};
    const c = {};
    const input = { a, b, dog: [c] };
    const output = setIn(input, "dog[1]", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeDefined();
    expect(output.dog.length).toBe(2);
    expect(output.dog[0]).toBe(c);
  });

  it("should not create an array structure when setting undefined", () => {
    const a = {};
    const b = {};
    const input = { a, b };
    const output = setIn(input, "dog[0].rat", undefined);
    expect(input).not.toBe(output);
    expect(output.a).toBe(a);
    expect(output.b).toBe(b);
    expect(output.dog).toBeUndefined();
  });
});

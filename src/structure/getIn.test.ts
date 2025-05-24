import getIn from "./getIn";

describe("structure.getIn", () => {
  describe("invalid input", () => {
    it("should return undefined when state is undefined", () => {
      expect(getIn(undefined, "whatever")).toBeUndefined();
    });
    it("should return undefined when state is null", () => {
      expect(getIn(null, "whatever")).toBeUndefined();
    });
    it("should return undefined when state is boolean", () => {
      expect(getIn(false, "whatever")).toBeUndefined();
      expect(getIn(true, "whatever")).toBeUndefined();
    });
    it("should return undefined when state is number", () => {
      expect(getIn(0, "whatever")).toBeUndefined();
      expect(getIn(42, "whatever")).toBeUndefined();
      expect(getIn(69, "whatever")).toBeUndefined();
    });
    it("should return undefined when state is string", () => {
      expect(getIn("Not an array or object", "whatever")).toBeUndefined();
      expect(getIn("", "whatever")).toBeUndefined();
    });
  });

  it("should get simple object keys", () => {
    expect(getIn({ foo: "bar" }, "foo")).toBe("bar");
    expect(getIn({ life: 42 }, "life")).toBe(42);
    expect(getIn({ awesome: true }, "awesome")).toBe(true);
  });

  it("should get simple array indexes", () => {
    expect(getIn({ myArray: ["a", "b", "c"] }, "myArray[0]")).toBe("a");
    expect(getIn({ myArray: ["a", "b", "c"] }, "myArray[1]")).toBe("b");
    expect(getIn({ myArray: ["a", "b", "c"] }, "myArray[2]")).toBe("c");
  });

  it("should get simple array indexes of numbers", () => {
    expect(getIn({ myArray: [1] }, "myArray[0]")).toBe(1);
    expect(getIn({ myArray: [1, 2, 3] }, "myArray[1]")).toBe(2);
    expect(getIn({ myArray: [1, 2, 3] }, "myArray[2]")).toBe(3);
  });

  it("should return undefined for non-numeric key to an array", () => {
    expect(getIn({ myArray: ["a", "b", "c"] }, "myArray.foo")).toBeUndefined();
  });

  it("should get arbitrarily deep values", () => {
    expect(getIn({ a: [{ b: 2 }] }, "a[0].b")).toBe(2);
    expect(getIn({ a: ["first", [{ b: "c" }]] }, "a[1][0].b")).toBe("c");
  });
});

import toPath from "./toPath";

describe("structure.toPath", () => {
  it("should return empty array when key is empty", () => {
    expect(toPath(undefined)).toEqual([]);
    expect(toPath(null)).toEqual([]);
    expect(toPath("")).toEqual([]);
  });

  it("should throw an error if key is not a string", () => {
    const pattern = /expects a string/;
    expect(() => toPath(["not", "a", "string"])).toThrow(pattern);
  });

  it("should split on dots", () => {
    expect(toPath("jack.daniels")).toEqual(["jack", "daniels"]);
    expect(toPath("jack.and.jill.went.up.the.hill")).toEqual([
      "jack",
      "and",
      "jill",
      "went",
      "up",
      "the",
      "hill",
    ]);
  });

  it("should split on brackets", () => {
    expect(toPath("foo[1].bar")).toEqual(["foo", "1", "bar"]);
    expect(toPath("foo[1].bar[4]")).toEqual(["foo", "1", "bar", "4"]);
    expect(toPath("foo[1][2][3].bar[4].cow")).toEqual([
      "foo",
      "1",
      "2",
      "3",
      "bar",
      "4",
      "cow",
    ]);
  });

  it("should support string properties that are not valid JS identifiers", () => {
    expect(toPath('foo["bar.baz\\"["]')).toEqual(["foo", 'bar.baz"[']);
  });

  it("should be retrocompatible with v4.20.2 where key names like 'choices[]' and 'options[]' map to ['choices'] and ['options'] instead of ['choices', ''] and ['options', ''] as introduced by v4.20.3 (unwanted breaking change)", () => {
    expect(toPath("choices[]")).toEqual(["choices"]);
    expect(toPath("options[]")).toEqual(["options"]);
  });
});

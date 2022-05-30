import publishFieldState from "./publishFieldState";

const check = (error: any, initial: any, value: any, submitError: any) => {
  // mock placeholder values to check ===
  const active: Record<string, any> = {};
  const blur: Record<string, any> = {};
  const change: Record<string, any> = {};
  const data: Record<string, any> = {};
  const focus: Record<string, any> = {};
  const name = "foo";
  const submitFailed: Record<string, any> = {};
  const submitSucceeded: Record<string, any> = {};
  const submitting: Record<string, any> = {};
  const result = publishFieldState(
    {
      initialValues: {
        foo: initial,
      },
      errors: {
        foo: error,
      },
      submitErrors: {
        foo: submitError,
      },
      submitFailed,
      submitSucceeded,
      submitting,
      values: {
        foo: value,
      },
    },
    {
      active,
      blur,
      change,
      data,
      focus,
      initial,
      isEqual: (a: any, b: any) => a === b,
      name,
      value,
    },
  );
  expect(result.active).toBe(active);
  expect(result.blur).toBe(blur);
  expect(result.change).toBe(change);
  expect(result.data).toBe(data);
  expect(result.focus).toBe(focus);
  expect(result.name).toBe(name);
  expect(result.error).toBe(error);
  expect(result.initial).toBe(initial);
  expect(result.value).toBe(value);
  expect(result.dirty).toBe(initial !== value);
  expect(result.pristine).toBe(initial === value);
  expect(result.submitError).toBe(submitError);
  expect(result.submitFailed).toBe(submitFailed);
  expect(result.submitSucceeded).toBe(submitSucceeded);
  expect(result.submitting).toBe(submitting);
  expect(result.valid).toBe(!error && !submitError);
  expect(result.invalid).toBe(!!(error || submitError));
};

describe("publishFieldState", () => {
  it("should show valid when no error", () => {
    check(undefined, undefined, undefined);
  });

  it("should show invalid when error", () => {
    check("some error", undefined, undefined);
  });

  it("should show invalid when submit error", () => {
    check(undefined, undefined, undefined, "submit error");
  });

  it("should show pristine when value same as initial", () => {
    check("some error", 42, 42);
    check(undefined, 42, 42);
    check("some error", "apples", "apples");
    check(undefined, "apples", "apples");
  });

  it("should show dirty when value different from initial", () => {
    check("some error", 42, 43);
    check(undefined, 42, 43);
    check("some error", "apples", "oranges");
    check(undefined, "apples", "oranges");
  });
});

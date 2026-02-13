import createForm from "./FinalForm";

const onSubmitMock = (values, callback) => {};

describe("FinalForm.registerField", () => {
  it("should fix up field that is created by mutators", () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      initialValues: {
        foo: "bar",
      },
      mutators: {
        setFieldState: (args, state) => {
          state.fields.foo = {
            active: false,
            afterSubmit: undefined,
            beforeSubmit: undefined,
            data: {},
            isEqual: (a, b) => a === b,
            lastFieldState: undefined,
            modified: true,
            modifiedSinceLastSubmit: false,
            name: "foo",
            touched: true,
            valid: true,
            validateFields: undefined,
            validators: {},
            validating: false,
            visited: true,
          };
        },
      },
    });
    form.mutators.setFieldState();
    const spy = jest.fn();
    form.registerField("foo", spy, { value: true });
    expect(typeof spy.mock.calls[0][0].blur).toBe("function");
    expect(typeof spy.mock.calls[0][0].focus).toBe("function");
    expect(typeof spy.mock.calls[0][0].change).toBe("function");
  });

  it("should fix up field even when blur/change/focus are explicitly set to null", () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      initialValues: {
        foo: "bar",
      },
      mutators: {
        setFieldStateWithNull: (args, state) => {
          state.fields.foo = {
            active: false,
            afterSubmit: undefined,
            beforeSubmit: undefined,
            blur: null, // explicitly set to null
            change: null, // explicitly set to null
            focus: null, // explicitly set to null
            data: {},
            isEqual: (a, b) => a === b,
            lastFieldState: undefined,
            modified: true,
            modifiedSinceLastSubmit: false,
            name: "foo",
            touched: true,
            valid: true,
            validateFields: undefined,
            validators: {},
            validating: false,
            visited: true,
          };
        },
      },
    });
    form.mutators.setFieldStateWithNull();
    const spy = jest.fn();
    form.registerField("foo", spy, { value: true });
    expect(typeof spy.mock.calls[0][0].blur).toBe("function");
    expect(typeof spy.mock.calls[0][0].focus).toBe("function");
    expect(typeof spy.mock.calls[0][0].change).toBe("function");

    // Verify the functions actually work
    expect(() => spy.mock.calls[0][0].blur()).not.toThrow();
    expect(() => spy.mock.calls[0][0].focus()).not.toThrow();
    expect(() => spy.mock.calls[0][0].change("new value")).not.toThrow();
  });

  it("should fix up field when blur/change/focus are undefined", () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      initialValues: {
        foo: "bar",
      },
      mutators: {
        setFieldStateWithUndefined: (args, state) => {
          state.fields.foo = {
            active: false,
            afterSubmit: undefined,
            beforeSubmit: undefined,
            blur: undefined, // explicitly set to undefined
            change: undefined, // explicitly set to undefined
            focus: undefined, // explicitly set to undefined
            data: {},
            isEqual: (a, b) => a === b,
            lastFieldState: undefined,
            modified: true,
            modifiedSinceLastSubmit: false,
            name: "foo",
            touched: true,
            valid: true,
            validateFields: undefined,
            validators: {},
            validating: false,
            visited: true,
          };
        },
      },
    });
    form.mutators.setFieldStateWithUndefined();
    const spy = jest.fn();
    form.registerField("foo", spy, { value: true });
    expect(typeof spy.mock.calls[0][0].blur).toBe("function");
    expect(typeof spy.mock.calls[0][0].focus).toBe("function");
    expect(typeof spy.mock.calls[0][0].change).toBe("function");
  });
});

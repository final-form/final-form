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

  it("should allow registering fields with reserved property names like 'constructor'", () => {
    // Regression test for #489
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();
    
    // Should not throw or cause weird prototype issues
    const unregister = form.registerField("constructor", spy, { value: true });
    
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBeDefined();
    expect(spy.mock.calls[0][0].name).toBe("constructor");
    expect(typeof spy.mock.calls[0][0].blur).toBe("function");
    expect(typeof spy.mock.calls[0][0].focus).toBe("function");
    expect(typeof spy.mock.calls[0][0].change).toBe("function");
    
    // Should be able to change the value
    spy.mock.calls[0][0].change("test value");
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0].value).toBe("test value");
    
    // Should be able to unregister
    unregister();
    expect(form.getState().values).toEqual({});
  });
});

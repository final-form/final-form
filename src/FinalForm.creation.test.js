import createForm, { version } from "./FinalForm";

const onSubmitMock = (values, callback) => {};

describe("FinalForm.creation", () => {
  it("should export version", () => {
    expect(version).toBeDefined();
  });

  it("should throw an error if no config is provided", () => {
    expect(() => createForm()).toThrowError(/No config/);
  });

  it("should throw an error if no onSubmit is provided", () => {
    expect(() => createForm({})).toThrowError(/No onSubmit/);
  });

  it("should create a form with no initial values", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    expect(form.getState().initialValues).toBeFalsy();
    expect(form.getState().values).toEqual({});
  });

  it("should create a form with initial values", () => {
    const initialValues = {
      foo: "bar",
      cat: 42,
    };
    const form = createForm({ onSubmit: onSubmitMock, initialValues });
    expect(form.getState().initialValues).not.toBe(initialValues);
    expect(form.getState().initialValues).toEqual(initialValues);
    expect(form.getState().values).not.toBe(initialValues);
    expect(form.getState().values).toEqual(initialValues);
  });

  it("should create a form that is pristine upon creation", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    expect(form.getState().pristine).toBe(true);
    expect(form.getState().dirty).toBe(false);
  });

  it("should allow a change to an not-yet-registered field when validation is present", () => {
    const form = createForm({ onSubmit: onSubmitMock, validate: () => {} });
    form.registerField("whatever", () => {}, { value: true });
    form.change("foo", "bar");
  });

  it("should allow initial values to come from field when registered", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const foo = jest.fn();
    const cat = jest.fn();
    form.registerField(
      "foo",
      foo,
      { pristine: true, initial: true, value: true },
      { initialValue: "bar" },
    );
    expect(form.getState().initialValues).toEqual({ foo: "bar" });
    expect(form.getState().values).toEqual({ foo: "bar" });
    form.registerField(
      "cat",
      cat,
      { pristine: true, initial: true, value: true },
      { initialValue: 42 },
    );
    expect(form.getState().initialValues).toEqual({ foo: "bar", cat: 42 });
    expect(form.getState().values).toEqual({ foo: "bar", cat: 42 });

    expect(foo).toHaveBeenCalledTimes(1);
    expect(foo.mock.calls[0][0]).toMatchObject({
      value: "bar",
      initial: "bar",
      pristine: true,
    });
    expect(cat).toHaveBeenCalledTimes(1);
    expect(cat.mock.calls[0][0]).toMatchObject({
      value: 42,
      initial: 42,
      pristine: true,
    });
  });

  it("should only initialize field if no field value yet exists", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const foo1 = jest.fn();
    form.registerField(
      "foo",
      foo1,
      { initial: true, value: true, pristine: true },
      { initialValue: "bar" },
    );
    expect(form.getState().initialValues).toEqual({ foo: "bar" });
    expect(form.getState().values).toEqual({ foo: "bar" });
    expect(foo1).toHaveBeenCalled();
    expect(foo1).toHaveBeenCalledTimes(1);
    expect(foo1.mock.calls[0][0]).toMatchObject({
      value: "bar",
      initial: "bar",
      pristine: true,
    });
    form.change("foo", "baz");
    expect(foo1).toHaveBeenCalledTimes(2);
    expect(foo1.mock.calls[1][0]).toMatchObject({
      value: "baz",
      initial: "bar",
      pristine: false,
    });

    const foo2 = jest.fn();
    form.registerField(
      "foo",
      foo2,
      { initial: true, value: true, pristine: true },
      { initialValue: "bar" },
    );
    expect(foo2).toHaveBeenCalled();
    expect(foo2).toHaveBeenCalledTimes(1);
    expect(foo2.mock.calls[0][0]).toMatchObject({
      value: "baz",
      initial: "bar",
      pristine: false,
    });
    expect(foo1).toHaveBeenCalledTimes(2);
  });

  it("should allow default value to come from field when registered", () => {
    const form = createForm({
      initialValues: { baz: "baz" },
      onSubmit: onSubmitMock,
    });
    const baz = jest.fn();
    const foo = jest.fn();
    const cat = jest.fn();
    form.registerField(
      "baz",
      baz,
      { pristine: true, initial: true, value: true },
      { defaultValue: "fubar" },
    );
    expect(form.getState().initialValues).toEqual({ baz: "baz" });
    expect(form.getState().values).toEqual({ baz: "baz" });
    form.registerField(
      "foo",
      foo,
      { pristine: true, initial: true, value: true },
      { initialValue: "bar", defaultValue: "fubar" },
    );
    expect(form.getState().initialValues).toEqual({ baz: "baz", foo: "bar" });
    expect(form.getState().values).toEqual({ baz: "baz", foo: "bar" });
    form.registerField(
      "cat",
      cat,
      { pristine: true, initial: true, value: true },
      { defaultValue: 42 },
    );
    expect(form.getState().initialValues).toEqual({ baz: "baz", foo: "bar" });
    expect(form.getState().values).toEqual({ baz: "baz", foo: "bar", cat: 42 });

    expect(baz).toHaveBeenCalledTimes(1);
    expect(baz.mock.calls[0][0]).toMatchObject({
      value: "baz",
      initial: "baz",
      pristine: true,
    });
    expect(foo).toHaveBeenCalledTimes(1);
    expect(foo.mock.calls[0][0]).toMatchObject({
      value: "bar",
      initial: "bar",
      pristine: true,
    });
    expect(cat).toHaveBeenCalledTimes(1);
    expect(cat.mock.calls[0][0]).toMatchObject({
      value: 42,
      initial: undefined,
      pristine: false,
    });
  });

  it("should allow data to come from field when registered", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const foo = jest.fn();
    const cat = jest.fn();
    form.registerField(
      "foo",
      foo,
      { pristine: true, data: true },
      { data: { foo: "bar" } },
    );
    expect(form.getFieldState("foo").data).toEqual({ foo: "bar" });
    form.registerField(
      "cat",
      cat,
      { pristine: true, data: true },
      { data: { foo: "fubar" } },
    );
    expect(form.getFieldState("cat").data).toEqual({ foo: "fubar" });

    expect(foo).toHaveBeenCalledTimes(1);
    expect(foo.mock.calls[0][0]).toMatchObject({
      pristine: true,
      data: { foo: "bar" },
    });
    expect(cat).toHaveBeenCalledTimes(1);
    expect(cat.mock.calls[0][0]).toMatchObject({
      pristine: true,
      data: { foo: "fubar" },
    });
  });

  it("should not call listeners when registering/unregistering silently", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const listener = jest.fn();
    form.subscribe(listener, { values: true });
    expect(listener).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);

    const apple = jest.fn();
    form.registerField(
      "apple",
      apple,
      { value: true },
      { initialValue: "red" },
    );
    expect(apple).toHaveBeenCalled();
    expect(apple).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);

    const banana = jest.fn();
    form.registerField(
      "banana",
      banana,
      { value: true },
      { initialValue: "yellow", silent: true },
    )();
    expect(banana).toHaveBeenCalled();
    expect(banana).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("should not call listeners when registering/unregistering silently, even with validator", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const listener = jest.fn();
    form.subscribe(listener, { values: true });
    expect(listener).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);

    const apple = jest.fn();
    form.registerField(
      "apple",
      apple,
      { value: true },
      { initialValue: "red" },
    );
    expect(apple).toHaveBeenCalled();
    expect(apple).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);

    const banana = jest.fn();
    form.registerField(
      "banana",
      banana,
      { value: true },
      {
        initialValue: "yellow",
        silent: true,
        getValidator: () => (value) => !value ? "Required" : undefined,
      },
    )();
    expect(banana).toHaveBeenCalled();
    expect(banana).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

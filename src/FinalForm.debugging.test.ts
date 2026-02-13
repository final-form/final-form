import createForm from "./FinalForm";

const onSubmitMock = (values, callback) => {};

describe("FinalForm.debugging", () => {
  it("should allow debug callback on every change", () => {
    const debug = jest.fn();
    const form = createForm({ onSubmit: onSubmitMock, debug });

    form.registerField("foo", () => {});
    expect(debug).toHaveBeenCalledTimes(2);

    form.change("foo", "bar");

    expect(debug).toHaveBeenCalledTimes(3);
  });
});

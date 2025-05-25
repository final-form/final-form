import createForm from "./FinalForm";

describe("Debug field notifications", () => {
  it("should understand how field notifications work", () => {
    const form = createForm({ onSubmit: () => { } });
    const fieldCallback = jest.fn();

    // Register field normally with value subscription
    const unsubscribe = form.registerField("test", fieldCallback, { value: true });

    console.log("After registration, callback called:", fieldCallback.mock.calls.length);

    // Change field value
    form.change("test", "value");

    console.log("After change, callback called:", fieldCallback.mock.calls.length);

    unsubscribe();
  });

  it("should understand how form notifications work", () => {
    const form = createForm({ onSubmit: () => { } });
    const formCallback = jest.fn();

    // Subscribe to form normally with values subscription
    const unsubscribe = form.subscribe(formCallback, { values: true });

    console.log("After subscription, callback called:", formCallback.mock.calls.length);

    // Change field value
    form.change("test", "value");

    console.log("After change, callback called:", formCallback.mock.calls.length);

    unsubscribe();
  });
}); 
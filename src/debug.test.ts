import createForm from "./FinalForm";

describe("Debug field notifications", () => {
  it("should understand how field notifications work", () => {
    const form = createForm({ onSubmit: () => {} });
    const fieldCallback = jest.fn();

    // Register field normally with value subscription
    const unsubscribe = form.registerField("test", fieldCallback, {
      value: true,
    });

    // Change field value
    form.change("test", "value");

    unsubscribe();
  });

  it("should understand how form notifications work", () => {
    const form = createForm({ onSubmit: () => {} });
    const formCallback = jest.fn();

    // Subscribe to form normally with values subscription
    const unsubscribe = form.subscribe(formCallback, { values: true });

    // Change field value
    form.change("test", "value");

    unsubscribe();
  });
});

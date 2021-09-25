import createForm from "./FinalForm";

const onSubmitMock = (values, callback) => {};

describe("FinalForm.batching", () => {
  it("should not call form or field listeners during batch update", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const formListener = jest.fn();
    const firstField = jest.fn();
    const secondField = jest.fn();
    form.subscribe(formListener, { values: true });
    form.registerField("firstField", firstField, { value: true });
    form.registerField("secondField", secondField, { value: true });

    expect(formListener).toHaveBeenCalledTimes(1);
    expect(firstField).toHaveBeenCalledTimes(1);
    expect(secondField).toHaveBeenCalledTimes(1);

    // not in batch DOES notify
    form.change("firstField", "foo");
    expect(formListener).toHaveBeenCalledTimes(2);
    expect(firstField).toHaveBeenCalledTimes(2);
    expect(secondField).toHaveBeenCalledTimes(1);

    form.batch(() => {
      // Do a bunch of stuff
      form.focus("firstField");
      form.change("firstField", "what");
      form.blur("firstField");

      form.focus("secondField");
      form.change("secondField", "bar");
      form.blur("secondField");

      // No listeners called
      expect(formListener).toHaveBeenCalledTimes(2);
      expect(firstField).toHaveBeenCalledTimes(2);
      expect(secondField).toHaveBeenCalledTimes(1);
    });

    // NOW listeners are called
    expect(formListener).toHaveBeenCalledTimes(3);
    expect(firstField).toHaveBeenCalledTimes(3);
    expect(secondField).toHaveBeenCalledTimes(2);

    // not in batch DOES notify
    form.change("secondField", "cat");

    expect(formListener).toHaveBeenCalledTimes(4);
    expect(firstField).toHaveBeenCalledTimes(3);
    expect(secondField).toHaveBeenCalledTimes(3);
  });

  it("should only call listeners that need to be called after batch", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const formListener = jest.fn();
    const firstField = jest.fn();
    const secondField = jest.fn();
    form.subscribe(formListener, { values: true });
    form.registerField("firstField", firstField, { value: true });
    form.registerField("secondField", secondField, { value: true });

    expect(formListener).toHaveBeenCalledTimes(1);
    expect(firstField).toHaveBeenCalledTimes(1);
    expect(secondField).toHaveBeenCalledTimes(1);

    form.batch(() => {
      // only change one field
      form.focus("firstField");
      form.change("firstField", "what");
      form.blur("firstField");

      // No listeners called
      expect(formListener).toHaveBeenCalledTimes(1);
      expect(firstField).toHaveBeenCalledTimes(1);
      expect(secondField).toHaveBeenCalledTimes(1);
    });

    // only listeners that need to be are called
    expect(formListener).toHaveBeenCalledTimes(2);
    expect(firstField).toHaveBeenCalledTimes(2);
    expect(secondField).toHaveBeenCalledTimes(1); // not called
  });

  it("should perform batching correctly with nested batch calls", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const formListener = jest.fn();
    const firstField = jest.fn();
    const secondField = jest.fn();
    form.subscribe(formListener, { values: true });
    form.registerField("firstField", firstField, { value: true });
    form.registerField("secondField", secondField, { value: true });

    expect(formListener).toHaveBeenCalledTimes(1);
    expect(firstField).toHaveBeenCalledTimes(1);
    expect(secondField).toHaveBeenCalledTimes(1);

    form.batch(() => {
      form.batch(() => {
        // change a field
        form.focus("firstField");
        form.change("firstField", "what");
        form.blur("firstField");
      });

      form.batch(() => {
        // change it again
        form.focus("firstField");
        form.change("firstField", "the");
        form.blur("firstField");
      });

      form.batch(() => {
        // and a third time
        form.focus("firstField");
        form.change("firstField", "foo");
        form.blur("firstField");
      });

      // No listeners called
      expect(formListener).toHaveBeenCalledTimes(1);
      expect(firstField).toHaveBeenCalledTimes(1);
      expect(secondField).toHaveBeenCalledTimes(1);
    });

    // only listeners that need to be are called, and only once for the whole batch
    expect(formListener).toHaveBeenCalledTimes(2);
    expect(firstField).toHaveBeenCalledTimes(2);
    expect(secondField).toHaveBeenCalledTimes(1); // not called
  });
});

import createForm from "./FinalForm";

const onSubmitMock = (values, callback) => { };

describe("FinalForm.batching", () => {
  [new Error("callback failed"), undefined].forEach((callbackError) => {
    it(`should preserve ${String(callbackError)} when debug cleanup throws`, () => {
      const cleanupError = new Error("cleanup failed");
      let shouldThrow = false;
      let cleanupFailed = false;
      const form = createForm({
        onSubmit: onSubmitMock,
        debug: () => {
          if (shouldThrow) {
            cleanupFailed = true;
            throw cleanupError;
          }
        },
      });
      let didThrow = false;
      let caught: unknown;

      try {
        form.batch(() => {
          form.change("firstField", "before error");
          shouldThrow = true;
          throw callbackError;
        });
      } catch (error) {
        didThrow = true;
        caught = error;
      }

      expect(cleanupFailed).toBe(true);
      expect(didThrow).toBe(true);
      expect(caught).toBe(callbackError);
    });
  });

  it("should propagate debug cleanup errors when the batch callback succeeds", () => {
    const cleanupError = new Error("cleanup failed");
    let shouldThrow = false;
    const form = createForm({
      onSubmit: onSubmitMock,
      debug: () => {
        if (shouldThrow) {
          throw cleanupError;
        }
      },
    });
    let didThrow = false;
    let caught: unknown;

    try {
      form.batch(() => {
        form.change("firstField", "before error");
        shouldThrow = true;
      });
    } catch (error) {
      didThrow = true;
      caught = error;
    }

    expect(didThrow).toBe(true);
    expect(caught).toBe(cleanupError);
  });

  it("should resume notifications after a batch callback throws", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const formListener = jest.fn();
    const fieldListener = jest.fn();
    form.subscribe(formListener, { values: true });
    form.registerField("firstField", fieldListener, { value: true });
    const error = new Error("update failed");

    expect(() =>
      form.batch(() => {
        form.change("firstField", "before error");
        throw error;
      }),
    ).toThrow(error);

    expect(formListener).toHaveBeenCalledTimes(2);
    expect(fieldListener).toHaveBeenCalledTimes(2);
    expect(fieldListener.mock.calls[1][0].value).toBe("before error");

    form.change("firstField", "after error");
    expect(formListener).toHaveBeenCalledTimes(3);
    expect(fieldListener).toHaveBeenCalledTimes(3);
    expect(fieldListener.mock.calls[2][0].value).toBe("after error");
  });

  it("should keep an outer batch active after a nested batch throws", () => {
    const form = createForm({ onSubmit: onSubmitMock });
    const listener = jest.fn();
    form.subscribe(listener, { values: true });

    form.batch(() => {
      expect(() =>
        form.batch(() => {
          form.change("firstField", "inner");
          throw new Error("inner failed");
        }),
      ).toThrow("inner failed");
      form.change("firstField", "outer");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].values).toEqual({ firstField: "outer" });
  });

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

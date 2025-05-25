import createForm from "./FinalForm";

const onSubmitMock = (values: any) => { };

describe("FinalForm.async.validation", () => {
  it("should handle async field registration with form-level validation", (done) => {
    const form = createForm({
      onSubmit: onSubmitMock,
      validate: (values) => {
        const errors: any = {};
        if (!values.username) {
          errors.username = "Required";
        }
        return errors;
      }
    });

    const spy = jest.fn();

    form.registerField("username", spy, { error: true, value: true }, { async: true });

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].error).toBe("Required");
      expect(spy.mock.calls[0][0].value).toBeUndefined();
      done();
    }, 10);
  });

  it("should handle async field registration with field-level validation", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();

    form.registerField(
      "email",
      spy,
      { error: true, value: true },
      {
        async: true,
        getValidator: () => (value: any) => {
          if (!value) return "Required";
          if (!value.includes("@")) return "Invalid email";
          return undefined;
        }
      }
    );

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].error).toBe("Required");

      // Test changing value
      const { change } = spy.mock.calls[0][0];
      change("invalid");

      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls[1][0].error).toBe("Invalid email");

        change("valid@email.com");

        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.mock.calls[2][0].error).toBeUndefined();
          done();
        }, 10);
      }, 10);
    }, 10);
  });

  it("should handle async field registration with async validation", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const spy = jest.fn();

    form.registerField(
      "asyncField",
      spy,
      { error: true, value: true, validating: true },
      {
        async: true,
        getValidator: () => (value: any) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(value ? undefined : "Async validation failed");
            }, 20);
          });
        }
      }
    );

    setTimeout(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].validating).toBe(true);

      // Wait for async validation to complete
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.mock.calls[1][0].validating).toBe(false);
        expect(spy.mock.calls[1][0].error).toBe("Async validation failed");
        done();
      }, 50);
    }, 10);
  });

  it("should handle silent async field registration", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const formSpy = jest.fn();
    const fieldSpy = jest.fn();

    form.subscribe(formSpy, { values: true });
    expect(formSpy).toHaveBeenCalledTimes(1);

    form.registerField(
      "silentField",
      fieldSpy,
      { value: true },
      {
        async: true,
        silent: true,
        initialValue: "test"
      }
    );

    // Form listener should not be called for silent registration
    expect(formSpy).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(fieldSpy).toHaveBeenCalledTimes(1);
      expect(fieldSpy.mock.calls[0][0].value).toBe("test");
      // Form listener still should not have been called
      expect(formSpy).toHaveBeenCalledTimes(1);
      done();
    }, 10);
  });

  it("should handle async field registration with validateFields", (done) => {
    const form = createForm({ onSubmit: onSubmitMock });
    const fooSpy = jest.fn();
    const barSpy = jest.fn();

    // Register foo field with validateFields pointing to bar
    form.registerField(
      "foo",
      fooSpy,
      { error: true },
      {
        async: true,
        validateFields: ["bar"],
        getValidator: () => (value: any) => value ? undefined : "Foo required"
      }
    );

    // Register bar field
    form.registerField(
      "bar",
      barSpy,
      { error: true },
      {
        async: true,
        getValidator: () => (value: any) => value ? undefined : "Bar required"
      }
    );

    setTimeout(() => {
      expect(fooSpy).toHaveBeenCalledTimes(1);
      expect(barSpy).toHaveBeenCalledTimes(1);
      expect(fooSpy.mock.calls[0][0].error).toBe("Foo required");
      expect(barSpy.mock.calls[0][0].error).toBe("Bar required");

      // Change foo value - should validate foo field
      const { change } = fooSpy.mock.calls[0][0];
      change("foo value");

      setTimeout(() => {
        // Foo should have been re-validated
        expect(fooSpy).toHaveBeenCalledTimes(2);
        expect(fooSpy.mock.calls[1][0].error).toBeUndefined();
        done();
      }, 10);
    }, 10);
  });
}); 
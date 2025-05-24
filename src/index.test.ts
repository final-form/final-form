// tslint:disable no-console
import { Config, createForm, Mutator } from "./index";

describe("TypeScript types", () => {
  test("form creation and submission", () => {
    interface FormValues {
      foo: string;
      bar?: number;
    }

    const onSubmit = jest.fn((values: FormValues) => {
      // Verify the submitted values have the correct type
      // values.foo is required but might be undefined if no initial value is provided
      if (values.foo !== undefined) {
        expect(typeof values.foo).toBe("string");
      }
      if (values.bar !== undefined) {
        expect(typeof values.bar).toBe("number");
      }
    });

    const form = createForm<FormValues>({
      initialValues: { foo: "bar" },
      onSubmit,
    });

    const formState = form.getState();

    // Test form creation with onSubmit
    createForm<FormValues>({
      onSubmit(formData) {
        if (formData.foo !== undefined) {
          expect(typeof formData.foo).toBe("string");
        }
        if (formData.bar !== undefined) {
          expect(typeof formData.bar).toBe("number");
        }
      },
    });

    // Test with initialValues
    createForm<FormValues>({
      initialValues: { foo: "baz", bar: 0 },
      onSubmit(formData) {
        expect(formData.foo).toBe("baz");
        expect(formData.bar).toBe(0);
      },
    });

    // Test validate function
    createForm<FormValues>({
      onSubmit,
      validate(formData) {
        // formData.foo might be undefined during initial validation
        if (formData.foo !== undefined) {
          expect(typeof formData.foo).toBe("string");
        }
        if (formData.bar !== undefined) {
          expect(typeof formData.bar).toBe("number");
        }
        return formData;
      },
    });

    createForm<FormValues>({
      onSubmit,
      validate() {
        return undefined;
      },
    });

    // Test submit promise
    const submitPromise = createForm<FormValues>({ onSubmit }).submit();
    if (submitPromise) {
      submitPromise.then((formData) => {
        if (formData) {
          if (formData.foo !== undefined) {
            expect(typeof formData.foo).toBe("string");
          }
          if (formData.bar !== undefined) {
            expect(typeof formData.bar).toBe("number");
          }
        }
      });
    }

    // Test initialize
    const form6 = createForm<FormValues>({ onSubmit });
    form6.initialize({ foo: "baz", bar: 11 });
    form6.initialize({ foo: undefined });
    form6.initialize((formData) => ({
      ...formData,
      bar: 12,
    }));
    form6.initialize((formData) => ({
      ...formData,
      foo: undefined,
    }));

    // Test restart
    const form7 = createForm<FormValues>({ onSubmit });
    form7.restart({ foo: "baz", bar: 11 });
    form7.restart({ foo: undefined });

    // Test form state properties
    expect(formState.active === undefined || typeof formState.active === "string").toBe(true);
    expect(typeof formState.dirty).toBe("boolean");
    expect(typeof formState.dirtyFields).toBe("object");
    expect(formState.dirtyFields).toBeDefined();
    expect(typeof formState.dirtyFieldsSinceLastSubmit).toBe("object");
    expect(formState.dirtyFieldsSinceLastSubmit).toBeDefined();
    expect(typeof formState.dirtySinceLastSubmit).toBe("boolean");

    // Test error property
    if (formState.error) {
      expect(
        typeof formState.error === "string" ||
        typeof formState.error === "boolean" ||
        typeof formState.error === "object"
      ).toBe(true);
    }

    if (formState.errors) {
      expect(typeof formState.errors).toBe("object");
    }

    if (formState.initialValues) {
      expect(typeof formState.initialValues).toBe("object");
    }

    expect(typeof formState.invalid).toBe("boolean");
    expect(typeof formState.pristine).toBe("boolean");

    // Test submitError
    if (formState.submitError !== undefined) {
      expect(
        typeof formState.submitError === "string" ||
        typeof formState.submitError === "object"
      ).toBe(true);
    }

    if (formState.submitErrors) {
      expect(typeof formState.submitErrors).toBe("object");
    }

    expect(typeof formState.submitFailed).toBe("boolean");
    expect(typeof formState.submitSucceeded).toBe("boolean");
    expect(typeof formState.submitting).toBe("boolean");
    expect(typeof formState.valid).toBe("boolean");
    expect(typeof formState.validating).toBe("boolean");

    if (formState.values) {
      expect(typeof formState.values).toBe("object");
    }
  });

  test("form with different types", () => {
    interface FormValues2 {
      a: string;
      b: boolean;
      c: number;
    }

    const initialValues: Config<FormValues2>["initialValues"] = {
      a: "a",
      b: true,
      c: 1,
    };

    const onSubmit2 = jest.fn((values: FormValues2) => {
      // Just verify the types are correct
      expect(typeof values.a).toBe("string");
      expect(typeof values.b).toBe("boolean");
      expect(typeof values.c).toBe("number");
    });

    let form2 = createForm<FormValues2>({ onSubmit: onSubmit2, initialValues });
    const formState2 = form2.getState();

    expect(typeof formState2.pristine).toBe("boolean");
    expect(typeof formState2.dirty).toBe("boolean");

    // Test subscription
    form2 = createForm<FormValues2>({ onSubmit: onSubmit2, initialValues });
    const subscriber = jest.fn();
    form2.subscribe(subscriber, { pristine: true });

    // Test mutators
    const setValue: Mutator<FormValues2> = (
      [name, newValue],
      state,
      { changeValue },
    ) => {
      changeValue(state, name, () => newValue);
    };

    type Mutators = {
      setValue: (name: string, value: string) => void;
    };

    form2 = createForm<FormValues2>({
      mutators: { setValue },
      onSubmit: onSubmit2,
    });

    // Get form.mutators cast to Mutators
    const mutators: Mutators = form2.mutators as Mutators;
    expect(typeof mutators.setValue).toBe("function");

    // Call the mutator
    mutators.setValue("firstName", "Kevin");
  });
});

import createForm from "./FinalForm";

const onSubmitMock = (values: any) => {};

describe("FinalForm.useSyncExternalStore", () => {
  describe("subscribeFieldState and getFieldSnapshot", () => {
    it("should provide useSyncExternalStore compatible field API", () => {
      const form = createForm({ onSubmit: onSubmitMock });
      const onChange = jest.fn();

      // Subscribe to field state changes
      const unsubscribe = form.subscribeFieldState("username", onChange, {
        value: true,
      });

      // registerField calls the callback immediately with initial state
      expect(onChange).toHaveBeenCalledTimes(1);

      // Get initial snapshot
      let snapshot = form.getFieldSnapshot("username");
      expect(snapshot).toBeDefined();
      expect(snapshot?.name).toBe("username");
      expect(snapshot?.value).toBeUndefined();
      expect(snapshot?.pristine).toBe(true);

      // Change field value
      form.change("username", "john");

      // onChange should be called again
      expect(onChange).toHaveBeenCalledTimes(2);

      // Get updated snapshot
      snapshot = form.getFieldSnapshot("username");
      expect(snapshot?.value).toBe("john");
      expect(snapshot?.pristine).toBe(false);

      unsubscribe();
    });

    it("should handle multiple subscribers to the same field", () => {
      const form = createForm({ onSubmit: onSubmitMock });
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();

      const unsubscribe1 = form.subscribeFieldState("email", onChange1, {
        value: true,
      });
      const unsubscribe2 = form.subscribeFieldState("email", onChange2, {
        value: true,
      });

      form.change("email", "test@example.com");

      expect(onChange1).toHaveBeenCalledTimes(2); // Initial + change
      expect(onChange2).toHaveBeenCalledTimes(2); // Initial + change

      unsubscribe1();

      form.change("email", "updated@example.com");

      expect(onChange1).toHaveBeenCalledTimes(2); // No longer called
      expect(onChange2).toHaveBeenCalledTimes(3); // Still called

      unsubscribe2();
    });

    it("should clean up field when no more subscribers", () => {
      const form = createForm({ onSubmit: onSubmitMock });
      const onChange = jest.fn();

      const unsubscribe = form.subscribeFieldState("temp", onChange, {
        value: true,
      });

      // Field should exist
      expect(form.getRegisteredFields()).toContain("temp");

      unsubscribe();

      // Field should be cleaned up
      expect(form.getRegisteredFields()).not.toContain("temp");
    });

    it("should return undefined snapshot for non-existent field", () => {
      const form = createForm({ onSubmit: onSubmitMock });

      const snapshot = form.getFieldSnapshot("nonexistent");
      expect(snapshot).toBeUndefined();
    });

    it("should work with field validation", () => {
      const form = createForm({
        onSubmit: onSubmitMock,
        validate: (values) => {
          const errors: any = {};
          if (!values.required) {
            errors.required = "This field is required";
          }
          return errors;
        },
      });

      const onChange = jest.fn();
      const unsubscribe = form.subscribeFieldState("required", onChange, {
        error: true,
        value: true,
      });

      let snapshot = form.getFieldSnapshot("required");
      expect(snapshot?.error).toBe("This field is required");

      form.change("required", "value");
      expect(onChange).toHaveBeenCalled();

      snapshot = form.getFieldSnapshot("required");
      expect(snapshot?.error).toBeUndefined();

      unsubscribe();
    });
  });

  describe("subscribeFormState and getFormSnapshot", () => {
    it("should provide useSyncExternalStore compatible form API", () => {
      const form = createForm({ onSubmit: onSubmitMock });
      const onChange = jest.fn();

      // Subscribe to form state changes
      const unsubscribe = form.subscribeFormState(onChange, {
        values: true,
        pristine: true,
      });

      // subscribe calls the callback immediately with initial state
      expect(onChange).toHaveBeenCalledTimes(1);

      // Get initial snapshot
      let snapshot = form.getFormSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.pristine).toBe(true);
      expect(snapshot.values).toEqual({});

      // Register a field first so changes affect pristine state
      form.subscribeFieldState("field", () => {}, { value: true });

      // Change form state
      form.change("field", "value");

      // onChange should be called again (initial + change)
      expect(onChange).toHaveBeenCalledTimes(2);

      // Get updated snapshot
      snapshot = form.getFormSnapshot();
      expect(snapshot.pristine).toBe(false);
      expect(snapshot.values).toEqual({ field: "value" });

      unsubscribe();
    });

    it("should handle multiple form subscribers", () => {
      const form = createForm({ onSubmit: onSubmitMock });
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();

      const unsubscribe1 = form.subscribeFormState(onChange1, { values: true });
      const unsubscribe2 = form.subscribeFormState(onChange2, { values: true });

      form.change("test", "value");

      expect(onChange1).toHaveBeenCalledTimes(2); // Initial + change
      expect(onChange2).toHaveBeenCalledTimes(2); // Initial + change

      unsubscribe1();

      form.change("test", "updated");

      expect(onChange1).toHaveBeenCalledTimes(2); // No longer called
      expect(onChange2).toHaveBeenCalledTimes(3); // Still called

      unsubscribe2();
    });

    it("should work with form validation", () => {
      const form = createForm({
        onSubmit: onSubmitMock,
        validate: (values) => {
          const errors: any = {};
          if (!values.username) {
            errors.username = "Username required";
          }
          return errors;
        },
      });

      const onChange = jest.fn();
      const unsubscribe = form.subscribeFormState(onChange, {
        valid: true,
        errors: true,
      });

      let snapshot = form.getFormSnapshot();
      expect(snapshot.valid).toBe(false);
      expect(snapshot.errors?.username).toBe("Username required");

      form.change("username", "john");
      expect(onChange).toHaveBeenCalled();

      snapshot = form.getFormSnapshot();
      expect(snapshot.valid).toBe(true);
      expect(snapshot.errors?.username).toBeUndefined();

      unsubscribe();
    });
  });

  describe("React.useSyncExternalStore integration example", () => {
    it("should work with useSyncExternalStore pattern", () => {
      const form = createForm({ onSubmit: onSubmitMock });

      // Simulate React.useSyncExternalStore usage
      const mockUseSyncExternalStore = (
        subscribe: (onChange: () => void) => () => void,
        getSnapshot: () => any,
      ) => {
        const onChange = jest.fn();
        const unsubscribe = subscribe(onChange);
        const snapshot = getSnapshot();

        return { onChange, unsubscribe, snapshot };
      };

      // For field state
      const fieldStore = mockUseSyncExternalStore(
        (onChange) =>
          form.subscribeFieldState("username", onChange, { value: true }),
        () => form.getFieldSnapshot("username"),
      );

      expect(fieldStore.snapshot?.name).toBe("username");
      expect(fieldStore.snapshot?.value).toBeUndefined();

      // For form state
      const formStore = mockUseSyncExternalStore(
        (onChange) =>
          form.subscribeFormState(onChange, { pristine: true, values: true }),
        () => form.getFormSnapshot(),
      );

      expect(formStore.snapshot.pristine).toBe(true);
      expect(formStore.snapshot.values).toEqual({});

      // Change field value
      form.change("username", "john");

      // Both stores should be notified
      expect(fieldStore.onChange).toHaveBeenCalledTimes(2); // Initial + change
      expect(formStore.onChange).toHaveBeenCalledTimes(2); // Initial + change

      // Clean up
      fieldStore.unsubscribe();
      formStore.unsubscribe();
    });
  });
});

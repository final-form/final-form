/**
 * Example: Using Final Form with React.useSyncExternalStore
 *
 * This example demonstrates how to use Final Form's new useSyncExternalStore
 * compatible API to avoid React warnings about setState during render phase.
 */

import React from "react";
import createForm from "../src/FinalForm";

// Custom hook that uses useSyncExternalStore with Final Form
function useFormState(
  form,
  subscription = {
    values: true,
    pristine: true,
    valid: true,
    submitting: true,
  },
) {
  return React.useSyncExternalStore(
    // subscribe function
    (onChange) => form.subscribeFormState(onChange, subscription),
    // getSnapshot function
    () => form.getFormSnapshot(),
  );
}

// Custom hook for field state
function useFieldState(
  form,
  fieldName,
  subscription = { value: true, error: true, touched: true },
) {
  return React.useSyncExternalStore(
    // subscribe function
    (onChange) => form.subscribeFieldState(fieldName, onChange, subscription),
    // getSnapshot function
    () => form.getFieldSnapshot(fieldName),
  );
}

// Example React component using the hooks
function MyForm() {
  // Create form instance (typically done once, maybe with useMemo)
  const form = React.useMemo(
    () =>
      createForm({
        onSubmit: (values) => {
          console.log("Submitted:", values);
          return new Promise((resolve) => setTimeout(resolve, 1000));
        },
        validate: (values) => {
          const errors = {};
          if (!values.username) {
            errors.username = "Username is required";
          }
          if (!values.email) {
            errors.email = "Email is required";
          } else if (!/\S+@\S+\.\S+/.test(values.email)) {
            errors.email = "Email is invalid";
          }
          return errors;
        },
      }),
    [],
  );

  // Subscribe to form state using useSyncExternalStore
  const formState = useFormState(form);

  // Subscribe to individual field states
  const usernameField = useFieldState(form, "username");
  const emailField = useFieldState(form, "email");

  const handleSubmit = (e) => {
    e.preventDefault();
    form.submit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Username:
          <input
            type="text"
            value={usernameField?.value || ""}
            onChange={(e) => form.change("username", e.target.value)}
            onBlur={() => form.blur("username")}
            onFocus={() => form.focus("username")}
          />
        </label>
        {usernameField?.error && (
          <div style={{ color: "red" }}>{usernameField.error}</div>
        )}
      </div>

      <div>
        <label>
          Email:
          <input
            type="email"
            value={emailField?.value || ""}
            onChange={(e) => form.change("email", e.target.value)}
            onBlur={() => form.blur("email")}
            onFocus={() => form.focus("email")}
          />
        </label>
        {emailField?.error && (
          <div style={{ color: "red" }}>{emailField.error}</div>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={formState.submitting || !formState.valid}
        >
          {formState.submitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      <div>
        <h3>Form State:</h3>
        <pre>{JSON.stringify(formState, null, 2)}</pre>
      </div>
    </form>
  );
}

// Alternative: Generic hook for any form subscription
function useFormSubscription(form, subscription) {
  return React.useSyncExternalStore(
    (onChange) => form.subscribe(() => onChange(), subscription),
    () => {
      const state = form.getState();
      // Filter state based on subscription
      const result = {};
      Object.keys(subscription).forEach((key) => {
        if (subscription[key]) {
          result[key] = state[key];
        }
      });
      return result;
    },
  );
}

// Alternative: Generic hook for any field subscription
function useFieldSubscription(form, fieldName, subscription) {
  return React.useSyncExternalStore(
    (onChange) => form.registerField(fieldName, () => onChange(), subscription),
    () => {
      const fieldState = form.getFieldState(fieldName);
      if (!fieldState) return undefined;

      // Filter field state based on subscription
      const result = {};
      Object.keys(subscription).forEach((key) => {
        if (subscription[key]) {
          result[key] = fieldState[key];
        }
      });
      return result;
    },
  );
}

// Example using the generic hooks
function MyFormWithCustomSubscriptions() {
  const form = React.useMemo(
    () =>
      createForm({
        onSubmit: (values) => console.log("Submitted:", values),
      }),
    [],
  );

  // Subscribe only to specific form properties
  const { values, valid, submitting } = useFormSubscription(form, {
    values: true,
    valid: true,
    submitting: true,
  });

  // Subscribe only to specific field properties
  const { value: usernameValue, error: usernameError } =
    useFieldSubscription(form, "username", { value: true, error: true }) || {};

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
    >
      <input
        type="text"
        value={usernameValue || ""}
        onChange={(e) => form.change("username", e.target.value)}
        placeholder="Username"
      />
      {usernameError && <div style={{ color: "red" }}>{usernameError}</div>}

      <button type="submit" disabled={submitting || !valid}>
        {submitting ? "Submitting..." : "Submit"}
      </button>

      <div>Values: {JSON.stringify(values)}</div>
    </form>
  );
}

export { MyForm, MyFormWithCustomSubscriptions, useFormState, useFieldState };

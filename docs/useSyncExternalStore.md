# React.useSyncExternalStore Integration

Final Form now provides a `React.useSyncExternalStore` compatible API to enable proper integration with React 18+ and avoid warnings about setState during render phase.

## Problem

React Final Form currently triggers React warnings because Final Form's synchronous field registration calls React setState during render phase. React 18+ strict mode shows:

```
Cannot update a component while rendering a different component
```

## Solution

Final Form now provides `useSyncExternalStore` compatible methods that follow the proper subscribe/getSnapshot pattern required by React 18+.

## API

### Form State Integration

#### `subscribeFormState(onChange: () => void, subscription: FormSubscription): Unsubscribe`

Subscribes to specific form state changes. The `onChange` callback will be called whenever any subscribed form state changes.

#### `getFormSnapshot(): FormState`

Returns the current form state snapshot.

### Field State Integration

#### `subscribeFieldState(name: string, onChange: () => void, subscription: FieldSubscription): Unsubscribe`

Subscribes to specific field state changes for a specific field. The `onChange` callback will be called whenever any subscribed field state changes.

#### `getFieldSnapshot(name: string): FieldState | undefined`

Returns the current field state snapshot for a specific field.

## Usage with React.useSyncExternalStore

### Basic Form State Hook

```javascript
import React from "react";
import createForm from "final-form";

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
```

### Basic Field State Hook

```javascript
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
```

### Complete Example

```javascript
import React from "react";
import createForm from "final-form";

function MyForm() {
  const form = React.useMemo(
    () =>
      createForm({
        onSubmit: (values) => console.log("Submitted:", values),
        validate: (values) => {
          const errors = {};
          if (!values.username) {
            errors.username = "Username is required";
          }
          return errors;
        },
      }),
    [],
  );

  // Subscribe to form state
  const formState = React.useSyncExternalStore(
    (onChange) =>
      form.subscribeFormState(onChange, {
        values: true,
        pristine: true,
        valid: true,
        submitting: true,
      }),
    () => form.getFormSnapshot(),
  );

  // Subscribe to field state
  const usernameField = React.useSyncExternalStore(
    (onChange) =>
      form.subscribeFieldState("username", onChange, {
        value: true,
        error: true,
        touched: true,
      }),
    () => form.getFieldSnapshot("username"),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
    >
      <input
        type="text"
        value={usernameField?.value || ""}
        onChange={(e) => form.change("username", e.target.value)}
        onBlur={() => form.blur("username")}
        onFocus={() => form.focus("username")}
      />
      {usernameField?.error && (
        <div style={{ color: "red" }}>{usernameField.error}</div>
      )}

      <button type="submit" disabled={formState.submitting || !formState.valid}>
        {formState.submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## Advanced Usage

### Custom Subscription Hooks

For more granular control, you can create hooks that subscribe to specific form or field properties:

```javascript
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

// Usage
function MyOptimizedForm() {
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
      />
      {usernameError && <div>{usernameError}</div>}

      <button type="submit" disabled={submitting || !valid}>
        Submit
      </button>
    </form>
  );
}
```

## Benefits

1. **React 18+ Compatibility**: Eliminates warnings about setState during render
2. **Proper External Store Integration**: Follows React's recommended patterns for external stores
3. **Performance**: Only re-renders when subscribed state actually changes
4. **Framework Agnostic**: Final Form remains framework-agnostic while providing React-specific integration points
5. **Backward Compatible**: Existing APIs continue to work unchanged

## Migration from React Final Form

If you're currently using React Final Form and want to migrate to this approach:

1. Replace `useField` hooks with `useFieldState` + `useSyncExternalStore`
2. Replace `useForm` hooks with `useFormState` + `useSyncExternalStore`
3. Use the form methods (`change`, `blur`, `focus`, etc.) directly instead of field props
4. Handle form submission using `form.submit()` directly

This approach gives you more control over when and how components re-render while maintaining full compatibility with React 18+ concurrent features.

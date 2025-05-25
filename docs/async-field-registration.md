# Async Field Registration API

Final Form now supports asynchronous field registration to enable compatibility with React 18+ and the `useSyncExternalStore` pattern. This feature helps avoid React warnings about setState during render phase.

## Problem

React Final Form currently triggers React warnings because Final Form's synchronous field registration calls React setState during render phase. React 18+ strict mode shows:

```
Cannot update a component while rendering a different component
```

## Solution

Final Form now provides an async registration option that defers callback execution until after the current synchronous execution context.

## API

### FieldConfig.async

Add an `async: true` property to the field configuration to defer callback execution:

```javascript
form.registerField("fieldName", callback, subscription, {
  async: true, // Defer callback execution
  // ... other config options
});
```

### Config.callbackScheduler

Provide a custom callback scheduler when creating the form:

```javascript
const form = createForm({
  onSubmit: handleSubmit,
  callbackScheduler: (callback) => {
    // Custom scheduling logic
    React.startTransition(callback);
    // or setTimeout(callback, 0);
  },
});
```

### FormApi.setCallbackScheduler

Set or change the callback scheduler after form creation:

```javascript
form.setCallbackScheduler((callback) => {
  React.startTransition(callback);
});
```

### FormApi.setConfig

Set the callback scheduler using the existing setConfig method:

```javascript
form.setConfig("callbackScheduler", (callback) => {
  React.startTransition(callback);
});
```

## Usage Examples

### Basic Async Registration

```javascript
import createForm from "final-form";

const form = createForm({
  onSubmit: (values) => console.log(values),
});

// Async field registration
form.registerField(
  "username",
  (fieldState) => {
    // This callback will be executed asynchronously
    console.log("Field state:", fieldState);
  },
  { value: true, error: true },
  {
    async: true,
    getValidator: () => (value) => (value ? undefined : "Required"),
  },
);
```

### React Integration

For React Final Form integration, you can use React's scheduling:

```javascript
import { startTransition } from "react";

const form = createForm({
  onSubmit: handleSubmit,
  callbackScheduler: (callback) => {
    startTransition(callback);
  },
});

// All async field registrations will use React's scheduler
form.registerField("field", callback, subscription, { async: true });
```

### Mixed Sync and Async

You can mix synchronous and asynchronous field registrations:

```javascript
// Synchronous (default behavior)
form.registerField("syncField", callback, subscription);

// Asynchronous
form.registerField("asyncField", callback, subscription, { async: true });
```

## Implementation Details

### Callback Batching

Multiple async callbacks registered in the same synchronous execution context are batched together and executed in a single scheduled callback. This improves performance and maintains execution order.

### Execution Order

Async callbacks are executed in the order they were registered, preserving predictable behavior.

### Default Scheduler

If no custom scheduler is provided, async callbacks use `setTimeout(callback, 0)` by default.

### Backward Compatibility

The async field registration is completely opt-in. Existing code continues to work without any changes:

- `async: false` or omitted: Synchronous behavior (default)
- `async: true`: Asynchronous behavior

## Benefits for React Final Form

1. **Eliminates setState-during-render warnings** in React 18+
2. **Enables proper `useSyncExternalStore` integration**
3. **Future-proofs against React making warnings into errors**
4. **Maintains Final Form's framework-agnostic nature**
5. **Provides fine-grained control** over callback scheduling

## Migration Guide

### For Library Authors (React Final Form)

```javascript
// Before
form.registerField(name, callback, subscription, config);

// After (for React 18+ compatibility)
form.setCallbackScheduler((callback) => {
  React.startTransition(callback);
});

form.registerField(name, callback, subscription, {
  ...config,
  async: true,
});
```

### For End Users

No changes required unless you want to opt into async behavior for specific fields or provide a custom scheduler.

## Performance Considerations

- Async callbacks have minimal overhead (single setTimeout or custom scheduler call)
- Batching reduces the number of scheduler calls
- Synchronous behavior remains unchanged for maximum performance when async is not needed

## Browser Support

The async field registration API works in all environments that support Final Form, as it uses standard JavaScript scheduling mechanisms.

/**
 * Example: Async Field Registration for React 18+ Compatibility
 *
 * This example demonstrates how to use Final Form's async field registration
 * to avoid React warnings about setState during render phase.
 */

import createForm from "../src/FinalForm";

// Example 1: Basic async registration
console.log("=== Example 1: Basic Async Registration ===");

const form1 = createForm({
  onSubmit: (values) => {
    console.log("Submitted:", values);
  },
});

// Register field with async: true to defer callback execution
form1.registerField(
  "username",
  (fieldState) => {
    console.log("Username field state:", fieldState.value, fieldState.error);
  },
  { value: true, error: true },
  {
    async: true, // Defer callback execution
    getValidator: () => (value) => (value ? undefined : "Required"),
  },
);

console.log("Field registered, callback will execute asynchronously...");

// Example 2: Custom callback scheduler (for React integration)
console.log("\n=== Example 2: Custom Callback Scheduler ===");

const form2 = createForm({
  onSubmit: (values) => {
    console.log("Submitted:", values);
  },
  // Custom scheduler that could use React.startTransition
  callbackScheduler: (callback) => {
    console.log("Scheduling callback with custom scheduler");
    // In React Final Form, this could be:
    // React.startTransition(callback);
    setTimeout(callback, 0);
  },
});

form2.registerField(
  "email",
  (fieldState) => {
    console.log("Email field state:", fieldState.value);
  },
  { value: true },
  { async: true, initialValue: "user@example.com" },
);

// Example 3: Setting scheduler after form creation
console.log("\n=== Example 3: Setting Scheduler After Creation ===");

const form3 = createForm({
  onSubmit: (values) => {
    console.log("Submitted:", values);
  },
});

// Set scheduler using setCallbackScheduler method
form3.setCallbackScheduler((callback) => {
  console.log("Using setCallbackScheduler");
  setTimeout(callback, 0);
});

form3.registerField(
  "password",
  (fieldState) => {
    console.log("Password field state:", fieldState.value);
  },
  { value: true },
  { async: true },
);

// Example 4: Setting scheduler using setConfig
console.log("\n=== Example 4: Setting Scheduler via setConfig ===");

const form4 = createForm({
  onSubmit: (values) => {
    console.log("Submitted:", values);
  },
});

// Set scheduler using setConfig method
form4.setConfig("callbackScheduler", (callback) => {
  console.log("Using setConfig for scheduler");
  setTimeout(callback, 0);
});

form4.registerField(
  "confirmPassword",
  (fieldState) => {
    console.log("Confirm password field state:", fieldState.value);
  },
  { value: true },
  { async: true },
);

// Example 5: Mixed sync and async registrations
console.log("\n=== Example 5: Mixed Sync and Async ===");

const form5 = createForm({
  onSubmit: (values) => {
    console.log("Submitted:", values);
  },
});

// Synchronous registration (default behavior)
form5.registerField(
  "syncField",
  (fieldState) => {
    console.log("Sync field (immediate):", fieldState.value);
  },
  { value: true },
);

// Asynchronous registration
form5.registerField(
  "asyncField",
  (fieldState) => {
    console.log("Async field (deferred):", fieldState.value);
  },
  { value: true },
  { async: true },
);

console.log(
  "Sync field callback executed immediately, async field callback will execute later...",
);

// Wait a bit to see async callbacks execute
setTimeout(() => {
  console.log("\n=== All async callbacks should have executed by now ===");
}, 100);

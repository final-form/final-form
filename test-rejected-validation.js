const { default: createForm } = require('./dist/final-form.cjs.js');

async function test() {
  console.log('Testing form-level rejected validation...');
  
  const validationError = new Error("Form validation failed");
  const form = createForm({
    onSubmit: (values) => {
      console.log('onSubmit called with:', values);
    },
    validate: () => {
      console.log('validate called, will reject');
      return Promise.reject(validationError);
    },
  });

  const field = () => {};
  form.registerField("username", field, { error: true, validating: true });

  console.log('Changing value...');
  form.change("username", "test");

  // Wait for async validation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const state1 = form.getState();
  console.log('State after change:', {
    validating: state1.validating,
    error: state1.error,
    errors: state1.errors
  });

  console.log('Submitting...');
  const submitPromise = form.submit();
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const state2 = form.getState();
  console.log('State after submit:', {
    validating: state2.validating,
    error: state2.error,
    errors: state2.errors,
    submitting: state2.submitting
  });
}

test().catch(console.error);

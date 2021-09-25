# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/getting-started). Links may not work on Github.com.

# Getting Started

Before we jump right into code, you might want to learn a little bit about the [philosophy](philosophy) and origin story of Final Form.

## Installation

```bash
npm install --save final-form
```

or

```bash
yarn add final-form
```

## Usage

The general idea is that you create a "form instance" with `createForm()`, which you can then `subscribe()` to as many times as you like, and then you can `registerField()` as many fields as your need, including registering more than once to the same field. You can then call `submit()` to call your `onSubmit` function with the values of the form.

```js
import { createForm } from 'final-form'

// Create Form
const form = createForm({
  initialValues,
  onSubmit, // required
  validate
})

// Subscribe to form state updates
const unsubscribe = form.subscribe(
  formState => {
    // Update UI
  },
  { // FormSubscription: the list of values you want to be updated about
    dirty: true,
    valid: true,
    values: true
  }
)

// Subscribe to field state updates
const unregisterField = form.registerField(
  'username',
  fieldState => {
    // Update field UI
    const { blur, change, focus, ...rest } = fieldState
    // In addition to the values you subscribe to, field state also
    // includes functions that your inputs need to update their state.
  },
  { // FieldSubscription: the list of values you want to be updated about
    active: true,
    dirty: true,
    touched: true,
    valid: true,
    value: true
  }
)

// Submit
form.submit() // only submits if all validation passes
```

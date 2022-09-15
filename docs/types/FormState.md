# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/FormState). Links may not work on Github.com.

# `FormState`

`FormState` is an object containing the following values. **Depending on your subscription when calling [`form.subscribe()`](FormApi#subscribe), some of the values may not be present.**


## About fields
### `active`

```ts
string
```

The name of the currently active field. `undefined` if none are active.

### `visited`

```ts
{ [string]: boolean }
```

An object full of booleans, with a boolean value for each field name denoting whether that field is `visited` or not. Note that this is a flat object, so if your field name is `addresses.shipping.street`, the `visited` value for that field will be available under `visited['addresses.shipping.street']`.

### `touched`

```ts
{ [string]: boolean }
```

An object full of booleans, with a boolean value for each field name denoting whether that field is `touched` or not. Note that this is a flat object, so if your field name is `addresses.shipping.street`, the `touched` value for that field will be available under `touched['addresses.shipping.street']`.

## About values

### `values`

```ts
FormValues
```

The current values of the form.

### `initialValues`

```ts
FormValues
```

The values the form was initialized with. `undefined` if the form was never
initialized.

### `modified`

```ts
{ [string]: boolean }
```

An object full of booleans, with a boolean value for each field name denoting whether that field is `modified` or not. Note that this is a flat object, so if your field name is `addresses.shipping.street`, the `modified` value for that field will be available under `modified['addresses.shipping.street']`.

### `modifiedSinceLastSubmit`

```ts
boolean
```

true if the form values have ever been changed since the last submission. false otherwise.

## About dirtyness

### `pristine`

```ts
boolean
```

`true` if the form values are the same as the initial values. `false` otherwise.
Comparison is done with shallow-equals.

`pristine === !dirty`

### `dirty`

```ts
boolean
```

`true` if the form values are different from the values it was initialized with. `false` otherwise. Comparison is done with shallow-equals.

### `dirtyFields`

```ts
{ [string]: boolean }
```

An object full of booleans, with a value of `true` for each `dirty` field. _Pristine fields will not appear in this object_. Note that this is a flat object, so if your field name is `addresses.shipping.street`, the `dirty` value for that field will be available under `dirty['addresses.shipping.street']`.

### `dirtySinceLastSubmit`

```ts
boolean
```

`true` if the form values are different from the values it was last submitted with. `false` otherwise. Comparison is done with shallow-equals.

### `dirtyFieldsSinceLastSubmit`

```ts
{ [string]: boolean }
```

An object full of booleans, with a value of `true` for each field that has a different value from the one when the form was last submitted. _Pristine (since last submit) fields will not appear in this object_. Note that this is a flat object, so if your field name is `addresses.shipping.street`, the `dirtySinceLastSubmit` value for that field will be available under `dirty['addresses.shipping.street']`.

## About validness

### `valid`

```ts
boolean
```

`true` if neither the form nor any of its fields has a validation or submission
error. `false` otherwise. Note that a form can be invalid even if the errors do
not belong to any currently registered fields.

`valid === !invalid`

### `invalid`

```ts
boolean
```

`true` if any of the fields or the form has a validation or submission error.
`false` otherwise. Note that a form can be invalid even if the errors do not
belong to any currently registered fields.

### `validating`

```ts
boolean
```

`true` if the form is currently being validated asynchronously. `false`
otherwise.

### `hasValidationErrors`

```ts
boolean
```

`true` when the form currently has validation errors. Useful for distinguishing _why_ `invalid` is `true`. For example, if your form is `invalid` because of a submit error, you might also want to disable the submit button if user's changes to fix the submit errors causes the form to have sync validation errors.

`hasValidationErrors === !!error || hasAnyError(errors)`

#### `error`

```ts
any
```

The whole-form error returned by a validation function under the [`FORM_ERROR`](../api#form_error) key.

#### `errors`

```ts
Object
```

An object containing all the current validation errors. The shape will match the
shape of the form's values.

### `hasSubmitErrors`

```ts
boolean
```

`true` when the form currently has submit errors. Useful for distinguishing _why_ `invalid` is `true`.

`hasSubmitErrors === !!submitError || hasAnyError(submitErrors)`

#### `submitError`

```ts
any
```

The whole-form submission error returned by `onSubmit` under the [`FORM_ERROR`](../api#form_error) key.

#### `submitErrors`

```ts
Object
```

An object containing all the current submission errors. The shape will match the
shape of the form's values.

## About submission

### `submitFailed`

```ts
boolean
```

`true` if the form was submitted, but the submission failed with submission
errors. `false` otherwise.

### `submitSucceeded`

```ts
boolean
```

`true` if the form was successfully submitted. `false` otherwise.

### `submitting`

```ts
boolean
```

`true` if the form is currently being submitted asynchronously. `false`
otherwise.

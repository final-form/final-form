# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/Config). Links may not work on Github.com.

# `Config`

`Config` is an object containing the following values:

## `debug`

```ts
(
  state: FormState,
  fieldStates: { [string]: FieldState }
) => void
```

Optional.

A callback for debugging that receives the form state and the states of
all the fields. It's called _on every state change_. A typical thing to pass in
might be `console.log`.

## `destroyOnUnregister`

Optional.

```ts
boolean
```

If `true`, the value of a field will be destroyed when that field is unregistered. Defaults to `false`. Can be useful when creating dynamic forms where only form values displayed need be submitted.

## `keepDirtyOnReinitialize`

```ts
boolean
```

Optional.

If `true`, only pristine values will be overwritten when `initialize(newValues)` is called. This can be useful for allowing a user to continue to edit a record while the record is being saved asynchronously, and the form is reinitialized to the saved values when the save is successful. Defaults to `false`.

## `initialValues?`

```ts
FormValues | Object
```

Optional.

The initial values of your form. These will also be used to compare against the
current values to calculate `pristine` and `dirty`.

If you are using Typescript, these values must be the same type as the object given to your [`onSubmit`](#onSubmit) function.

## `mutators`

```ts
{ [string]: Mutator }
```

Optional.

Named [Mutator](Mutator) functions.

## `onSubmit`

```ts
(
  values: FormValues,
  form: FormApi,
  callback: ?(errors: ?Object) => void
) => ?Object | Promise<?Object> | void
```

**Required.**

Function to call when the form is submitted. There are three possible ways to
write an `onSubmit` function:

- Synchronously: returns `undefined` on success, or an `Object` of submission
  errors on failure
- Asynchronously with a callback: returns `undefined`, calls `callback()` with
  no arguments on success, or with an `Object` of submission errors on failure.
- Asynchronously with a `Promise`: returns a `Promise<?Object>` that resolves
  with no value on success or _resolves_ with an `Object` of submission errors
  on failure. The reason it _resolves_ with errors is to leave _rejection_ for
  when there is a server or communications error.

Submission errors must be in the same shape as the values of the form. You may
return a generic error for the whole form (e.g. `'Login Failed'`) using the
special `FORM_ERROR` string key.

## `validate`

```ts
(values: FormValues) => Object | Promise<Object>
```

Optional.

A whole-record validation function that takes all the values of the form and
returns any validation errors. There are three possible ways to write a
`validate` function:

- Synchronously: returns `{}` or `undefined` when the values are valid, or an
  `Object` of validation errors when the values are invalid.
- Asynchronously with a `Promise`: returns a `Promise<?Object>` that resolves
  with no value on success or _resolves_ with an `Object` of validation errors
  on failure. The reason it _resolves_ with errors is to leave _rejection_ for
  when there is a server or communications error.

Validation errors must be in the same shape as the values of the form. You may
return a generic error for the whole form using the special `FORM_ERROR` string
key.

## `validateOnBlur`

```ts
boolean
```

Optional.

If `true`, validation will happen on blur. If `false`, validation will happen on
change. Defaults to `false`.

```

```

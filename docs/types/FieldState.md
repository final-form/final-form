# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/FieldState). Links may not work on Github.com.

# `FieldState`

`FieldState` is an object containing the following values. **Depending on your subscription when calling [`form.registerField()`](FormApi#registerfield), some of the values may not be present.**

## `active`

```ts
boolean
```

Whether or not the field currently has focus.

## `blur`

```ts
() => void
```

A function to blur the field (mark it as inactive).

## `change`

```ts
(value: any) => void
```

A function to change the value of the field.

## `data`

```ts
Object
```

A place for arbitrary values to be placed by mutators.

## `dirty`

```ts
boolean
```

`true` when the value of the field is not equal to the initial value (using the [`isEqual`](FieldConfig#isequal) comparator provided at field registration), `false` if the values are equal.

## `dirtySinceLastSubmit`

```ts
boolean
```

`true` when the value of the field is not equal to the value last submitted (using the [`isEqual`](FieldConfig#isequal) comparator provided at field registration), `false` if the values are equal.

## `error`

```ts
any
```

The current validation error for this field.

## `focus`

```ts
() => void
```

A function to focus the field (mark it as active).

## `initial`

```ts
any
```

The initial value of the field. `undefined` if it was never initialized.

## `invalid`

```ts
boolean
```

`true` if the field has a validation error or a submission error. `false` otherwise.

## `length`

```ts
number
```

The length of the array if the value is an array. `undefined` otherwise.

## `modified`

```ts
boolean
```

`true` if this field's value has ever been changed. `false` otherwise.

Once `true`, it will remain `true` for the lifetime of the field, or until the form or field state is reset.

## `modifiedSinceLastSubmit`

```ts
boolean
```

`true` if this field's value has ever been changed since the last submission. `false` otherwise.

Once `true`, it will remain `true` until the next submit action, or until the form or field state is reset.

## `name`

```ts
string
```

The name of the field.

## `pristine`

```ts
boolean
```

`true` if the current value is `===` to the initial value, `false` if the values are `!==`.

## `submitError`

```ts
any
```

The submission error for this field.

## `submitFailed`

```ts
boolean
```

`true` if a form submission has been tried and failed. `false` otherwise.

## `submitSucceeded`

```ts
boolean
```

`true` if the form has been successfully submitted. `false` otherwise.

## `submitting`

```ts
boolean
```

`true` if the form is currently being submitted asynchronously. `false` otherwise.

## `touched`

```ts
boolean
```

`true` if this field has ever gained and lost focus. `false` otherwise.

Useful for knowing when to display error messages.

## `valid`

```ts
boolean
```

`true` if this field has no validation or submission errors. `false` otherwise.

## `validating`

```ts
boolean
```

`true` if this field is currently waiting on its asynchronous field-level validation function to resolve. `false` otherwise.

## `value`

```ts
any
```

The value of the field.

## `visited`

```ts
boolean
```

`true` if this field has ever gained focus. `false` otherwise.

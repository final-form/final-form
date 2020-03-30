# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/FieldConfig). Links may not work on Github.com.

# `FieldConfig`

`FieldConfig` is an object containing the following values:

## `afterSubmit`

```ts
() => void
```

Optional.

A callback to notify fields after submission has completed successfully.

## `beforeSubmit`

```ts
() => void | false
```

Optional.

A function to call just before calling `onSubmit`. If `beforeSubmit` returns `false`, the submission will be aborted. If one of your fields returns `false` on `beforeSubmit`, other fields may not have their `beforeSubmit` called, as the submission is aborted on the first one that returns `false`.

## `data`

```ts
Object
```

Optional.

Initial state for arbitrary values to be placed by mutators.

## `defaultValue`

```ts
any
```

Optional.

The value of the field upon creation only if both the field's [`initialValue`](#initialvalue) is `undefined` and the value from the form's [`initialValues`](FormState.md#initialvalues) is also `undefined`. The field will be `dirty` when `defaultValue` is used.

## `getValidator`

```ts
() =>
  (value: any, allValues: FormValues, meta: FieldState)
    => any | Promise<any> | void
```

Optional.

A callback that will return a field-level validation function to validate a single field value. The validation function should return an error if the value is not valid, or `undefined` if the value is valid.

## `initialValue`

```ts
any
```

Optional.

The initial value for the field. This value will be used to calculate `dirty` and `pristine` by comparing it to the current value of the field. If you want field to be `dirty` upon creation, you can set one value with `initialValue` and set the value of the field with `defaultValue`.

The value given here will override any `initialValues` given to the entire form.

## `isEqual`

<!-- prettier-ignore -->
```ts
(a: any, b: any) => boolean
```

Optional. Defaults to `===`.

A function to determine if two values are equal.

## `silent`

```ts
boolean
```

Optional.

If `true`, no form or field listeners (apart from the one currently registering) will be notified of anything that has changed with the registration of this field. _Shhhh!!_

This can be useful to do a "dry run" of registering a field and immediately unregistering it to get an initial state for that field without disturbing all the other listeners.

Defaults to `false`.

## `validateFields`

```ts
string[]
```

Optional.

An array of field names to validate when this field changes. If `undefined`,
_every_ field will be validated when this one changes; if `[]`, _only this
field_ will have its field-level validation function called when it changes; if
other field names are specified, those fields _and this one_ will be validated
when this field changes.

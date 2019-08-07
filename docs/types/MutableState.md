# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/MutableState). Links may not work on Github.com.

# `MutableState`

Unless you're writing a [`Mutator`](Mutator), ignore this document.

`MutableState` is an object containing the following values:

## `formState`

```ts
InternalFormState
```

An object very similar to [`FormState`](FormState).

## `fields`

```ts
{ [string]: InternalFieldState }`
```

An object of values very similar to [`FieldState`](FieldState). Note that the fields are kept in a flat structure, so a "deep" field like `"shipping.address.street"` will be at the key `"shipping.address.street"`, with the dots included.

## `fieldSubscribers`

```ts
Object
```

An object of field subscribers.

## `lastFormState`

```ts
InternalFormState
```

The last form state sent to form subscribers. The object very similar to [`FormState`](FormState).

# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/Tools). Links may not work on Github.com.

# `Tools`

`Tools` is an object containing the following functions:

## `changeValue`

```ts
(
  state: MutableState,
  name: string,
  mutate: (oldValue: any) => any
) => void
```

A utility function to modify a single field value in form state. `mutate()`
takes the old value and returns the new value.

Related:

- [`MutableState`](MutableState)

## `getIn`

<!-- prettier-ignore -->
```ts
(state: Object, complexKey: string) => any
```

A utility function to get any arbitrarily deep value from an object using
dot-and-bracket syntax (e.g. `"some.deep.values[3].whatever"`).

Related:

- [Field Names](../field-names)

## `renameField`

```ts
(
  state: MutableState,
  from: string,
  to: string
) => void
```

A utility function to rename a field, copying over its value and field subscribers. _Advanced usage only_.

Related:

- [`MutableState`](MutableState)

## `resetFieldState`

```ts
(name: string) => void
```

A utility function to reset all of a field's flags (e.g. `touched`, `visited`, etc.) to their initial state. This can be useful for inserting a new field that has the same name as an existing field.

## `setIn`

<!-- prettier-ignore -->
```ts
(
  state: Object,
  key: string,
  value: any
) => Object
```

A utility function to set any arbitrarily deep value inside an object using
dot-and-bracket syntax (e.g. `"some.deep.values[3].whatever"`). Note: it does
**not** mutate the object, but returns a new object.

Related:

- [Field Names](../field-names)

## `shallowEqual`

<!-- prettier-ignore -->
```ts
(a: any, b: any) => boolean
```

A utility function to compare the keys of two objects. Returns `true` if the
objects have the same keys

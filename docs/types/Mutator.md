# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/Mutator). Links may not work on Github.com.

# `Mutator`

<!-- prettier-ignore -->
```ts
(
  args: any[], 
  state: MutableState, 
  tools: Tools
) => any
```

`Mutator` is a function that takes some arguments, the internal form [`MutableState`](MutableState), and some [`Tools`](Tools) and optionally modifies the form state.

Related:

- [`MutableState`](MutableState)
- [`Tools`](Tools)

# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/types/Decorator). Links may not work on Github.com.

# `Decorator`

<!-- prettier-ignore -->
```ts
(form: FormApi) => Unsubscribe
```

`Decorator` is a function that [decorates](https://en.wikipedia.org/wiki/Decorator_pattern) a form by subscribing to it and making changes as the form state changes, and returns an [`Unsubscribe`](Unsubscribe) function to detach itself from the form. e.g. [Final Form Calculate](https://github.com/final-form/final-form-calculate).

Related:

- [`FormApi`](FormApi)
- [`Unsubscribe`](Unsubscribe)

## Example Usage

```js
import { createForm } from 'final-form'

// Create Form
const form = createForm({ onSubmit })

// Decorate form
const undecorate = decorator(form)

// Use form as normal

// Clean up
undecorate()
```

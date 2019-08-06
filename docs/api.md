# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/api). Links may not work on Github.com.

# API

The following are exported by the Final Form package.

### `createForm`

<!-- prettier-ignore -->
```ts
(config: Config) => FormApi
```

Creates a form instance. It takes a [`Config`](types/Config) and returns a
[`FormApi`](types/FormApi).

### `fieldSubscriptionItems`

```ts
 string[]
```

An _à la carte_ list of all the possible things you can subscribe to for a
field. Useful for subscribing to everything.

### `formSubscriptionItems`

```ts
 string[]
```

An _à la carte_ list of all the possible things you can subscribe to for a form.
Useful for subscribing to everything.

### `ARRAY_ERROR`

```ts
string
```

A special `string` key used to return an error for an array of fields.

### `FORM_ERROR`

```ts
string
```

A special `string` key used to return a whole-form error inside error objects
returned from validation or submission.

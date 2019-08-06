# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/faq). Links may not work on Github.com.

# Frequently Asked Questions

## Why does Final Form set my `''` field value to `undefined`?

If you change a form value to `''`, Final Form will set the value in its
state to `undefined`. This can be counterintutive, because `'' !== undefined` in
javascript. The reason Final Form does this is so that `pristine` will be
`true` if you start with an uninitialized form field (i.e. `value === undefined`), type into it (`pristine` is now `false`), and then empty the form
field. In this case, `pristine` should return to `true`, but the value that the
HTML DOM gives for that input is `''`. If Final Form did _not_ treat `''` and
`undefined` as the same, any field that was ever typed in would forever be
`dirty`, no matter what the user did.

**Your validation functions should _also_ treat `undefined` and `''` as the
same.** This is not too difficult since both `undefined` and `''` are
[falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) in javascript.
So a "required" validation rule would just be `error = value ? undefined : 'Required'`. If you are doing a regular expression check, your function should
handle `undefined` as a potential value.

```jsx
// WRONG ❌ - values.myField might be undefined!
if (!values.myField.match(/myexpression/)) {
  errors.myField = 'Bad user'
}

// RIGHT ✅
if (!values.myField || !values.myField.match(/myexpression/)) {
  errors.myField = 'Bad user'
}

// RIGHT ✅
if (!/myexpression/.test(values.myField)) {
  errors.myField = 'Bad user'
}
```

In practice, if you need a field value to conform to some specific rule, you
also need it to be required, so normally your validation functions will look
like:

```jsx
if (!values.myField) {
  errors.myField = 'Required'
} else if (!someOtherCheck(values.myField)) {
  errors.myField = 'Not acceptable'
}
```

## Why do my numeric keys result in an array structure?

The field name parsing code in Final Form was modeled after Lodash's [`_.set()`](https://lodash.com/docs/#set). Writing a parser that detects that `foo.0.bar` is different from `foo[0].bar` is _extremely_ complicated. [Read more about field names](field-names).

# Frequently Asked Questions

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

* [Why does 🏁 Final Form set my `''` field value to `undefined`?](#why-does--final-form-set-my--field-value-to-undefined)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why does 🏁 Final Form set my `''` field value to `undefined`?

If you change a form value to `''`, 🏁 Final Form will set the value in its
state to `undefined`. This can be counterintutive, because `'' !== undefined` in
javascript. The reason 🏁 Final Form does this is so that `pristine` will be
`true` if you start with an uninitialized form field (i.e. `value ===
undefined`), type into it (`pristine` is now `false`), and then empty the form
field. In this case, `pristine` should return to `true`, but the value that the
HTML DOM gives for that input is `''`. If 🏁 Final Form did _not_ treat `''` and
`undefined` as the same, any field that was ever typed in would forever be
`dirty`, no matter what the user did.

**Your validation functions should _also_ treat `undefined` and `''` as the
same.** This is not too difficult since both `undefined` and `''` are
[falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) in javascript.
So a "required" validation rule would just be `error = value ? undefined :
'Required'`. If you are doing a regular expression check, your function should
handle `undefined` as a potential value.

```jsx
// WRONG ❌ - values.myField might be undefined!
if (!values.myField.match(/myexpression/)) {
  errors.myField = 'bad user'
}

// RIGHT ✅
if (!values.myField || !values.myField.match(/myexpression/)) {
  errors.myField = 'bad user'
}

// RIGHT ✅
if (!/myexpression/.test(values.myField)) {
  errors.myField = 'bad user'
}
```

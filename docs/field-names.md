# This documentation is meant to be read on [final-form.org](https://final-form.org/docs/final-form/field-names). Links may not work on Github.com.

Field names are strings that allow dot-and-bracket syntax, allowing you to create arbitrarily deeply nested fields. There are four main things you need to understand about how field names are used to read and write the form values in Final Form.

- `.` and `[` are treated the same.
- `]` is ignored.
- `Number` keys will result in array structures. [Why?](faq#why-do-my-numeric-keys-result-in-an-array-structure)
- Setting `undefined` to a field value deletes any empty object – but not array! – structures. [Why?](faq#why-does--final-form-set-my--field-value-to-undefined)

It is very similar to Lodash's [`_.set()`](https://lodash.com/docs/#set), except that empty structures are removed. Let's look at some examples:

| Field Name    | Initial Structure                     | Setting Value | Result                         |
| ------------- | ------------------------------------- | ------------- | ------------------------------ |
| `bar`         | `{}`                                  | `'foo'`       | `{ bar: 'foo' }`               |
| `bar.frog`    | `{}`                                  | `'foo'`       | `{ bar: { frog: 'foo' } }`     |
| `bar[0]`      | `{}`                                  | `'foo'`       | `{ bar: [ 'foo' ] }`           |
| `bar.0`       | `{}`                                  | `'foo'`       | `{ bar: [ 'foo' ] }`           |
| `bar[1]`      | `{}`                                  | `'foo'`       | `{ bar: [ null, 'foo' ] }`     |
| `bar[0].frog` | `{}`                                  | `'foo'`       | `{ bar: [ { frog: 'foo' } ] }` |
| `bar`         | `{ bar: 'foo' }`                      | `undefined`   | `{ }`                          |
| `bar.frog`    | `{ bar: { frog: 'foo' }, other: 42 }` | `undefined`   | `{ other: 42 }`                |
| `bar.frog[0]` | `{ bar: { frog: [ 'foo' ] } }`        | `undefined`   | `{ bar: { frog: [ null ] } }`  |

[Here is a sandbox](https://8ypq7n41z0.codesandbox.io/) that you can play around with to get a better understanding of how it works.

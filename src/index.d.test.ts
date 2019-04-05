// tslint:disable no-console

import { Config, createForm, AnyObject, Mutator } from './index'

const onSubmit: Config['onSubmit'] = (values, callback) => {}

let form = createForm({ initialValues: { foo: 'bar' }, onSubmit })
let formState = form.getState()

type FormData = {
  foo: string
  bar: number
}

form = createForm<FormData>({
  onSubmit(formData) {
    console.log(formData.foo as string)
    console.log(formData.bar as number)
  }
})

console.log(formState.active as string, formState.active as undefined)
console.log(formState.dirty as boolean)
console.log(formState.dirtyFields as AnyObject, formState.dirtyFields)
console.log(formState.dirtySinceLastSubmit as boolean)
console.log(
  formState.error.foo,
  formState.error as string,
  formState.error as boolean
)
console.log(formState.errors as AnyObject, formState.errors.foo)
console.log(formState.initialValues as AnyObject, formState.initialValues.foo)
console.log(formState.invalid as boolean)
console.log(formState.pristine as boolean)
console.log(
  formState.submitError as string,
  formState.submitError as object,
  formState.submitError as undefined
)
console.log(formState.submitErrors as AnyObject, formState.submitErrors.foo)
console.log(formState.submitFailed as boolean)
console.log(formState.submitSucceeded as boolean)
console.log(formState.submitSucceeded as boolean)
console.log(formState.submitting as boolean)
console.log(formState.valid as boolean)
console.log(formState.validating as boolean)
console.log(formState.values as AnyObject, formState.values.foo)

const initialValues: Config['initialValues'] = {
  a: 'a',
  b: true,
  c: 1
}

form = createForm({ onSubmit, initialValues })
formState = form.getState()
console.log(formState.pristine as boolean)
console.log(formState.dirty as boolean)

// subscription
form = createForm({ onSubmit, initialValues })
form.subscribe(
  state => {
    // noop
  },
  { pristine: true }
)

// mutators
const setValue: Mutator = ([name, newValue], state, { changeValue }) => {
  changeValue(state, name, value => newValue)
}

type Mutators = { setValue: (name: string, value: string) => void }
form = createForm({
  mutators: { setValue },
  onSubmit
})

// Get form.mutators cast to Mutators
const mutators: Mutators = form.mutators as Mutators
mutators.setValue('firstName', 'Kevin')

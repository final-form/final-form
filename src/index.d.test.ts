// tslint:disable no-console

import { Config, createForm, AnyObject, Mutator } from './index'

const onSubmit: Config['onSubmit'] = (values, callback) => {}

type FormValues = {
  foo: string
  bar?: number
}

let form = createForm<FormValues>({ initialValues: { foo: 'bar' }, onSubmit })
let formState = form.getState()

createForm<FormValues>({
  onSubmit(formData) {
    console.log(formData.foo as string)
    console.log(formData.bar as number)
  }
})

// initialValues
createForm<FormValues>({
  initialValues: { foo: 'baz', bar: 0 },
  onSubmit(formData) {
    console.log(formData.foo as string)
    console.log(formData.bar as number)
  }
})

// validate
createForm<FormValues>({
  onSubmit,
  validate(formData) {
    console.log(formData.foo as string)
    console.log(formData.bar as number)
    return formData
  }
})

createForm<FormValues>({
  onSubmit,
  validate() {
    return undefined
  }
})

// submit
let submitPromise = createForm<FormValues>({ onSubmit }).submit()

if (submitPromise) {
  submitPromise.then(formData => {
    if (formData) {
      console.log(formData.foo as string)
      console.log(formData.bar as number)
    }
  })
}

// initialize
createForm<FormValues>({ onSubmit }).initialize({ foo: 'baz', bar: 11 })
createForm<FormValues>({ onSubmit }).initialize(formData => ({
  ...formData,
  bar: 12
}))

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

type FormValues2 = {
  a: string
  b: boolean
  c: number
}
const initialValues: Config<FormValues2>['initialValues'] = {
  a: 'a',
  b: true,
  c: 1
}

let form2 = createForm<FormValues2>({ onSubmit, initialValues })
formState = form.getState()
console.log(formState.pristine as boolean)
console.log(formState.dirty as boolean)

// subscription
form2 = createForm<FormValues2>({ onSubmit, initialValues })
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
form2 = createForm<FormValues2>({
  mutators: { setValue },
  onSubmit
})

// Get form.mutators cast to Mutators
const mutators: Mutators = form.mutators as Mutators
mutators.setValue('firstName', 'Kevin')

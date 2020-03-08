// tslint:disable no-console
import { AnyObject, Config, createForm, Mutator } from './index'

interface FormValues {
  foo: string
  bar?: number
}
const onSubmit = (values: FormValues) => {
  console.info('submitted', values)
}

const form = createForm<FormValues>({ initialValues: { foo: 'bar' }, onSubmit })
const formState = form.getState()

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
const submitPromise = createForm<FormValues>({ onSubmit }).submit()

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
console.log(
  formState.dirtyFieldsSinceLastSubmit as AnyObject,
  formState.dirtyFieldsSinceLastSubmit
)
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

interface FormValues2 {
  a: string
  b: boolean
  c: number
  d?: string
}
const initialValues: Config<FormValues2>['initialValues'] = {
  a: 'a',
  b: true,
  c: 1
}

const onSubmit2 = (values: FormValues2) => {
  console.info('submitted', values)
}
let form2 = createForm<FormValues2>({ onSubmit: onSubmit2, initialValues })
const formState2 = form2.getState()
console.log(formState2.pristine as boolean)
console.log(formState2.dirty as boolean)

// subscription
form2 = createForm<FormValues2>({ onSubmit: onSubmit2, initialValues })
form2.subscribe(
  state => {
    // noop
  },
  { pristine: true }
)

// mutators
const setValue: Mutator<FormValues2> = (
  [name, newValue],
  state,
  { changeValue }
) => {
  changeValue(state, name, value => newValue)
}

type Mutators = {
  setValue: (name: string, value: string) => void
}
form2 = createForm<FormValues2>({
  mutators: { setValue },
  onSubmit: onSubmit2
})

// Get form.mutators cast to Mutators
const mutators: Mutators = form2.mutators as Mutators
mutators.setValue('firstName', 'Kevin')

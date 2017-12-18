export type Subscription = { [key: string]: boolean }
export type Subscriber<V> = (value: V) => void
export type IsEqual = (a: any, b: any) => boolean

export type FormSubscription = Partial<{
  active: boolean
  dirty: boolean
  error: boolean
  errors: boolean
  initialValues: boolean
  invalid: boolean
  pristine: boolean
  submitError: boolean
  submitErrors: boolean
  submitFailed: boolean
  submitSucceeded: boolean
  submitting: boolean
  valid: boolean
  validating: boolean
  values: boolean
}> &
  Subscription

export type FormState = Partial<{
  // all values are optional because they must be subscribed to
  active: string
  dirty: boolean
  error: any
  errors: object
  initialValues: object
  invalid: boolean
  pristine: boolean
  submitError: any
  submitErrors: object
  submitFailed: boolean
  submitSucceeded: boolean
  submitting: boolean
  valid: boolean
  validating: boolean
  values: object
}>

export type FormSubscriber = Subscriber<FormState>

export type FieldState = {
  active?: boolean
  blur: () => void
  change: (value: any) => void
  data?: object
  dirty?: boolean
  error?: any
  focus: () => void
  initial?: any
  invalid?: boolean
  length?: number
  name: string
  pristine?: boolean
  submitError?: any
  submitFailed?: boolean
  submitSucceeded?: boolean
  touched?: boolean
  valid?: boolean
  value?: any
  visited?: boolean
}

export type FieldSubscription = Partial<{
  active: boolean
  data: boolean
  dirty: boolean
  error: boolean
  initial: boolean
  invalid: boolean
  length: boolean
  pristine: boolean
  submitError: boolean
  submitFailed: boolean
  submitSucceeded: boolean
  touched: boolean
  valid: boolean
  value: boolean
  visited: boolean
}> &
  Subscription

export type FieldSubscriber = Subscriber<FieldState>

export type Unsubscribe = () => void

export type FieldConfig = Partial<{
  isEqual: IsEqual
  validate: (value: any, allValues: object) => any
  validateFields: string[]
}>

export type RegisterField = (
  name: string,
  subscriber: FieldSubscriber,
  subscription: FieldSubscription,
  config: FieldConfig
) => Unsubscribe

export type InternalFieldState = {
  active: boolean
  blur: () => void
  change: (value: any) => void
  data: object
  error?: any
  focus: () => void
  isEqual: IsEqual
  lastFieldState?: FieldState
  length?: any
  name: string
  submitError?: any
  pristine: boolean
  touched: boolean
  validateFields?: string[]
  validators: {
    [index: number]: (value: any, allValues: object) => any | Promise<any>
  }
  valid: boolean
  visited: boolean
}

export type InternalFormState = {
  active?: string
  error?: any
  errors: object
  initialValues?: object
  pristine: boolean
  submitError?: any
  submitErrors?: object
  submitFailed: boolean
  submitSucceeded: boolean
  submitting: boolean
  valid: boolean
  validating: number
  values: object
}

export type FormApi = {
  batch: (fn: () => void) => void
  blur: (name: string) => void
  change: (name: string, value?: any) => void
  focus: (name: string) => void
  initialize: (values: object) => void
  getRegisteredFields: () => string[]
  getState: () => FormState
  mutators?: { [key: string]: Function }
  submit: () => Promise<object | undefined> | undefined
  subscribe: (
    subscriber: FormSubscriber,
    subscription: FormSubscription
  ) => Unsubscribe
  registerField: RegisterField
  reset: () => void
}

export type DebugFunction = (
  state: FormState,
  fieldStates: { [key: string]: FieldState }
) => void

export type MutableState = {
  formState: InternalFormState
  fields: {
    [key: string]: InternalFieldState
  }
}

export type GetIn = (state: object, complexKey: string) => any
export type SetIn = (state: object, key: string, value: any) => object
export type ChangeValue = (
  state: MutableState,
  name: string,
  mutate: (value: any) => any
) => void
export type Tools = {
  changeValue: ChangeValue
  getIn: GetIn
  setIn: SetIn
  shallowEqual: IsEqual
}

export type Mutator = (args: any[], state: MutableState, tools: Tools) => any

export type Config = {
  debug?: DebugFunction
  initialValues?: object
  mutators?: { [key: string]: Mutator }
  onSubmit: (
    values: object,
    form: FormApi,
    callback?: (errors?: object) => void
  ) => object | Promise<object | undefined> | undefined | void
  validate?: (values: object) => object | Promise<object>
  validateOnBlur?: boolean
}

export type Decorator = (form: FormApi) => Unsubscribe

export function createForm(config: Config): FormApi
export var fieldSubscriptionItems: string[]
export var formSubscriptionItems: string[]
export var FORM_ERROR: any
export function getIn(state: object, complexKey: string): any
export function setIn(state: object, key: string, value: any): object
export var version: string

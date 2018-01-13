export interface Subscription {
  [key: string]: boolean
}
export type Subscriber<V> = (value: V) => void
export type IsEqual = (a: any, b: any) => boolean

export interface FormSubscription extends Partial<Subscription> {
  active: boolean
  dirty: boolean
  dirtySinceLastSubmit: boolean
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
}

export interface FormState {
  active: string
  dirty: boolean
  dirtySinceLastSubmit: boolean
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
  values: { [key: string]: any }
}

export type FormSubscriber = Subscriber<FormState>

export interface FieldState {
  active?: boolean
  blur: () => void
  change: (value: any) => void
  data?: object
  dirty?: boolean
  dirtySinceLastSubmit?: boolean
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

export interface FieldSubscription extends Partial<Subscription> {
  active: boolean
  data: boolean
  dirty: boolean
  dirtySinceLastSubmit: boolean
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
}

export type FieldSubscriber = Subscriber<FieldState>

export type Unsubscribe = () => void

type FieldValidator = (value: any, allValues: object) => any | Promise<any>
type GetFieldValidator = () => FieldValidator

export interface FieldConfig {
  isEqual?: IsEqual
  getValidator?: GetFieldValidator
  validateFields?: string[]
}

export type RegisterField = (
  name: string,
  subscriber: FieldSubscriber,
  subscription: FieldSubscription,
  config: FieldConfig
) => Unsubscribe

export interface InternalFieldState {
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
    [index: number]: GetFieldValidator
  }
  valid: boolean
  visited: boolean
}

export interface InternalFormState {
  active?: string
  dirtySinceLastSubmit: boolean
  error?: any
  errors: object
  initialValues?: object
  lastSubmittedValues?: object
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

export interface FormApi {
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

export interface MutableState {
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
export interface Tools {
  changeValue: ChangeValue
  getIn: GetIn
  setIn: SetIn
  shallowEqual: IsEqual
}

export type Mutator = (args: any[], state: MutableState, tools: Tools) => any

export interface Config {
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
export const fieldSubscriptionItems: string[]
export const formSubscriptionItems: string[]
export const FORM_ERROR: any
export function getIn(state: object, complexKey: string): any
export function setIn(state: object, key: string, value: any): object
export const version: string

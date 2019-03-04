export type Subscription = { [key: string]: boolean }
export type Subscriber<V> = (value: V) => void
export type IsEqual = (a: any, b: any) => boolean
export interface AnyObject {
  [key: string]: any
}

export interface FormSubscription {
  active?: boolean
  dirty?: boolean
  dirtyFields?: boolean
  dirtySinceLastSubmit?: boolean
  error?: boolean
  errors?: boolean
  hasSubmitErrors?: boolean
  hasValidationErrors?: boolean
  initialValues?: boolean
  invalid?: boolean
  modified?: boolean
  pristine?: boolean
  submitError?: boolean
  submitErrors?: boolean
  submitFailed?: boolean
  submitting?: boolean
  submitSucceeded?: boolean
  touched?: boolean
  valid?: boolean
  validating?: boolean
  values?: boolean
  visited?: boolean
}

export interface FormState {
  // by default: all values are subscribed. if subscription is specified, some values may be undefined
  active: undefined | string
  dirty: boolean
  dirtyFields: { [key: string]: boolean }
  dirtySinceLastSubmit: boolean
  error: any
  errors: AnyObject
  hasSubmitErrors: boolean
  hasValidationErrors: boolean
  initialValues: AnyObject
  invalid: boolean
  modified?: { [key: string]: boolean }
  pristine: boolean
  submitError: any
  submitErrors: AnyObject
  submitFailed: boolean
  submitSucceeded: boolean
  submitting: boolean
  touched?: { [key: string]: boolean }
  valid: boolean
  validating: boolean
  values: AnyObject
  visited?: { [key: string]: boolean }
}

export type FormSubscriber = Subscriber<FormState>

export interface FieldState {
  active?: boolean
  blur: () => void
  change: (value: any) => void
  data?: AnyObject
  dirty?: boolean
  dirtySinceLastSubmit?: boolean
  error?: any
  focus: () => void
  initial?: any
  invalid?: boolean
  length?: number
  modified?: boolean
  name: string
  pristine?: boolean
  submitError?: any
  submitFailed?: boolean
  submitSucceeded?: boolean
  submitting?: boolean
  touched?: boolean
  valid?: boolean
  value?: any
  visited?: boolean
}

export interface FieldSubscription {
  active?: boolean
  data?: boolean
  dirty?: boolean
  dirtySinceLastSubmit?: boolean
  error?: boolean
  initial?: boolean
  invalid?: boolean
  length?: boolean
  modified?: boolean
  pristine?: boolean
  submitError?: boolean
  submitFailed?: boolean
  submitSucceeded?: boolean
  submitting?: boolean
  touched?: boolean
  valid?: boolean
  value?: boolean
  visited?: boolean
}

export type FieldSubscriber = Subscriber<FieldState>
export type Subscribers<T extends Object> = {
  index: number
  entries: {
    [key: number]: { subscriber: Subscriber<T>; subscription: Subscription }
  }
}

export type Unsubscribe = () => void

type FieldValidator = (
  value: any,
  allValues: object,
  meta?: FieldState
) => any | Promise<any>
type GetFieldValidator = () => FieldValidator

export interface FieldConfig {
  defaultValue?: any
  getValidator?: GetFieldValidator
  initialValue?: any
  isEqual?: IsEqual
  validateFields?: string[]
}

export type RegisterField = (
  name: string,
  subscriber: FieldSubscriber,
  subscription: FieldSubscription,
  config?: FieldConfig
) => Unsubscribe

export interface InternalFieldState {
  active: boolean
  blur: () => void
  change: (value: any) => void
  data: AnyObject
  focus: () => void
  isEqual: IsEqual
  lastFieldState?: FieldState
  length?: any
  modified: boolean
  name: string
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

type ConfigKey =
  | 'debug'
  | 'destroyOnUnregister'
  | 'initialValues'
  | 'keepDirtyOnReinitialize'
  | 'mutators'
  | 'onSubmit'
  | 'validate'
  | 'validateOnBlur'

export interface FormApi {
  batch: (fn: () => void) => void
  blur: (name: string) => void
  change: (name: string, value?: any) => void
  focus: (name: string) => void
  initialize: (data: Object | ((values: Object) => Object)) => void
  isValidationPaused: () => boolean
  getFieldState: (field: string) => FieldState | undefined
  getRegisteredFields: () => string[]
  getState: () => FormState
  mutators: { [key: string]: (...args: any[]) => any }
  pauseValidation: () => void
  registerField: RegisterField
  reset: (initialValues?: object) => void
  resumeValidation: () => void
  setConfig: (name: ConfigKey, value: any) => void
  submit: () => Promise<object | undefined> | undefined
  subscribe: (
    subscriber: FormSubscriber,
    subscription: FormSubscription
  ) => Unsubscribe
}

export type DebugFunction = (
  state: FormState,
  fieldStates: { [key: string]: FieldState }
) => void

export interface MutableState {
  fieldSubscribers: { [key: string]: Subscribers<FieldState> }
  fields: {
    [key: string]: InternalFieldState
  }
  formState: InternalFormState
  lastFormState?: FormState
}

export type GetIn = (state: object, complexKey: string) => any
export type SetIn = (state: object, key: string, value: any) => object
export type ChangeValue = (
  state: MutableState,
  name: string,
  mutate: (value: any) => any
) => void
export type RenameField = (
  state: MutableState,
  from: string,
  to: string
) => void
export interface Tools {
  changeValue: ChangeValue
  getIn: GetIn
  renameField: RenameField
  setIn: SetIn
  shallowEqual: IsEqual
}

export type Mutator = (args: any, state: MutableState, tools: Tools) => any

export interface Config<FormData = object> {
  debug?: DebugFunction
  destroyOnUnregister?: boolean
  initialValues?: object
  keepDirtyOnReinitialize?: boolean
  mutators?: { [key: string]: Mutator }
  onSubmit: (
    values: FormData,
    form: FormApi,
    callback?: (errors?: object) => void
  ) => object | Promise<object | undefined> | undefined | void
  validate?: (values: object) => object | Promise<object>
  validateOnBlur?: boolean
}

export type Decorator = (form: FormApi) => Unsubscribe

export function createForm<FormData>(config: Config<FormData>): FormApi
export const fieldSubscriptionItems: string[]
export const formSubscriptionItems: string[]
export const ARRAY_ERROR: string
export const FORM_ERROR: string
export function getIn(state: object, complexKey: string): any
export function setIn(state: object, key: string, value: any): object
export const version: string
export const configOptions: ConfigKey[]

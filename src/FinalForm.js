// @flow
import getIn from './structure/getIn'
import setIn from './structure/setIn'
import publishFieldState from './publishFieldState'
import filterFieldState from './filterFieldState'
import filterFormState from './filterFormState'
import memoize from './memoize'
import isPromise from './isPromise'
import shallowEqual from './shallowEqual'
import type {
  Config,
  FieldState,
  FieldSubscriber,
  FieldSubscription,
  FormApi,
  FormState,
  FormSubscriber,
  FormSubscription,
  Subscriber,
  Subscription,
  Unsubscribe
} from './types'

export const FORM_ERROR = Symbol('form-error')
export const version = '0.0.2'

type Subscribers<T: Object> = {
  index: number,
  entries: {
    [number]: { subscriber: Subscriber<T>, subscription: Subscription }
  }
}

export type InternalFieldState = {
  active: boolean,
  blur: () => void,
  change: (value: any) => void,
  error?: any,
  focus: () => void,
  initial?: any,
  lastFieldState: ?FieldState,
  name: string,
  submitError?: any,
  touched: boolean,
  validators: {
    [number]: (
      value: ?any,
      allValues: Object,
      callback: ?(error: ?any) => void
    ) => ?any | Promise<?any> | void
  },
  value?: any,
  visited: boolean
}

export type InternalFormState = {
  active?: string,
  dirty: boolean,
  error?: any,
  submitError?: any,
  invalid: boolean,
  initialValues?: Object,
  pristine: boolean,
  submitting: boolean,
  submitFailed: boolean,
  submitSucceeded: boolean,
  valid: boolean,
  validating: boolean,
  values: Object
}

type InternalState = {
  subscribers: Subscribers<FormState>,
  error?: any,
  lastFormState?: FormState,
  fields: {
    [string]: InternalFieldState
  },
  fieldSubscribers: { [string]: Subscribers<FieldState> },
  formState: InternalFormState,
  validating: number
}

export type StateFilter<T> = (
  state: T,
  previousState: ?T,
  subscription: Subscription,
  force: boolean
) => ?T

const safeFormStateCast = ({
  // kind of silly, but it ensures type safety ¯\_(ツ)_/¯
  active,
  dirty,
  error,
  invalid,
  initialValues,
  pristine,
  submitting,
  submitFailed,
  submitSucceeded,
  submitError,
  valid,
  validating,
  values
}: InternalFormState): FormState => ({
  active,
  dirty,
  error,
  invalid,
  initialValues,
  pristine,
  submitting,
  submitFailed,
  submitSucceeded,
  submitError,
  valid,
  validating,
  values
})

const safeFieldStateCast = ({
  // kind of silly, but it ensures type safety ¯\_(ツ)_/¯
  active,
  blur,
  change,
  error,
  focus,
  initial,
  lastFieldState,
  name,
  submitError,
  touched,
  value,
  visited
}: InternalFieldState): FieldState => {
  const pristine = value === initial
  const invalid = error || submitError
  return {
    active,
    blur,
    change,
    dirty: !pristine,
    error,
    focus,
    initial,
    invalid,
    name,
    pristine,
    submitError,
    touched,
    valid: !invalid,
    value,
    visited
  }
}

function notifySubscriber<T: Object>(
  subscriber: Subscriber<T>,
  subscription: Subscription,
  state: T,
  lastState: ?T,
  filter: StateFilter<T>,
  force: boolean = false
): void {
  const notification: ?T = filter(state, lastState, subscription, force)
  if (notification) {
    subscriber(notification)
  }
}

function notify<T: Object>(
  { entries }: Subscribers<T>,
  state: T,
  lastState: ?T,
  filter: StateFilter<T>
): void {
  Object.keys(entries).forEach(key => {
    const { subscription, subscriber } = entries[Number(key)]
    notifySubscriber(subscriber, subscription, state, lastState, filter)
  })
}

const createForm = (config: Config): FormApi => {
  if (!config) {
    throw new Error('No config specified')
  }
  const { initialValues, onSubmit, validate, debug } = config
  if (!onSubmit) {
    throw new Error('No onSubmit function specified')
  }
  const formState = {
    dirty: false,
    initialValues: initialValues && { ...initialValues },
    invalid: false,
    pristine: true,
    submitting: false,
    submitFailed: false,
    submitSucceeded: false,
    valid: true,
    validating: false,
    values: initialValues ? { ...initialValues } : {}
  }
  const state: InternalState = {
    subscribers: { index: 0, entries: {} },
    fieldSubscribers: {},
    fields: {},
    formState,
    lastFormState: undefined,
    validating: 0
  }
  let inBatch = false

  const runFieldLevelValidation = (
    name: string,
    allValues: Object,
    callback: (error: ?any) => void
  ) => {
    const field = state.fields[name]
    const { validators } = field
    const validatorKeys = Object.keys(validators)
    let returned = false
    if (validatorKeys.length) {
      let remaining = validatorKeys.length
      validatorKeys.forEach((index: string) => {
        const processError = (error: ?any) => {
          remaining--
          if (remaining === 0 || (!returned && error)) {
            callback(error)
            returned = true
          }
        }
        if (!returned) {
          const validator = validators[Number(index)]
          const error = validator(field.value, allValues, processError)
          if (error && isPromise(error)) {
            error.then(processError, processError)
          } else if (validator.length < 3) {
            // not using callback, so undefined means that's the result of the validation
            processError(error)
          }
        }
      })
    } else {
      callback()
    }
  }

  const runValidation = (callback: ?() => void) => {
    const { fields, formState: { values } } = state
    state.validating++
    const fieldKeys = Object.keys(fields)
    if (validate) {
      const processValidationErrors = errors => {
        // assign errors to each field
        state.error = errors[FORM_ERROR]
        let remaining = fieldKeys.length
        const finish = () => {
          if (remaining === 0) {
            state.validating--
            if (callback) {
              callback()
            }
          }
        }
        if (fieldKeys.length) {
          fieldKeys.forEach(key => {
            runFieldLevelValidation(key, values, localError => {
              const recordError = getIn(errors, key)
              fields[key].error = localError || recordError // local overrides record
              remaining--
              finish()
            })
          })
        } else {
          finish()
        }
      }
      const errors = validate(values, processValidationErrors)
      if (errors) {
        if (isPromise(errors)) {
          errors.then(processValidationErrors, processValidationErrors)
        } else {
          processValidationErrors(errors)
        }
      }
    } else {
      let remaining = fieldKeys.length
      const finish = () => {
        if (remaining === 0) {
          state.validating--
          if (callback) {
            callback()
          }
        }
      }
      if (remaining) {
        fieldKeys.forEach(key => {
          runFieldLevelValidation(key, values, error => {
            fields[key].error = error
            remaining--
            finish()
          })
        })
      } else {
        finish()
      }
    }
  }

  const notifyFieldListeners = (force: ?string) => {
    if (inBatch) {
      return
    }
    const { fields, fieldSubscribers, formState } = state
    Object.keys(fields).forEach(name => {
      const field = fields[name]
      const fieldState = publishFieldState(formState, field)
      const { lastFieldState } = field
      if (!shallowEqual(fieldState, lastFieldState)) {
        field.lastFieldState = fieldState
        notify(
          fieldSubscribers[name],
          fieldState,
          lastFieldState,
          filterFieldState
        )
      }
    })
  }

  const isValid = () =>
    !state.error &&
    Object.keys(state.fields).every(
      key => !state.fields[key].error && !state.fields[key].submitError
    )

  const hasSyncErrors = () =>
    state.error ||
    Object.keys(state.fields).some(key => state.fields[key].error)

  const calculateNextFormState = (): FormState => {
    const { fields, formState } = state
    const fieldKeys = Object.keys(fields)

    // calculate dirty/pristine
    const pristine = fieldKeys.every(
      key => fields[key].value === fields[key].initial
    )

    // calculate valid/invalid
    const valid = isValid()

    const validating = state.validating > 0

    if (
      pristine === formState.pristine &&
      valid === formState.valid &&
      validating === formState.validating &&
      state.error === formState.error &&
      state.lastFormState &&
      state.lastFormState.values === formState.values &&
      state.lastFormState.active === formState.active
    ) {
      return state.lastFormState
    }

    const {
      active,
      initialValues,
      submitting,
      submitError,
      submitFailed,
      submitSucceeded,
      values
    } = formState
    return {
      active,
      dirty: !pristine,
      error: state.error,
      initialValues,
      invalid: !valid,
      pristine,
      submitting,
      submitError,
      submitFailed,
      submitSucceeded,
      valid,
      validating,
      values
    }
  }

  const callDebug = () =>
    debug &&
    process.env.NODE_ENV !== 'production' &&
    debug(
      safeFormStateCast(state.formState),
      Object.keys(state.fields).reduce((result, key: string) => {
        result[key] = safeFieldStateCast(state.fields[key])
        return result
      }, {})
    )

  const notifyFormListeners = () => {
    callDebug()
    if (inBatch) {
      return
    }
    const { lastFormState } = state
    const nextFormState = calculateNextFormState()
    if (nextFormState !== lastFormState) {
      state.lastFormState = nextFormState
      notify(state.subscribers, nextFormState, lastFormState, filterFormState)
    }
  }

  runValidation() // generate initial error (even with no fields yet) if we need to

  const api: FormApi = {
    batch: (fn: () => void) => {
      inBatch = true
      fn()
      inBatch = false
      notifyFieldListeners()
      notifyFormListeners()
    },

    blur: (name: string) => {
      const { fields, formState } = state
      const previous = fields[name]
      if (previous && previous.active) {
        // can only blur registered active fields
        delete formState.active
        fields[name] = {
          ...previous,
          active: false,
          touched: true
        }
        notifyFieldListeners()
        notifyFormListeners()
      }
    },

    change: (name: string, value: ?any) => {
      const { fields } = state
      if (fields[name] && fields[name].value !== value) {
        fields[name].value = value
        state.formState.values =
          setIn(state.formState.values, name, value) || {}
        notifyFieldListeners()
        notifyFormListeners()
        runValidation(() => {
          notifyFieldListeners()
          notifyFormListeners()
        })
      }
    },

    focus: (name: string) => {
      const field = state.fields[name]
      if (field && !field.active) {
        state.formState.active = name
        field.active = true
        field.visited = true
        notifyFieldListeners()
        notifyFormListeners()
      }
    },

    getState: () => safeFormStateCast(state.formState),

    initialize: (values: Object) => {
      const { fields, formState } = state
      formState.initialValues = values
      formState.values = values
      Object.keys(fields).forEach(key => {
        const field = fields[key]
        const value = getIn(values, key)
        field.value = value
        field.initial = value
        field.touched = false
        field.visited = false
      })
      runValidation(() => {
        notifyFieldListeners()
        notifyFormListeners()
      })
    },

    registerField: (
      name: string,
      subscriber: FieldSubscriber,
      subscription: FieldSubscription = {},
      validate?: (
        value: ?any,
        allValues: Object,
        callback: ?(error: ?any) => void
      ) => ?any
    ): Unsubscribe => {
      if (!state.fieldSubscribers[name]) {
        state.fieldSubscribers[name] = { index: 0, entries: {} }
      }
      const index = state.fieldSubscribers[name].index++

      // save field subscriber callback
      state.fieldSubscribers[name].entries[index] = {
        subscriber: memoize(subscriber),
        subscription
      }

      if (!state.fields[name]) {
        // create initial field state
        const initial = state.formState.initialValues
          ? getIn(state.formState.initialValues, name)
          : undefined
        state.fields[name] = {
          active: false,
          blur: () => api.blur(name),
          change: value => api.change(name, value),
          focus: () => api.focus(name),
          initial,
          lastFieldState: undefined,
          name,
          touched: false,
          value: initial,
          validators: {},
          visited: false
        }
      }
      if (validate) {
        state.fields[name].validators[index] = validate
      }

      let sentFirstNotification = false
      const firstNotification = () => {
        const fieldState = publishFieldState(
          state.formState,
          state.fields[name]
        )
        notifySubscriber(
          subscriber,
          subscription,
          fieldState,
          undefined,
          filterFieldState,
          true
        )
        state.fields[name].lastFieldState = fieldState
        sentFirstNotification = true
      }

      let validationReturned = false
      runValidation(() => {
        notifyFormListeners()
        if (!sentFirstNotification) {
          firstNotification()
        }
        notifyFieldListeners()
        validationReturned = true
      })
      if (!validationReturned) {
        // validation must be async
        firstNotification()
      }

      return () => {
        delete state.fields[name].validators[index]
        delete state.fieldSubscribers[name].entries[index]
        if (!Object.keys(state.fieldSubscribers[name].entries).length) {
          delete state.fieldSubscribers[name]
          delete state.fields[name]
        }
        runValidation(() => {
          notifyFieldListeners()
          notifyFormListeners()
        })
      }
    },

    reset: () => {
      api.initialize(state.formState.initialValues || {})
    },

    submit: () => {
      const { formState, fields } = state
      if (hasSyncErrors()) {
        return // no submit for you!!
      }
      let resolvePromise
      let completeCalled = false
      const complete = (errors: ?Object) => {
        formState.submitting = false
        if (errors && Object.keys(errors).length) {
          formState.submitFailed = true
          formState.submitSucceeded = false
          Object.keys(fields).forEach(key => {
            fields[key].submitError = errors && getIn(errors, key)
          })
          formState.submitError = errors[FORM_ERROR]
        } else {
          Object.keys(fields).forEach(key => {
            delete fields[key].submitError
          })
          delete formState.submitError
          formState.submitFailed = false
          formState.submitSucceeded = true
        }
        notifyFormListeners()
        notifyFieldListeners()
        completeCalled = true
        if (resolvePromise) {
          resolvePromise()
        }
      }
      formState.submitting = true
      formState.submitFailed = false
      formState.submitSucceeded = false
      if (onSubmit.length === 2) {
        // onSubmit is expecting a callback, first try synchronously
        onSubmit(formState.values, complete)
        if (!completeCalled) {
          // must be async, so we should return a Promise
          notifyFormListeners() // let everyone know we are submitting
          return new Promise(resolve => {
            resolvePromise = resolve
          })
        }
      } else {
        // onSubmit is either sync or async with a Promise
        const result = onSubmit(formState.values)
        if (result && isPromise(result)) {
          // onSubmit is async with a Promise
          notifyFormListeners() // let everyone know we are submitting
          return result.then(complete)
        } else {
          // onSubmit is sync
          complete(result)
        }
      }
    },

    subscribe: (
      subscriber: FormSubscriber,
      subscription: FormSubscription
    ): Unsubscribe => {
      if (!subscriber) {
        throw new Error('No callback given.')
      }
      if (!subscription) {
        throw new Error(
          'No subscription provided. What values do you want to listen to?'
        )
      }
      const memoized = memoize(subscriber)
      const { formState, subscribers } = state
      const index = subscribers.index++
      subscribers.entries[index] = {
        subscriber: memoized,
        subscription
      }
      const valid = !state.error
      const stateWithError = {
        ...formState,
        error: state.error,
        invalid: !valid,
        valid
      }
      notifySubscriber(
        memoized,
        subscription,
        stateWithError,
        stateWithError,
        filterFormState,
        true
      )
      return () => {
        delete subscribers.entries[index]
      }
    }
  }
  return api
}

export default createForm

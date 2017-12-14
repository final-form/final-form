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
  ChangeValue,
  Config,
  FieldState,
  FieldSubscriber,
  FieldSubscription,
  FormApi,
  FormState,
  FormSubscriber,
  FormSubscription,
  InternalFieldState,
  InternalFormState,
  MutableState,
  Subscriber,
  Subscription,
  Unsubscribe
} from './types'

export const FORM_ERROR = Symbol('form-error')
export const version = '1.3.5'

type Subscribers<T: Object> = {
  index: number,
  entries: {
    [number]: { subscriber: Subscriber<T>, subscription: Subscription }
  }
}

type InternalState = {
  subscribers: Subscribers<FormState>,
  lastFormState?: FormState,
  fields: {
    [string]: InternalFieldState
  },
  fieldSubscribers: { [string]: Subscribers<FieldState> },
  formState: InternalFormState
} & MutableState

export type StateFilter<T> = (
  state: T,
  previousState: ?T,
  subscription: Subscription,
  force: boolean
) => ?T

const convertToExternalFormState = ({
  // kind of silly, but it ensures type safety ¯\_(ツ)_/¯
  active,
  error,
  errors,
  initialValues,
  pristine,
  submitting,
  submitFailed,
  submitSucceeded,
  submitError,
  submitErrors,
  valid,
  validating,
  values
}: InternalFormState): FormState => ({
  active,
  dirty: !pristine,
  error,
  errors,
  invalid: !valid,
  initialValues,
  pristine,
  submitting,
  submitFailed,
  submitSucceeded,
  submitError,
  submitErrors,
  valid,
  validating: validating > 0,
  values
})

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
  const {
    debug,
    initialValues,
    mutators,
    onSubmit,
    validate,
    validateOnBlur
  } = config
  if (!onSubmit) {
    throw new Error('No onSubmit function specified')
  }

  const state: InternalState = {
    subscribers: { index: 0, entries: {} },
    fieldSubscribers: {},
    fields: {},
    formState: {
      dirty: false,
      errors: {},
      initialValues: initialValues && { ...initialValues },
      invalid: false,
      pristine: true,
      submitting: false,
      submitFailed: false,
      submitSucceeded: false,
      valid: true,
      validating: 0,
      values: initialValues ? { ...initialValues } : {}
    },
    lastFormState: undefined
  }
  let inBatch = false
  const changeValue: ChangeValue = (state, name, mutate) => {
    if (state.fields[name]) {
      const before = getIn(state.formState.values, name)
      const after = mutate(before)
      state.formState.values = setIn(state.formState.values, name, after) || {}
    }
  }

  // bind state to mutators
  const mutatorsApi =
    mutators &&
    Object.keys(mutators).reduce((result, key) => {
      result[key] = (...args) => {
        const mutatableState = {
          formState: state.formState,
          fields: state.fields
        }
        const returnValue = mutators[key](args, mutatableState, {
          changeValue,
          getIn,
          setIn,
          shallowEqual
        })
        state.formState = mutatableState.formState
        state.fields = mutatableState.fields
        runValidation(() => {
          notifyFieldListeners()
          notifyFormListeners()
        })
        return returnValue
      }
      return result
    }, {})

  const runRecordLevelValidation = (
    setErrors: (errors: Object) => void
  ): Promise<*>[] => {
    const promises = []
    if (validate) {
      const errorsOrPromise = validate({ ...state.formState.values }) // clone to avoid writing
      if (isPromise(errorsOrPromise)) {
        promises.push(errorsOrPromise.then(setErrors))
      } else {
        setErrors(errorsOrPromise)
      }
    }
    return promises
  }

  const runFieldLevelValidation = (
    field: InternalFieldState,
    setError: (error: ?any) => void
  ): Promise<*>[] => {
    const { validators } = field
    const promises = []
    const validatorKeys = Object.keys(validators)
    if (validatorKeys.length) {
      let error
      Object.keys(validators).forEach((index: string) => {
        const validator = validators[Number(index)]
        const errorOrPromise = validator(
          getIn(state.formState.values, field.name),
          state.formState.values
        )
        if (errorOrPromise && isPromise(errorOrPromise)) {
          promises.push(errorOrPromise.then(setError))
        } else if (!error) {
          // first registered validator wins
          error = errorOrPromise
        }
      })
      setError(error)
    }
    return promises
  }

  const runValidation = (callback: ?() => void) => {
    const { fields, formState } = state
    const fieldKeys = Object.keys(fields)
    if (
      !validate &&
      !fieldKeys.some(
        key =>
          fields[key].validators && Object.keys(fields[key].validators).length
      )
    ) {
      if (callback) {
        callback()
      }
      return // no validation rules
    }

    let recordLevelErrors: Object = {}
    const fieldLevelErrors = {}
    const promises = [
      ...runRecordLevelValidation(errors => {
        recordLevelErrors = errors || {}
      }),
      ...fieldKeys.reduce(
        (result, name) =>
          result.concat(
            runFieldLevelValidation(fields[name], (error: ?any) => {
              fieldLevelErrors[name] = error
            })
          ),
        []
      )
    ]

    const processErrors = () => {
      let merged = { ...recordLevelErrors }
      fieldKeys.forEach(name => {
        if (fields[name]) {
          // make sure field is still registered
          // field-level errors take precedent over record-level errors
          const error = fieldLevelErrors[name] || getIn(recordLevelErrors, name)
          if (error) {
            merged = setIn(merged, name, error)
          }
        }
      })
      if (!shallowEqual(formState.errors, merged)) {
        formState.errors = merged
      }
      formState.error = recordLevelErrors[FORM_ERROR]
    }

    // process sync errors
    processErrors()

    if (promises.length) {
      // sync errors have been set. notify listeners while we wait for others
      state.formState.validating++
      if (callback) {
        callback()
      }

      Promise.all(promises).then(() => {
        state.formState.validating--
        processErrors()
        if (callback) {
          callback()
        }
      })
    } else if (callback) {
      callback()
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

  const hasSyncErrors = () =>
    !!(state.formState.error || Object.keys(state.formState.errors).length)

  const calculateNextFormState = (): FormState => {
    const { fields, formState, lastFormState } = state
    const fieldKeys = Object.keys(fields)

    // calculate dirty/pristine
    formState.pristine = fieldKeys.every(
      key =>
        getIn(formState.values, key) === getIn(formState.initialValues, key)
    )
    formState.valid =
      !formState.error &&
      !formState.submitError &&
      !Object.keys(formState.errors).length &&
      !(formState.submitErrors && Object.keys(formState.submitErrors).length)
    const nextFormState = convertToExternalFormState(formState)
    return lastFormState && shallowEqual(lastFormState, nextFormState)
      ? lastFormState
      : nextFormState
  }

  const callDebug = () =>
    debug &&
    process.env.NODE_ENV !== 'production' &&
    debug(
      convertToExternalFormState(state.formState),
      Object.keys(state.fields).reduce((result, key: string) => {
        result[key] = state.fields[key]
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

  // generate initial errors
  runValidation()

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
      if (previous) {
        // can only blur registered fields
        delete formState.active
        fields[name] = {
          ...previous,
          active: false,
          touched: true
        }
        if (validateOnBlur) {
          runValidation(() => {
            notifyFieldListeners()
            notifyFormListeners()
          })
        } else {
          notifyFieldListeners()
          notifyFormListeners()
        }
      }
    },

    change: (name: string, value: ?any) => {
      const { fields, formState } = state
      if (fields[name] && getIn(formState.values, name) !== value) {
        changeValue(state, name, () => value)
        if (validateOnBlur) {
          notifyFieldListeners()
          notifyFormListeners()
        } else {
          runValidation(() => {
            notifyFieldListeners()
            notifyFormListeners()
          })
        }
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

    mutators: mutatorsApi,

    getRegisteredFields: () => Object.keys(state.fields),

    getState: () => convertToExternalFormState(state.formState),

    initialize: (values: Object) => {
      const { fields, formState } = state
      formState.initialValues = values
      formState.values = values
      Object.keys(fields).forEach(key => {
        const field = fields[key]
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
          data: {},
          focus: () => api.focus(name),
          initial,
          lastFieldState: undefined,
          name,
          pristine: true,
          touched: false,
          valid: true,
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

      runValidation(() => {
        notifyFormListeners()
        if (!sentFirstNotification) {
          firstNotification()
        }
        notifyFieldListeners()
      })

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
        // mark all fields as touched
        Object.keys(fields).forEach(key => {
          fields[key].touched = true
        })
        notifyFieldListeners()
        return // no submit for you!!
      }
      let resolvePromise
      let completeCalled = false
      const complete = (errors: ?Object) => {
        formState.submitting = false
        if (
          errors &&
          (Object.keys(errors).length ||
            Object.getOwnPropertySymbols(errors).length)
        ) {
          formState.submitFailed = true
          formState.submitSucceeded = false
          formState.submitErrors = errors
          formState.submitError = errors[FORM_ERROR]
        } else {
          delete formState.submitErrors
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
      const { subscribers, lastFormState } = state
      const index = subscribers.index++
      subscribers.entries[index] = {
        subscriber: memoized,
        subscription
      }
      const nextFormState = calculateNextFormState()
      if (nextFormState !== lastFormState) {
        state.lastFormState = nextFormState
      }
      notifySubscriber(
        memoized,
        subscription,
        nextFormState,
        nextFormState,
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

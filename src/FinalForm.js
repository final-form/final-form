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
  FieldConfig,
  FieldState,
  FieldSubscriber,
  FieldSubscription,
  FormApi,
  FormState,
  FormSubscriber,
  FormSubscription,
  InternalFieldState,
  InternalFormState,
  IsEqual,
  MutableState,
  Subscriber,
  Subscription,
  Unsubscribe
} from './types'
import { FORM_ERROR, ARRAY_ERROR } from './symbols'
export const version = '4.3.1'

const tripleEquals: IsEqual = (a: any, b: any): boolean => a === b

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
  dirtySinceLastSubmit,
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
  dirtySinceLastSubmit,
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
  let {
    debug,
    initialValues,
    mutators,
    onSubmit,
    validate,
    validateOnBlur,
    persistentSubmitErrors
  } = config
  if (!onSubmit) {
    throw new Error('No onSubmit function specified')
  }

  const state: InternalState = {
    subscribers: { index: 0, entries: {} },
    fieldSubscribers: {},
    fields: {},
    formState: {
      dirtySinceLastSubmit: false,
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
  let validationPaused = false
  let validationBlocked = false
  let nextAsyncValidationKey = 0
  const asyncValidationPromises: { [number]: Promise<*> } = {}
  const clearAsyncValidationPromise = key => result => {
    delete asyncValidationPromises[key]
    return result
  }

  const changeValue: ChangeValue = (state, name, mutate) => {
    if (state.fields[name]) {
      const before = getIn(state.formState.values, name)
      const after = mutate(before)
      state.formState.values = setIn(state.formState.values, name, after) || {}
    }
  }

  // bind state to mutators
  const getMutatorApi = key => (...args) => {
    if (mutators) {
      // ^^ causes branch coverage warning, but needed to appease the Flow gods
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
      runValidation(undefined, () => {
        notifyFieldListeners()
        notifyFormListeners()
      })
      return returnValue
    }
  }

  const mutatorsApi =
    (mutators &&
      Object.keys(mutators).reduce((result, key) => {
        result[key] = getMutatorApi(key)
        return result
      }, {})) ||
    {}

  const runRecordLevelValidation = (
    setErrors: (errors: Object) => void
  ): Promise<*>[] => {
    const promises = []
    if (validate) {
      const errorsOrPromise = validate({ ...state.formState.values }) // clone to avoid writing
      if (isPromise(errorsOrPromise)) {
        const asyncValidationPromiseKey = nextAsyncValidationKey++
        const promise = errorsOrPromise
          .then(setErrors)
          .then(clearAsyncValidationPromise(asyncValidationPromiseKey))
        promises.push(promise)
        asyncValidationPromises[asyncValidationPromiseKey] = promise
      } else {
        setErrors(errorsOrPromise)
      }
    }
    return promises
  }

  const getValidators = (field: InternalFieldState) =>
    Object.keys(field.validators).reduce((result, index) => {
      const validator = field.validators[Number(index)]()
      if (validator) {
        result.push(validator)
      }
      return result
    }, [])

  const runFieldLevelValidation = (
    field: InternalFieldState,
    setError: (error: ?any) => void
  ): Promise<*>[] => {
    const promises = []
    const validators = getValidators(field)
    if (validators.length) {
      let error
      validators.forEach(validator => {
        const errorOrPromise = validator(
          getIn(state.formState.values, field.name),
          state.formState.values
        )
        if (errorOrPromise && isPromise(errorOrPromise)) {
          const asyncValidationPromiseKey = nextAsyncValidationKey++
          const promise = errorOrPromise
            .then(setError)
            .then(clearAsyncValidationPromise(asyncValidationPromiseKey))
          promises.push(promise)
          asyncValidationPromises[asyncValidationPromiseKey] = promise
        } else if (!error) {
          // first registered validator wins
          error = errorOrPromise
        }
      })
      setError(error)
    }
    return promises
  }

  const runValidation = (fieldChanged: ?string, callback: ?() => void) => {
    if (validationPaused) {
      validationBlocked = true
      /* istanbul ignore next */
      if (callback) {
        callback()
      }
      return
    }

    const { fields, formState } = state
    let fieldKeys = Object.keys(fields)
    if (
      !validate &&
      !fieldKeys.some(key => getValidators(fields[key]).length)
    ) {
      if (callback) {
        callback()
      }
      return // no validation rules
    }

    // pare down field keys to actually validate
    let limitedFieldLevelValidation = false
    if (fieldChanged) {
      const { validateFields } = fields[fieldChanged]
      if (validateFields) {
        limitedFieldLevelValidation = true
        fieldKeys = validateFields.length
          ? validateFields.concat(fieldChanged)
          : [fieldChanged]
      }
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
      let merged = {
        ...(limitedFieldLevelValidation ? formState.errors : {}),
        ...recordLevelErrors
      }
      const forEachError = (fn: (name: string, error: any) => void) => {
        fieldKeys.forEach(name => {
          if (fields[name]) {
            // make sure field is still registered
            // field-level errors take precedent over record-level errors
            const recordLevelError = getIn(recordLevelErrors, name)
            const errorFromParent = getIn(merged, name)
            const hasFieldLevelValidation = getValidators(fields[name]).length
            const fieldLevelError = fieldLevelErrors[name]
            fn(
              name,
              (hasFieldLevelValidation && fieldLevelError) ||
                (validate && recordLevelError) ||
                (!recordLevelError && !limitedFieldLevelValidation
                  ? errorFromParent
                  : undefined)
            )
          }
        })
      }
      forEachError((name, error) => {
        merged = setIn(merged, name, error) || {}
      })
      forEachError((name, error) => {
        if (error && error[ARRAY_ERROR]) {
          const existing = getIn(merged, name)
          const copy: any = [...existing]
          copy[ARRAY_ERROR] = error[ARRAY_ERROR]
          merged = setIn(merged, name, copy)
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
    formState.pristine = fieldKeys.every(key =>
      fields[key].isEqual(
        getIn(formState.values, key),
        getIn(formState.initialValues || {}, key)
      )
    )
    formState.dirtySinceLastSubmit = !!(
      formState.lastSubmittedValues &&
      !fieldKeys.every(key =>
        fields[key].isEqual(
          getIn(formState.values, key),
          getIn(formState.lastSubmittedValues || {}, key) // || {} is for flow, but causes branch coverage complaint
        )
      )
    )

    formState.valid =
      !formState.error &&
      !formState.submitError &&
      !Object.keys(formState.errors).length &&
      !(formState.submitErrors && Object.keys(formState.submitErrors).length)
    const nextFormState = convertToExternalFormState(formState)
    const { touched, visited } = fieldKeys.reduce(
      (result, key) => {
        result.touched[key] = fields[key].touched
        result.visited[key] = fields[key].visited
        return result
      },
      { touched: {}, visited: {} }
    )
    nextFormState.touched =
      lastFormState && shallowEqual(lastFormState.touched, touched)
        ? lastFormState.touched
        : touched
    nextFormState.visited =
      lastFormState && shallowEqual(lastFormState.visited, visited)
        ? lastFormState.visited
        : visited
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

  let notifying: boolean = false
  let scheduleNotification: boolean = false
  const notifyFormListeners = () => {
    if (notifying) {
      scheduleNotification = true
    } else {
      notifying = true
      callDebug()
      if (!inBatch) {
        const { lastFormState } = state
        const nextFormState = calculateNextFormState()
        if (nextFormState !== lastFormState) {
          state.lastFormState = nextFormState
          notify(
            state.subscribers,
            nextFormState,
            lastFormState,
            filterFormState
          )
        }
      }
      notifying = false
      if (scheduleNotification) {
        scheduleNotification = false
        notifyFormListeners()
      }
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
          runValidation(name, () => {
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
          runValidation(name, () => {
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

    getFieldState: name => {
      const field = state.fields[name]
      return field && field.lastFieldState
    },

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
      runValidation(undefined, () => {
        notifyFieldListeners()
        notifyFormListeners()
      })
    },

    pauseValidation: () => {
      validationPaused = true
    },

    registerField: (
      name: string,
      subscriber: FieldSubscriber,
      subscription: FieldSubscription = {},
      fieldConfig?: FieldConfig
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
          isEqual: (fieldConfig && fieldConfig.isEqual) || tripleEquals,
          lastFieldState: undefined,
          name,
          touched: false,
          valid: true,
          validateFields: fieldConfig && fieldConfig.validateFields,
          validators: {},
          visited: false
        }
      }
      if (fieldConfig && fieldConfig.getValidator) {
        state.fields[name].validators[index] = fieldConfig.getValidator
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

      runValidation(undefined, () => {
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
        runValidation(undefined, () => {
          notifyFieldListeners()
          notifyFormListeners()
        })
      }
    },

    reset: () => {
      state.formState.submitFailed = false
      state.formState.submitSucceeded = false
      delete state.formState.submitErrors
      delete state.formState.lastSubmittedValues
      api.initialize(state.formState.initialValues || {})
    },

    resumeValidation: () => {
      validationPaused = false
      if (validationBlocked) {
        // validation was attempted while it was paused, so run it now
        runValidation(undefined, () => {
          notifyFieldListeners()
          notifyFormListeners()
        })
      }
      validationBlocked = false
    },

    setConfig: (name: string, value: any): void => {
      switch (name) {
        case 'debug':
          debug = value
          break
        case 'initialValues':
          api.initialize(value)
          break
        case 'mutators':
          mutators = value
          if (value) {
            Object.keys(mutatorsApi).forEach(key => {
              if (!(key in value)) {
                delete mutatorsApi[key]
              }
            })
            Object.keys(value).forEach(key => {
              mutatorsApi[key] = getMutatorApi(key)
            })
          } else {
            Object.keys(mutatorsApi).forEach(key => {
              delete mutatorsApi[key]
            })
          }
          break
        case 'onSubmit':
          onSubmit = value
          break
        case 'validate':
          validate = value
          runValidation(undefined, () => {
            notifyFieldListeners()
            notifyFormListeners()
          })
          break
        case 'validateOnBlur':
          validateOnBlur = value
          break
        default:
          throw new Error('Unrecognised option ' + name)
      }
    },

    submit: () => {
      const { formState, fields } = state
      if (hasSyncErrors() && !persistentSubmitErrors) {
        // mark all fields as touched
        Object.keys(fields).forEach(key => {
          fields[key].touched = true
        })
        state.formState.submitFailed = true
        notifyFormListeners()
        notifyFieldListeners()
        return // no submit for you!!
      }
      const asyncValidationPromisesKeys = Object.keys(asyncValidationPromises)
      if (asyncValidationPromisesKeys.length) {
        // still waiting on async validation to complete...
        Promise.all(
          asyncValidationPromisesKeys.reduce((result, key) => {
            result.push(asyncValidationPromises[Number(key)])
            return result
          }, [])
        ).then(() => api.submit())
        return
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
      formState.lastSubmittedValues = { ...formState.values }
      if (onSubmit.length === 3) {
        // onSubmit is expecting a callback, first try synchronously
        onSubmit(formState.values, api, complete)
        if (!completeCalled) {
          // must be async, so we should return a Promise
          notifyFormListeners() // let everyone know we are submitting
          return new Promise(resolve => {
            resolvePromise = resolve
          })
        }
      } else {
        // onSubmit is either sync or async with a Promise
        const result = onSubmit(formState.values, api)
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

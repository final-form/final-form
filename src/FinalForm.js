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
  ConfigKey,
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
  RenameField,
  Subscriber,
  Subscribers,
  Subscription,
  Unsubscribe
} from './types'
import { FORM_ERROR, ARRAY_ERROR } from './constants'
export const configOptions: ConfigKey[] = [
  'debug',
  'initialValues',
  'keepDirtyOnReinitialize',
  'mutators',
  'onSubmit',
  'validate',
  'validateOnBlur'
]
export const version = '4.8.1'

const tripleEquals: IsEqual = (a: any, b: any): boolean => a === b

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

const hasAnyError = (errors: Object): boolean => {
  return Object.keys(errors).some(key => {
    const value = errors[key]

    if (value && typeof value === 'object') {
      return hasAnyError(value)
    }

    return typeof value !== 'undefined'
  })
}

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
  hasSubmitErrors: !!(
    submitError ||
    (submitErrors && hasAnyError(submitErrors))
  ),
  hasValidationErrors: !!(error || hasAnyError(errors)),
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
    destroyOnUnregister,
    keepDirtyOnReinitialize,
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
    const before = getIn(state.formState.values, name)
    const after = mutate(before)
    state.formState.values = setIn(state.formState.values, name, after) || {}
  }
  const renameField: RenameField = (state, from, to) => {
    if (state.fields[from]) {
      state.fields = {
        ...state.fields,
        [to]: {
          ...state.fields[from],
          name: to,
          lastFieldState: undefined
        }
      }
      delete state.fields[from]
      state.fieldSubscribers = {
        ...state.fieldSubscribers,
        [to]: state.fieldSubscribers[from]
      }
      delete state.fieldSubscribers[from]
      const value = getIn(state.formState.values, from)
      state.formState.values =
        setIn(state.formState.values, from, undefined) || {}
      state.formState.values = setIn(state.formState.values, to, value)
      delete state.lastFormState
    }
  }

  // bind state to mutators
  const getMutatorApi = key => (...args) => {
    // istanbul ignore next
    if (mutators) {
      // ^^ causes branch coverage warning, but needed to appease the Flow gods
      const mutatableState: MutableState = {
        formState: state.formState,
        fields: state.fields,
        fieldSubscribers: state.fieldSubscribers,
        lastFormState: state.lastFormState
      }
      const returnValue = mutators[key](args, mutatableState, {
        changeValue,
        getIn,
        renameField,
        setIn,
        shallowEqual
      })
      state.formState = mutatableState.formState
      state.fields = mutatableState.fields
      state.fieldSubscribers = mutatableState.fieldSubscribers
      state.lastFormState = mutatableState.lastFormState
      runValidation(undefined, () => {
        notifyFieldListeners()
        notifyFormListeners()
      })
      return returnValue
    }
  }

  const mutatorsApi = mutators
    ? Object.keys(mutators).reduce((result, key) => {
        result[key] = getMutatorApi(key)
        return result
      }, {})
    : {}

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
          state.formState.values,
          validator.length === 3
            ? publishFieldState(state.formState, state.fields[field.name])
            : undefined
        )

        if (errorOrPromise && isPromise(errorOrPromise)) {
          const asyncValidationPromiseKey = nextAsyncValidationKey++
          const promise = errorOrPromise
            .then(setError) // errors must be resolved, not rejected
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
      const changedField = fields[fieldChanged]
      if (changedField) {
        const { validateFields } = changedField
        if (validateFields) {
          limitedFieldLevelValidation = true
          fieldKeys = validateFields.length
            ? validateFields.concat(fieldChanged)
            : [fieldChanged]
        }
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

      const afterPromises = () => {
        state.formState.validating--
        processErrors()
        if (callback) {
          callback()
        }
      }
      Promise.all(promises).then(afterPromises, afterPromises)
    } else if (callback) {
      callback()
    }
  }

  const notifyFieldListeners = (force: ?string) => {
    if (inBatch || validationPaused) {
      return
    }
    const { fields, fieldSubscribers, formState } = state
    Object.keys(fields).forEach(name => {
      const field = fields[name]
      const fieldState = publishFieldState(formState, field)
      const { lastFieldState } = field
      if (!shallowEqual(fieldState, lastFieldState)) {
        // **************************************************************
        // Curious about why a field is getting notified? Uncomment this.
        // **************************************************************
        // const diffKeys = Object.keys(fieldState).filter(
        //   key => fieldState[key] !== (lastFieldState && lastFieldState[key])
        // )
        // console.debug(
        //   'notifying',
        //   name,
        //   '\nField State\n',
        //   diffKeys.reduce(
        //     (result, key) => ({ ...result, [key]: fieldState[key] }),
        //     {}
        //   ),
        //   '\nLast Field State\n',
        //   diffKeys.reduce(
        //     (result, key) => ({
        //       ...result,
        //       [key]: lastFieldState && lastFieldState[key]
        //     }),
        //     {}
        //   )
        // )
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

  const markAllFieldsTouched = (): void => {
    Object.keys(state.fields).forEach(key => {
      state.fields[key].touched = true
    })
  }

  const hasSyncErrors = () =>
    !!(state.formState.error || hasAnyError(state.formState.errors))

  const calculateNextFormState = (): FormState => {
    const { fields, formState, lastFormState } = state
    const fieldKeys = Object.keys(fields)

    // calculate dirty/pristine
    let foundDirty = false
    const dirtyFields = fieldKeys.reduce((result, key) => {
      const dirty = !fields[key].isEqual(
        getIn(formState.values, key),
        getIn(formState.initialValues || {}, key)
      )
      if (dirty) {
        foundDirty = true
        result[key] = true
      }
      return result
    }, {})
    formState.pristine = !foundDirty
    formState.dirtySinceLastSubmit = !!(
      formState.lastSubmittedValues &&
      !fieldKeys.every(key => {
        // istanbul ignore next
        const nonNullLastSubmittedValues = formState.lastSubmittedValues || {} // || {} is for flow, but causes branch coverage complaint
        return fields[key].isEqual(
          getIn(formState.values, key),
          getIn(nonNullLastSubmittedValues, key)
        )
      })
    )

    formState.valid =
      !formState.error &&
      !formState.submitError &&
      !hasAnyError(formState.errors) &&
      !(formState.submitErrors && hasAnyError(formState.submitErrors))
    const nextFormState = convertToExternalFormState(formState)
    const { touched, visited } = fieldKeys.reduce(
      (result, key) => {
        result.touched[key] = fields[key].touched
        result.visited[key] = fields[key].visited
        return result
      },
      { touched: {}, visited: {} }
    )
    nextFormState.dirtyFields =
      lastFormState && shallowEqual(lastFormState.dirtyFields, dirtyFields)
        ? lastFormState.dirtyFields
        : dirtyFields
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
      calculateNextFormState(),
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
      if (!inBatch && !validationPaused) {
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
      const { formState } = state
      if (getIn(formState.values, name) !== value) {
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

    getState: () => calculateNextFormState(),

    initialize: (data: Object | (values: Object) => Object) => {
      const { fields, formState } = state
      const values = typeof data === 'function' ? data(formState.values) : data
      if (!keepDirtyOnReinitialize) {
        formState.values = values
      }
      Object.keys(fields).forEach(key => {
        const field = fields[key]
        field.touched = false
        field.visited = false
        if (keepDirtyOnReinitialize) {
          const pristine = fields[key].isEqual(
            getIn(formState.values, key),
            getIn(formState.initialValues || {}, key)
          )
          if (pristine) {
            // only update pristine values
            formState.values = setIn(formState.values, key, getIn(values, key))
          }
        }
      })
      formState.initialValues = values
      runValidation(undefined, () => {
        notifyFieldListeners()
        notifyFormListeners()
      })
    },

    isValidationPaused: () => validationPaused,

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
          state.formState.errors =
            setIn(state.formState.errors, name, undefined) || {}
          if (destroyOnUnregister) {
            state.formState.values =
              setIn(state.formState.values, name, undefined) || {}
          }
        }
        runValidation(undefined, () => {
          notifyFieldListeners()
          notifyFormListeners()
        })
      }
    },

    reset: (initialValues = state.formState.initialValues) => {
      state.formState.submitFailed = false
      state.formState.submitSucceeded = false
      delete state.formState.submitError
      delete state.formState.submitErrors
      delete state.formState.lastSubmittedValues
      api.initialize(initialValues || {})
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
        case 'destroyOnUnregister':
          destroyOnUnregister = value
          break
        case 'initialValues':
          api.initialize(value)
          break
        case 'keepDirtyOnReinitialize':
          keepDirtyOnReinitialize = value
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
      const { formState } = state
      if (hasSyncErrors()) {
        markAllFieldsTouched()
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
        ).then(api.submit, api.submit)
        return
      }

      let resolvePromise
      let completeCalled = false
      const complete = (errors: ?Object) => {
        formState.submitting = false
        if (errors && hasAnyError(errors)) {
          formState.submitFailed = true
          formState.submitSucceeded = false
          formState.submitErrors = errors
          formState.submitError = errors[FORM_ERROR]
          markAllFieldsTouched()
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
          resolvePromise(errors)
        }
        return errors
      }
      formState.submitting = true
      formState.submitFailed = false
      formState.submitSucceeded = false
      formState.lastSubmittedValues = { ...formState.values }

      // onSubmit is either sync, callback or async with a Promise
      const result = onSubmit(formState.values, api, complete)

      if (!completeCalled) {
        if (result && isPromise(result)) {
          // onSubmit is async with a Promise
          notifyFormListeners() // let everyone know we are submitting
          return result.then(complete, error => {
            complete()
            throw error
          })
        } else if (onSubmit.length >= 3) {
          // must be async, so we should return a Promise
          notifyFormListeners() // let everyone know we are submitting
          return new Promise(resolve => {
            resolvePromise = resolve
          })
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

import getIn from "./structure/getIn";
import setIn from "./structure/setIn";
import publishFieldState from "./publishFieldState";
import filterFieldState from "./filterFieldState";
import filterFormState from "./filterFormState";
import memoize from "./memoize";
import isPromise from "./isPromise";
import shallowEqual from "./shallowEqual";
import {
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
  Unsubscribe,
  StateFilter,
  AnyObject,
  DebugFunction,
} from "./types";
import { FORM_ERROR, ARRAY_ERROR } from "./constants";
export { version } from "./version";

export const configOptions: ConfigKey[] = [
  "debug",
  "initialValues",
  "keepDirtyOnReinitialize",
  "mutators",
  "onSubmit",
  "validate",
  "validateOnBlur",
  "callbackScheduler",
];

const tripleEquals: IsEqual = (a: any, b: any): boolean => a === b;

type InternalState<
  FormValues extends Record<string, any> = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = {
  subscribers: Subscribers<FormState<FormValues, InitialFormValues>>,
  lastFormState?: FormState<FormValues, InitialFormValues>,
  fields: {
    [key: string]: InternalFieldState,
  },
  fieldSubscribers: { [key: string]: Subscribers<FieldState> },
  formState: InternalFormState<FormValues>,
} & MutableState<FormValues, InitialFormValues>;

const hasAnyError = (errors: AnyObject): boolean => {
  return Object.keys(errors).some((key) => {
    const value = errors[key];

    if (value && typeof value === "object" && !(value instanceof Error)) {
      return hasAnyError(value);
    }

    return typeof value !== "undefined";
  });
};

function convertToExternalFormState<
  FormValues extends Record<string, any> = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
>({
  active,
  dirtySinceLastSubmit,
  modifiedSinceLastSubmit,
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
  values,
}: InternalFormState<FormValues>): FormState<FormValues, InitialFormValues> {
  return {
    active: active as keyof FormValues | undefined,
    dirty: !pristine,
    dirtySinceLastSubmit,
    modifiedSinceLastSubmit,
    error,
    errors,
    hasSubmitErrors: !!(
      submitError ||
      (submitErrors && hasAnyError(submitErrors))
    ),
    hasValidationErrors: !!(error || (errors && hasAnyError(errors))),
    invalid: !valid,
    initialValues: initialValues as InitialFormValues | undefined,
    pristine,
    submitting,
    submitFailed,
    submitSucceeded,
    submitError,
    submitErrors,
    valid,
    validating: validating > 0,
    values,
  };
}

function notifySubscriber<T extends Record<string, any>>(
  subscriber: Subscriber<T>,
  subscription: Subscription,
  state: T,
  lastState: T | undefined,
  filter: StateFilter<T>,
  force: boolean
): boolean {
  const notification = filter(state, lastState, subscription, force);
  if (notification) {
    subscriber(notification);
    return true;
  }
  return false;
}

function notify<T extends Record<string, any>>(
  { entries }: Subscribers<T>,
  state: T,
  lastState: T,
  filter: StateFilter<T>,
  force?: boolean,
): void {
  Object.keys(entries).forEach((key) => {
    const entry = entries[Number(key)];
    // istanbul ignore next
    if (entry) {
      const { subscription, subscriber, notified } = entry;
      if (
        notifySubscriber(
          subscriber,
          subscription,
          state,
          lastState,
          filter,
          force || !notified,
        )
      ) {
        entry.notified = true;
      }
    }
  });
}

function createForm<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
>(config: Config<FormValues, InitialFormValues>): FormApi<FormValues, InitialFormValues> {
  if (!config) {
    throw new Error("No config specified");
  }
  let {
    debug,
    destroyOnUnregister,
    keepDirtyOnReinitialize,
    initialValues,
    mutators,
    onSubmit,
    validate,
    validateOnBlur,
    callbackScheduler,
  } = config;
  if (!onSubmit) {
    throw new Error("No onSubmit function specified");
  }

  const state: InternalState<FormValues, InitialFormValues> = {
    subscribers: { index: 0, entries: {} },
    fieldSubscribers: {},
    fields: {},
    formState: {
      asyncErrors: {},
      dirtySinceLastSubmit: false,
      modifiedSinceLastSubmit: false,
      errors: {},
      initialValues: initialValues && { ...initialValues } as InitialFormValues,

      pristine: true,
      submitting: false,
      submitFailed: false,
      submitSucceeded: false,
      resetWhileSubmitting: false,
      valid: true,
      validating: 0,
      values: (initialValues ? { ...initialValues } : {}) as FormValues,
    },
    lastFormState: undefined,
  };
  let inBatch = 0;
  let validationPaused = false;
  let validationBlocked = false;
  let preventNotificationWhileValidationPaused = false;
  let nextAsyncValidationKey = 0;
  const asyncValidationPromises: { [key: number]: Promise<any> } = {};
  const pendingAsyncCallbacks: (() => void)[] = [];
  let asyncCallbacksScheduled = false;
  const clearAsyncValidationPromise = (key: number) => (result: any) => {
    delete asyncValidationPromises[key];
    return result;
  };

  const scheduleAsyncCallbacks = () => {
    if (!asyncCallbacksScheduled && pendingAsyncCallbacks.length > 0) {
      asyncCallbacksScheduled = true;
      const scheduler = callbackScheduler || ((callback) => setTimeout(callback, 0));
      scheduler(() => {
        const callbacks = [...pendingAsyncCallbacks];
        pendingAsyncCallbacks.length = 0;
        asyncCallbacksScheduled = false;
        callbacks.forEach(callback => callback());
      });
    }
  };

  const executeCallback = (callback: () => void, isAsync: boolean) => {
    if (isAsync) {
      pendingAsyncCallbacks.push(callback);
      scheduleAsyncCallbacks();
    } else {
      callback();
    }
  };

  const changeValue: ChangeValue<FormValues, InitialFormValues> = (state, name, mutate) => {
    const before = getIn(state.formState.values as object, name);
    const after = mutate(before);
    state.formState.values = (setIn(state.formState.values as object, name, after) || {}) as FormValues;
  };
  const renameField: RenameField<FormValues, InitialFormValues> = (state, from, to) => {
    if (state.fields[from]) {
      state.fields = {
        ...state.fields,
        [to]: {
          ...state.fields[from],
          name: to,
          // rebind event handlers
          blur: () => api.blur(to as keyof FormValues),
          change: (value) => api.change(to as keyof FormValues, value),
          focus: () => api.focus(to as keyof FormValues),
          lastFieldState: undefined,
        },
      };
      delete state.fields[from];
      state.fieldSubscribers = {
        ...state.fieldSubscribers,
        [to]: state.fieldSubscribers[from],
      };
      delete state.fieldSubscribers[from];
      const value = getIn(state.formState.values as object, from);
      state.formState.values =
        (setIn(state.formState.values as object, from, undefined) || {}) as FormValues;
      state.formState.values = (setIn(state.formState.values as object, to, value) || {}) as FormValues;
      delete state.lastFormState;
    }
  };

  // bind state to mutators
  const getMutatorApi = (key: string) => (...args: any[]) => {
    // istanbul ignore next
    if (mutators) {
      // ^^ causes branch coverage warning, but needed to appease the Flow gods
      const mutatableState: MutableState<FormValues, InitialFormValues> = {
        formState: state.formState,
        fields: state.fields,
        fieldSubscribers: state.fieldSubscribers,
        lastFormState: state.lastFormState,
      };
      const returnValue = mutators[key](args, mutatableState, {
        changeValue,
        getIn,
        renameField,
        resetFieldState: api.resetFieldState as (name: string) => void,
        setIn,
        shallowEqual,
      });
      state.formState = mutatableState.formState;
      state.fields = mutatableState.fields;
      state.fieldSubscribers = mutatableState.fieldSubscribers;
      state.lastFormState = mutatableState.lastFormState;
      runValidation(undefined, () => {
        notifyFieldListeners(undefined);
        notifyFormListeners();
      });
      return returnValue;
    }
  };

  const mutatorsApi = mutators
    ? Object.keys(mutators).reduce((result, key) => {
      result[key] = getMutatorApi(key);
      return result;
    }, {})
    : {};

  const runRecordLevelValidation = (
    setErrors: (errors: AnyObject, isAsync: boolean) => void,
  ): Promise<any>[] => {
    const promises = [];
    if (validate) {
      const errorsOrPromise = validate({ ...state.formState.values }); // clone to avoid writing
      if (isPromise(errorsOrPromise)) {
        promises.push(
          errorsOrPromise.then((errors: any) => setErrors(errors, true)),
        );
      } else {
        setErrors(errorsOrPromise, false);
      }
    }
    return promises;
  };

  const getValidators = (field: InternalFieldState) =>
    Object.keys(field.validators).reduce((result, index) => {
      const validator = field.validators[Number(index)]();
      if (validator) {
        result.push(validator);
      }
      return result;
    }, []);

  const runFieldLevelValidation = (
    field: InternalFieldState,
    setError: (error: any | undefined) => void,
  ): Promise<any>[] => {
    const promises = [];
    const validators = getValidators(field);
    if (validators.length) {
      let error: any;
      validators.forEach((validator) => {
        const errorOrPromise = validator(
          getIn(state.formState.values as object, field.name),
          state.formState.values,
          validator.length === 0 || validator.length === 3
            ? publishFieldState(state.formState, state.fields[field.name])
            : undefined,
        );

        if (errorOrPromise && isPromise(errorOrPromise)) {
          field.validating = true;
          const promise = errorOrPromise.then((error) => {
            if (state.fields[field.name]) {
              state.fields[field.name].validating = false;
              setError(error);
            }
          }); // errors must be resolved, not rejected
          promises.push(promise);
        } else if (!error) {
          // first registered validator wins
          error = errorOrPromise;
        }
      });
      setError(error);
    }
    return promises;
  };

  const runValidation = (fieldChanged: string | undefined, callback: () => void) => {
    if (validationPaused) {
      validationBlocked = true;
      callback();
      return;
    }

    const { fields, formState } = state;
    const safeFields = { ...fields };
    let fieldKeys = Object.keys(safeFields);
    if (
      !validate &&
      !fieldKeys.some((key) => getValidators(safeFields[key]).length)
    ) {
      callback();
      return; // no validation rules
    }

    // pare down field keys to actually validate
    let limitedFieldLevelValidation = false;
    if (fieldChanged) {
      const changedField = safeFields[fieldChanged];
      if (changedField) {
        const { validateFields } = changedField;
        if (validateFields) {
          limitedFieldLevelValidation = true;
          fieldKeys = validateFields.length
            ? validateFields.concat(fieldChanged)
            : [fieldChanged];
        }
      }
    }

    let recordLevelErrors: AnyObject = {};
    let asyncRecordLevelErrors: AnyObject = {};
    const fieldLevelErrors: Record<string, any> = {};

    const promises = [
      ...runRecordLevelValidation((errors, wasAsync: boolean) => {
        if (wasAsync) {
          asyncRecordLevelErrors = errors || {};
        } else {
          recordLevelErrors = errors || {};
        }
      }),
      ...fieldKeys.reduce(
        (result, name) =>
          result.concat(
            runFieldLevelValidation(fields[name], (error: any) => {
              fieldLevelErrors[name] = error;
            }),
          ),
        [],
      ),
    ];

    const hasAsyncValidations = promises.length > 0;
    const asyncValidationPromiseKey = ++nextAsyncValidationKey;
    const promise = Promise.all(promises).then(
      clearAsyncValidationPromise(asyncValidationPromiseKey),
    );

    // backwards-compat: add promise to submit-blocking promises iff there are any promises to await
    if (hasAsyncValidations) {
      asyncValidationPromises[asyncValidationPromiseKey] = promise;
    }

    const processErrors = (afterAsync: boolean) => {
      let merged = {
        ...(limitedFieldLevelValidation ? formState.errors : {}),
        ...recordLevelErrors,
        ...(afterAsync
          ? asyncRecordLevelErrors // new async errors
          : formState.asyncErrors), // previous async errors
      };
      const forEachError = (fn: (name: string, error: any) => void) => {
        fieldKeys.forEach((name) => {
          if (fields[name]) {
            // make sure field is still registered
            // field-level errors take precedent over record-level errors
            const recordLevelError = getIn(recordLevelErrors, name);
            const errorFromParent = getIn(merged, name);
            const hasFieldLevelValidation = getValidators(safeFields[name])
              .length;
            const fieldLevelError = fieldLevelErrors[name];
            fn(
              name,
              (hasFieldLevelValidation && fieldLevelError) ||
              (validate && recordLevelError) ||
              (!recordLevelError && !limitedFieldLevelValidation
                ? errorFromParent
                : undefined),
            );
          }
        });
      };
      forEachError((name, error) => {
        merged = setIn(merged, name, error) || {};
      });
      forEachError((name, error) => {
        if (error && error[ARRAY_ERROR]) {
          const existing = getIn(merged, name);
          const copy: any = [...existing];
          copy[ARRAY_ERROR] = error[ARRAY_ERROR];
          merged = setIn(merged, name, copy);
        }
      });
      if (!shallowEqual(formState.errors, merged)) {
        formState.errors = merged;
      }
      if (afterAsync) {
        formState.asyncErrors = asyncRecordLevelErrors;
      }
      formState.error = recordLevelErrors[FORM_ERROR];
    };

    if (hasAsyncValidations) {
      // async validations are running, ensure validating is true before notifying
      state.formState.validating++;
      callback();
    }

    // process sync errors
    processErrors(false);
    // sync errors have been set. notify listeners while we wait for others
    callback();

    if (hasAsyncValidations) {
      const afterPromise = () => {
        state.formState.validating--;
        callback();
        // field async validation may affect formState validating
        // so force notifyFormListeners if validating is still 0 after callback finished
        // and lastFormState validating is true
        if (state.formState.validating === 0 && state.lastFormState.validating) {
          notifyFormListeners();
        }
      };

      promise
        .then(() => {
          if (nextAsyncValidationKey > asyncValidationPromiseKey) {
            // if this async validator has been superseded by another, ignore its results
            return;
          }

          processErrors(true);
        })
        .then(afterPromise, afterPromise);
    }
  };

  const notifyFieldListeners = (name: string | undefined) => {
    if (inBatch) {
      return;
    }
    const { fields, fieldSubscribers, formState } = state;
    const safeFields = { ...fields };
    const notifyField = (name: string | undefined) => {
      const field = safeFields[name];
      const fieldState = publishFieldState(formState, field);
      const { lastFieldState } = field;
      field.lastFieldState = fieldState;
      const fieldSubscriber = fieldSubscribers[name];
      if (fieldSubscriber) {
        notify(
          fieldSubscriber,
          fieldState,
          lastFieldState,
          filterFieldState,
          lastFieldState === undefined,
        );
      }
    };
    if (name) {
      notifyField(name);
    } else {
      Object.keys(safeFields).forEach(notifyField);
    }
  };

  const markAllFieldsTouched = (): void => {
    Object.keys(state.fields).forEach((key) => {
      state.fields[key].touched = true;
    });
  };

  const hasSyncErrors = () =>
    !!(state.formState.error || hasAnyError(state.formState.errors));

  const calculateNextFormState = (): FormState<FormValues, InitialFormValues> => {
    const { fields, formState, lastFormState } = state;
    const safeFields = { ...fields };
    const safeFieldKeys = Object.keys(safeFields);

    // calculate dirty/pristine
    let foundDirty = false;
    const dirtyFields = safeFieldKeys.reduce((result, key) => {
      const dirty = !safeFields[key].isEqual(
        getIn(formState.values as Record<string, any>, key),
        getIn(formState.initialValues as Record<string, any> || {}, key),
      );
      if (dirty) {
        foundDirty = true;
        result[key] = true;
      }
      return result;
    }, {});
    const dirtyFieldsSinceLastSubmit = safeFieldKeys.reduce((result, key) => {
      // istanbul ignore next
      const nonNullLastSubmittedValues = formState.lastSubmittedValues || {}; // || {} is for flow, but causes branch coverage complaint
      if (
        !safeFields[key].isEqual(
          getIn(formState.values as Record<string, any>, key),
          getIn(nonNullLastSubmittedValues, key),
        )
      ) {
        result[key] = true;
      }
      return result;
    }, {});
    formState.pristine = !foundDirty;
    formState.dirtySinceLastSubmit = !!(
      formState.lastSubmittedValues &&
      Object.values(dirtyFieldsSinceLastSubmit).some((value) => value)
    );
    formState.modifiedSinceLastSubmit = !!(
      formState.lastSubmittedValues &&
      // Object.values would treat values as mixed (facebook/flow#2221)
      Object.keys(safeFields).some(
        (value) => safeFields[value].modifiedSinceLastSubmit,
      )
    );

    formState.valid =
      !formState.error &&
      !formState.submitError &&
      !hasAnyError(formState.errors) &&
      !(formState.submitErrors && hasAnyError(formState.submitErrors));
    const nextFormState = convertToExternalFormState(formState) as FormState<FormValues, InitialFormValues>;
    const { modified, touched, visited } = safeFieldKeys.reduce(
      (result, key) => {
        result.modified[key] = safeFields[key].modified;
        result.touched[key] = safeFields[key].touched;
        result.visited[key] = safeFields[key].visited;
        return result;
      },
      { modified: {}, touched: {}, visited: {} },
    );
    nextFormState.dirtyFields =
      lastFormState && shallowEqual(lastFormState.dirtyFields, dirtyFields)
        ? lastFormState.dirtyFields
        : dirtyFields;
    nextFormState.dirtyFieldsSinceLastSubmit =
      lastFormState &&
        shallowEqual(
          lastFormState.dirtyFieldsSinceLastSubmit,
          dirtyFieldsSinceLastSubmit,
        )
        ? lastFormState.dirtyFieldsSinceLastSubmit
        : dirtyFieldsSinceLastSubmit;
    nextFormState.modified =
      lastFormState && shallowEqual(lastFormState.modified, modified)
        ? lastFormState.modified
        : modified;
    nextFormState.touched =
      lastFormState && shallowEqual(lastFormState.touched, touched)
        ? lastFormState.touched
        : touched;
    nextFormState.visited =
      lastFormState && shallowEqual(lastFormState.visited, visited)
        ? lastFormState.visited
        : visited;
    return lastFormState && shallowEqual(lastFormState, nextFormState)
      ? lastFormState
      : nextFormState;
  };

  const callDebug = () =>
    debug &&
    process.env.NODE_ENV !== "production" &&
    debug(
      calculateNextFormState(),
      Object.keys(state.fields).reduce((result, key: string) => {
        result[key] = state.fields[key];
        return result;
      }, {}),
    );

  let notifying: boolean = false;
  let scheduleNotification: boolean = false;
  const notifyFormListeners = () => {
    if (notifying) {
      scheduleNotification = true;
    } else {
      notifying = true;
      callDebug();
      if (
        !inBatch &&
        !(validationPaused && preventNotificationWhileValidationPaused)
      ) {
        const { lastFormState } = state;
        const nextFormState = calculateNextFormState();
        if (nextFormState !== lastFormState) {
          state.lastFormState = nextFormState;
          notify(
            state.subscribers,
            nextFormState,
            lastFormState,
            filterFormState,
          );
        }
      }
      notifying = false;
      if (scheduleNotification) {
        scheduleNotification = false;
        notifyFormListeners();
      }
    }
  };

  const beforeSubmit = (): boolean =>
    Object.keys(state.fields).some(
      (name) =>
        state.fields[name].beforeSubmit &&
        state.fields[name].beforeSubmit() === false,
    );

  const afterSubmit = (): void =>
    Object.keys(state.fields).forEach(
      (name) =>
        state.fields[name].afterSubmit && state.fields[name].afterSubmit(),
    );

  const resetModifiedAfterSubmit = (): void =>
    Object.keys(state.fields).forEach(
      (key) => (state.fields[key].modifiedSinceLastSubmit = false),
    );

  // generate initial errors
  runValidation(undefined, () => {
    notifyFormListeners();
  });

  const api: FormApi<FormValues, InitialFormValues> = {
    batch: (fn: () => void) => {
      inBatch++;
      fn();
      inBatch--;
      notifyFieldListeners(undefined);
      notifyFormListeners();
    },

    blur: (name: keyof FormValues) => {
      const { fields, formState } = state;
      const previous = fields[name as string];
      if (previous) {
        // can only blur registered fields
        delete formState.active;
        fields[name as string] = {
          ...previous,
          active: false,
          touched: true,
        };
        if (validateOnBlur) {
          runValidation(name as string, () => {
            notifyFieldListeners(undefined);
            notifyFormListeners();
          });
        } else {
          notifyFieldListeners(undefined);
          notifyFormListeners();
        }
      }
    },

    change: <F extends keyof FormValues>(name: F, value?: FormValues[F]) => {
      const { fields, formState } = state;
      if (getIn(formState.values as object, name as string) !== value) {
        changeValue(state, name as string, () => value);
        const previous = fields[name as string];
        if (previous) {
          // only track modified for registered fields
          fields[name as string] = {
            ...previous,
            modified: true,
            modifiedSinceLastSubmit: !!formState.lastSubmittedValues,
          };
        }
        if (validateOnBlur) {
          notifyFieldListeners(undefined);
          notifyFormListeners();
        } else {
          runValidation(name as string, () => {
            notifyFieldListeners(undefined);
            notifyFormListeners();
          });
        }
      }
    },

    get destroyOnUnregister() {
      return !!destroyOnUnregister;
    },

    set destroyOnUnregister(value: boolean) {
      destroyOnUnregister = value;
    },

    focus: (name: keyof FormValues) => {
      const field = state.fields[name as string];
      if (field && !field.active) {
        state.formState.active = name as string;
        field.active = true;
        field.visited = true;
        notifyFieldListeners(undefined);
        notifyFormListeners();
      }
    },

    mutators: mutatorsApi,

    getFieldState: <F extends keyof FormValues>(name: F) => {
      const field = state.fields[name as string];
      return field && field.lastFieldState;
    },

    getRegisteredFields: () => Object.keys(state.fields),

    getState: () => calculateNextFormState(),

    initialize: (data: AnyObject | ((values: AnyObject) => Object)) => {
      const { fields, formState } = state;
      const safeFields = { ...fields };
      const values = typeof data === "function" ? data(formState.values as object) : data;
      if (!keepDirtyOnReinitialize) {
        formState.values = values as FormValues;
      }
      // save dirty values
      const savedDirtyValues = keepDirtyOnReinitialize
        ? Object.keys(safeFields).reduce((result, key) => {
          const field = safeFields[key];
          const pristine = field.isEqual(
            getIn(formState.values as object, key),
            getIn(formState.initialValues as object || {}, key),
          );
          if (!pristine) {
            result[key] = getIn(formState.values as object, key);
          }
          return result;
        }, {} as Record<string, any>)
        : {};
      // update initialValues and values
      formState.initialValues = values as InitialFormValues;
      formState.values = values as FormValues;
      Object.keys(savedDirtyValues).forEach((key) => {
        formState.values =
          ((setIn(formState.values as object, key, savedDirtyValues[key]) as unknown) as FormValues) || ({} as FormValues);
      });
      runValidation(undefined, () => {
        notifyFieldListeners(undefined);
        notifyFormListeners();
      });
    },

    isValidationPaused: () => validationPaused,

    pauseValidation: (preventNotification: boolean = true) => {
      validationPaused = true;
      preventNotificationWhileValidationPaused = preventNotification;
    },

    registerField: <F extends keyof FormValues>(
      name: F,
      subscriber: FieldSubscriber<FormValues[F]>,
      subscription: FieldSubscription = {},
      fieldConfig?: FieldConfig<FormValues[F]>,
    ): Unsubscribe => {
      if (!state.fieldSubscribers[name as string]) {
        state.fieldSubscribers[name as string] = { index: 0, entries: {} };
      }
      const index = state.fieldSubscribers[name as string].index++;

      // save field subscriber callback
      state.fieldSubscribers[name as string].entries[index] = {
        subscriber: memoize(subscriber),
        subscription: subscription as Subscription,
        notified: false,
      };

      // create initial field state if not exists
      const field = state.fields[name as string] || {
        active: false,
        afterSubmit: fieldConfig && fieldConfig.afterSubmit,
        beforeSubmit: fieldConfig && fieldConfig.beforeSubmit,
        data: (fieldConfig && fieldConfig.data) || {},
        isEqual: (fieldConfig && fieldConfig.isEqual) || tripleEquals,
        lastFieldState: undefined,
        modified: false,
        modifiedSinceLastSubmit: false,
        name: name as string,
        touched: false,
        valid: true,
        validateFields: fieldConfig && fieldConfig.validateFields,
        validators: {},
        validating: false,
        visited: false,
        blur: () => api.blur(name),
        change: (value) => api.change(name, value),
        focus: () => api.focus(name),
      };
      // Mutators can create a field in order to keep the field states
      // We must update this field when registerField is called afterwards
      field.blur = field.blur || (() => api.blur(name));
      field.change = field.change || ((value) => api.change(name, value));
      field.focus = field.focus || (() => api.focus(name));
      state.fields[name as string] = field;
      let haveValidator = false;
      const silent = fieldConfig && fieldConfig.silent;
      const isAsync = fieldConfig && fieldConfig.async;
      const notify = () => {
        const callback = () => {
          if (silent && state.fields[name as string]) {
            notifyFieldListeners(name as string);
          } else {
            notifyFormListeners();
            notifyFieldListeners(undefined);
          }
        };
        executeCallback(callback, !!isAsync);
      };
      if (fieldConfig) {
        haveValidator = !!(
          fieldConfig.getValidator && fieldConfig.getValidator()
        );
        if (fieldConfig.getValidator) {
          state.fields[name as string].validators[index] = fieldConfig.getValidator;
        }

        const noValueInFormState =
          getIn(state.formState.values as object, name as string) === undefined;
        if (
          fieldConfig.initialValue !== undefined &&
          (noValueInFormState ||
            getIn(state.formState.values as object, name as string) ===
            getIn(state.formState.initialValues as object, name as string))
          // only initialize if we don't yet have any value for this field
        ) {
          state.formState.initialValues = setIn(
            state.formState.initialValues || {},
            name as string,
            fieldConfig.initialValue,
          ) as InitialFormValues;
          state.formState.values = setIn(
            state.formState.values as object,
            name as string,
            fieldConfig.initialValue,
          ) as FormValues;
          runValidation(undefined, notify);
        }

        // only use defaultValue if we don't yet have any value for this field
        if (
          fieldConfig.defaultValue !== undefined &&
          fieldConfig.initialValue === undefined &&
          getIn(state.formState.initialValues as object, name as string) === undefined &&
          noValueInFormState
        ) {
          state.formState.values = setIn(
            state.formState.values as object,
            name as string,
            fieldConfig.defaultValue,
          ) as FormValues;
        }
      }

      if (haveValidator) {
        runValidation(undefined, notify);
      } else {
        notify();
      }

      return () => {
        let validatorRemoved = false;
        // istanbul ignore next
        if (state.fields[name as string]) {
          // state.fields[name] may have been removed by a mutator
          validatorRemoved = !!(
            state.fields[name as string].validators[index] &&
            state.fields[name as string].validators[index]()
          );
          delete state.fields[name as string].validators[index];
        }
        let hasFieldSubscribers = !!state.fieldSubscribers[name as string];
        if (hasFieldSubscribers) {
          // state.fieldSubscribers[name] may have been removed by a mutator
          delete state.fieldSubscribers[name as string].entries[index];
        }
        let lastOne =
          hasFieldSubscribers &&
          !Object.keys(state.fieldSubscribers[name as string].entries).length;
        if (lastOne) {
          delete state.fieldSubscribers[name as string];
          delete state.fields[name as string];
          if (validatorRemoved) {
            state.formState.errors =
              setIn(state.formState.errors, name as string, undefined) || {};
          }
          if (destroyOnUnregister) {
            state.formState.values =
              (setIn(state.formState.values as object, name as string, undefined, true) as FormValues) || ({} as FormValues);
          }
        }
        if (!silent) {
          if (validatorRemoved) {
            runValidation(undefined, () => {
              notifyFormListeners();
              notifyFieldListeners(undefined);
            });
          } else if (lastOne) {
            // values or errors may have changed
            notifyFormListeners();
          }
        }
      };
    },

    reset: (initialValues = state.formState.initialValues) => {
      if (state.formState.submitting) {
        state.formState.resetWhileSubmitting = true;
      }
      state.formState.submitFailed = false;
      state.formState.submitSucceeded = false;
      delete state.formState.submitError;
      delete state.formState.submitErrors;
      delete state.formState.lastSubmittedValues;
      api.initialize((initialValues || {}) as InitialFormValues);
    },

    /**
     * Resets all field flags (e.g. touched, visited, etc.) to their initial state
     */
    resetFieldState: (name: keyof FormValues) => {
      state.fields[name as string] = {
        ...state.fields[name as string],
        ...{
          active: false,
          lastFieldState: undefined,
          modified: false,
          touched: false,
          valid: true,
          validating: false,
          visited: false,
        },
      };
      runValidation(undefined, () => {
        notifyFieldListeners(undefined);
        notifyFormListeners();
      });
    },

    /**
     * Returns the form to a clean slate; that is:
     * - Clear all values
     * - Resets all fields to their initial state
     */
    restart: (initialValues = state.formState.initialValues) => {
      api.batch(() => {
        for (const name in state.fields) {
          api.resetFieldState(name as keyof FormValues);
          state.fields[name] = {
            ...state.fields[name],
            ...{
              active: false,
              lastFieldState: undefined,
              modified: false,
              modifiedSinceLastSubmit: false,
              touched: false,
              valid: true,
              validating: false,
              visited: false,
            },
          };
        }
        api.reset((initialValues || {}) as InitialFormValues);
      });
    },

    resumeValidation: () => {
      validationPaused = false;
      preventNotificationWhileValidationPaused = false;
      if (validationBlocked) {
        // validation was attempted while it was paused, so run it now
        runValidation(undefined, () => {
          notifyFieldListeners(undefined);
          notifyFormListeners();
        });
      }
      validationBlocked = false;
    },

    setConfig: <K extends ConfigKey>(
      name: K,
      value: Config<FormValues, InitialFormValues>[K]
    ): void => {
      switch (name) {
        case "debug":
          debug = (typeof value === "function" ? value : undefined) as DebugFunction<FormValues, InitialFormValues>;
          break;
        case "destroyOnUnregister":
          destroyOnUnregister = value as boolean;
          break;
        case "initialValues":
          api.initialize(value as InitialFormValues);
          break;
        case "keepDirtyOnReinitialize":
          keepDirtyOnReinitialize = value as boolean;
          break;
        case "mutators":
          mutators = value as any;
          if (value) {
            Object.keys(mutatorsApi).forEach((key) => {
              if (!(key in (value as any))) {
                delete mutatorsApi[key];
              }
            });
            Object.keys(value as any).forEach((key) => {
              mutatorsApi[key] = getMutatorApi(key);
            });
          } else {
            Object.keys(mutatorsApi).forEach((key) => {
              delete mutatorsApi[key];
            });
          }
          break;
        case "onSubmit":
          onSubmit = value as any;
          break;
        case "validate":
          validate = value as any;
          runValidation(undefined, () => {
            notifyFieldListeners(undefined);
            notifyFormListeners();
          });
          break;
        case "validateOnBlur":
          validateOnBlur = value as boolean;
          break;
        case "callbackScheduler":
          callbackScheduler = value as ((callback: () => void) => void) | undefined;
          break;
        default:
          throw new Error("Unrecognised option " + name);
      }
    },

    setCallbackScheduler: (scheduler?: (callback: () => void) => void) => {
      callbackScheduler = scheduler;
    },

    submit: (): Promise<FormValues | undefined> => {
      const { formState } = state;

      if (formState.submitting) {
        return Promise.resolve(undefined);
      }

      delete formState.submitErrors;
      delete formState.submitError;
      formState.lastSubmittedValues = { ...formState.values };

      if (hasSyncErrors()) {
        markAllFieldsTouched();
        resetModifiedAfterSubmit();
        state.formState.submitFailed = true;
        notifyFormListeners();
        notifyFieldListeners(undefined);
        return Promise.resolve(undefined);
      }
      const asyncValidationPromisesKeys = Object.keys(asyncValidationPromises);
      if (asyncValidationPromisesKeys.length) {
        // still waiting on async validation to complete...
        return Promise.all(
          asyncValidationPromisesKeys.map(
            (key) => asyncValidationPromises[Number(key)],
          ),
        ).then(
          () => api.submit(),
          (err) => {
            console.error(err);
            return undefined;
          }
        ) as Promise<FormValues | undefined>;
      }
      const submitIsBlocked = beforeSubmit();
      if (submitIsBlocked) {
        return Promise.resolve(undefined);
      }

      let resolvePromise: any
      let completeCalled = false;
      const complete = (errors: AnyObject | undefined) => {
        formState.submitting = false;
        const { resetWhileSubmitting } = formState;
        if (resetWhileSubmitting) {
          formState.resetWhileSubmitting = false;
        }
        if (errors && hasAnyError(errors)) {
          formState.submitFailed = true;
          formState.submitSucceeded = false;
          formState.submitErrors = errors;
          formState.submitError = errors[FORM_ERROR];
          markAllFieldsTouched();
        } else {
          if (!resetWhileSubmitting) {
            formState.submitFailed = false;
            formState.submitSucceeded = true;
          }
          afterSubmit();
        }
        notifyFormListeners();
        notifyFieldListeners(undefined);
        completeCalled = true;
        if (resolvePromise) {
          resolvePromise(errors);
        }
        return errors;
      };

      formState.submitting = true;
      formState.submitFailed = false;
      formState.submitSucceeded = false;
      formState.lastSubmittedValues = { ...formState.values };
      resetModifiedAfterSubmit();

      // onSubmit is either sync, callback or async with a Promise
      const result = onSubmit(formState.values, api, complete);

      if (!completeCalled) {
        if (result && isPromise(result)) {
          // onSubmit is async with a Promise
          notifyFormListeners(); // let everyone know we are submitting
          notifyFieldListeners(undefined); // notify fields also
          return (result as Promise<FormValues | undefined>).then(
            (value) => {
              complete(value as AnyObject);
              return value;
            },
            (error) => {
              complete(undefined);
              throw error;
            }
          );
        } else if (onSubmit.length >= 3) {
          // must be async, so we should return a Promise
          notifyFormListeners(); // let everyone know we are submitting
          notifyFieldListeners(undefined); // notify fields also
          return new Promise<FormValues | undefined>((resolve) => {
            resolvePromise = resolve;
          });
        } else {
          // onSubmit is sync
          complete(result as FormValues);
        }
      }
      return Promise.resolve(undefined as FormValues | undefined);
    },

    subscribe: (
      subscriber: FormSubscriber<FormValues, InitialFormValues>,
      subscription: FormSubscription,
    ): Unsubscribe => {
      if (!subscriber) {
        throw new Error("No callback given.");
      }
      if (!subscription) {
        throw new Error(
          "No subscription provided. What values do you want to listen to?",
        );
      }
      const memoized = memoize(subscriber);
      const { subscribers } = state;
      const index = subscribers.index++;
      subscribers.entries[index] = {
        subscriber: memoized as Subscriber<FormState<FormValues, InitialFormValues>>,
        subscription: subscription as Subscription,
        notified: false,
      };
      const nextFormState = calculateNextFormState();
      notifySubscriber(
        memoized as Subscriber<FormState<FormValues, InitialFormValues>>,
        subscription as Subscription,
        nextFormState,
        nextFormState,
        filterFormState,
        true,
      );
      return () => {
        delete subscribers.entries[index];
      };
    },
  };
  return api;
}

export default createForm;

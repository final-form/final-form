import type { InternalFieldState, InternalFormState, FieldState } from "./types";
import getIn from "./structure/getIn";
import { ARRAY_ERROR } from "./constants";

/**
 * Converts internal field state to published field state
 */
function publishFieldState<FormValues = Record<string, any>>(
  formState: InternalFormState<FormValues>,
  field: InternalFieldState
): FieldState {
  const {
    errors,
    initialValues,
    lastSubmittedValues,
    submitErrors,
    submitFailed,
    submitSucceeded,
    submitting,
    values,
  } = formState;
  const {
    active,
    blur,
    change,
    data,
    focus,
    modified,
    modifiedSinceLastSubmit,
    name,
    touched,
    validating,
    visited,
  } = field;
  const value = getIn(values as object, name);
  let error = errors ? getIn(errors as object, name) : undefined;
  if (error && error[ARRAY_ERROR]) {
    error = error[ARRAY_ERROR];
  }
  const submitError = submitErrors && getIn(submitErrors as object, name);
  const initial = initialValues && getIn(initialValues, name);
  const pristine = field.isEqual(initial, value);
  const dirtySinceLastSubmit = !!(
    lastSubmittedValues &&
    !field.isEqual(getIn(lastSubmittedValues, name), value)
  );
  const valid = !error && !submitError;
  return {
    active,
    blur,
    change,
    data,
    dirty: !pristine,
    dirtySinceLastSubmit,
    error,
    focus,
    initial,
    invalid: !valid,
    length: Array.isArray(value) ? value.length : undefined,
    modified,
    modifiedSinceLastSubmit,
    name,
    pristine,
    submitError,
    submitFailed,
    submitSucceeded,
    submitting,
    touched,
    valid,
    value,
    visited,
    validating: validating > 0,
  };
}

export default publishFieldState; 
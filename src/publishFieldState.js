// @flow
import type { InternalFieldState, InternalFormState } from './types'
import type { FieldState } from './types'
import getIn from './structure/getIn'
import { ARRAY_ERROR } from './constants'

/**
 * Converts internal field state to published field state
 */
const publishFieldState = (
  formState: InternalFormState,
  field: InternalFieldState
): FieldState => {
  const {
    errors,
    initialValues,
    lastSubmittedValues,
    submitErrors,
    submitFailed,
    submitSucceeded,
    values
  } = formState
  const { active, blur, change, data, focus, name, touched, visited } = field
  const value = getIn(values, name)
  let error = getIn(errors, name)
  if (error && error[ARRAY_ERROR]) {
    error = error[ARRAY_ERROR]
  }
  const submitError = submitErrors && getIn((submitErrors: Object), name)
  const initial = initialValues && getIn(initialValues, name)
  const pristine = field.isEqual(initial, value)
  const dirtySinceLastSubmit = !!(
    lastSubmittedValues &&
    !field.isEqual(getIn(lastSubmittedValues, name), value)
  )
  const valid = !error && !submitError
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
    name,
    pristine,
    submitError,
    submitFailed,
    submitSucceeded,
    touched,
    valid,
    value,
    visited
  }
}

export default publishFieldState

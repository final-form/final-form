// @flow
import type { InternalFieldState, InternalFormState } from './FinalForm'
import type { FieldState } from './types'

/**
 * Converts internal field state to published field state
 */
const publishFieldState = (
  form: InternalFormState,
  field: InternalFieldState
): FieldState => {
  const { submitFailed, submitSucceeded } = form
  const {
    active,
    blur,
    change,
    error,
    focus,
    initial,
    name,
    submitError,
    touched,
    value,
    visited
  } = field
  const pristine = initial === value
  const valid = !error && !submitError
  return {
    active,
    blur,
    change,
    dirty: !pristine,
    error,
    focus,
    initial,
    invalid: !valid,
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

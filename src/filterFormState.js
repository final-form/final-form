// @flow
import formSubscriptionItems from './formSubscriptionItems'
import subscriptionFilter from './subscriptionFilter'
import type { StateFilter } from './FinalForm'
import type { FormState, FormSubscription } from './types'

/**
 * Filters items in a FormState based on a FormSubscription
 */
const filterFormState: StateFilter<FormState> = (
  state: FormState,
  previousState: ?FormState,
  subscription: FormSubscription,
  force: boolean
): ?FormState => {
  const result: FormState = {}
  const different =
    subscriptionFilter(
      result,
      state,
      previousState,
      subscription,
      formSubscriptionItems
    ) || !previousState
  return different || force ? result : undefined
}

export default filterFormState

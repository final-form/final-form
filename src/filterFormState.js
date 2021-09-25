// @flow
import formSubscriptionItems from "./formSubscriptionItems";
import subscriptionFilter from "./subscriptionFilter";
import type { FormState, FormSubscription, FormValuesShape } from "./types";

const shallowEqualKeys = ["touched", "visited"];

/**
 * Filters items in a FormState based on a FormSubscription
 */
export default function filterFormState<FormValues: FormValuesShape>(
  state: FormState<FormValues>,
  previousState: ?FormState<FormValues>,
  subscription: FormSubscription,
  force: boolean,
): ?FormState<FormValues> {
  const result: FormState<FormValues> = {};
  const different =
    subscriptionFilter(
      result,
      state,
      previousState,
      subscription,
      formSubscriptionItems,
      shallowEqualKeys,
    ) || !previousState;
  return different || force ? result : undefined;
}

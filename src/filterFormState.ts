import formSubscriptionItems from "./formSubscriptionItems";
import subscriptionFilter from "./subscriptionFilter";
import type {
  FormProp,
  FormState,
  FormSubscription,
  FormValuesShape,
} from "./types";

const shallowEqualKeys: FormProp[] = ["touched", "visited"];

/**
 * Filters items in a FormState based on a FormSubscription
 */
export default function filterFormState<FormValues extends FormValuesShape>(
  state: FormState<FormValues>,
  previousState: FormState<FormValues> | null | undefined,
  subscription: FormSubscription,
  force: boolean,
): FormState<FormValues> | null | undefined {
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

import formSubscriptionItems from "./formSubscriptionItems";
import subscriptionFilter from "./subscriptionFilter";
import type { FormState, FormSubscription } from "./types";

const shallowEqualKeys = ["touched", "visited"];

/**
 * Filters items in a FormState based on a FormSubscription
 */
export default function filterFormState<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
>(
  state: FormState<FormValues, InitialFormValues>,
  previousState: FormState<FormValues, InitialFormValues> | undefined,
  subscription: FormSubscription,
  force: boolean
): FormState<FormValues, InitialFormValues> | undefined {
  const result: FormState<FormValues, InitialFormValues> = {} as any;
  const different =
    subscriptionFilter(
      result,
      state,
      previousState,
      subscription as Record<string, boolean>,
      formSubscriptionItems as unknown as string[],
      shallowEqualKeys
    ) || !previousState;
  return different || force ? result : undefined;
} 
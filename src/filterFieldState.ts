import fieldSubscriptionItems from "./fieldSubscriptionItems";
import subscriptionFilter from "./subscriptionFilter";
import type { StateFilter, FieldState, FieldSubscription } from "./types";

const shallowEqualKeys = ["data"];

/**
 * Filters items in a FieldState based on a FieldSubscription
 */
const filterFieldState: StateFilter<FieldState> = (
  state: FieldState,
  previousState: FieldState | undefined,
  subscription: FieldSubscription,
  force: boolean,
): FieldState | undefined => {
  const result: FieldState = {
    blur: state.blur,
    change: state.change,
    focus: state.focus,
    name: state.name,
  };
  const different =
    subscriptionFilter(
      result,
      state,
      previousState,
      subscription as Record<string, boolean>,
      fieldSubscriptionItems as unknown as string[],
      shallowEqualKeys,
    ) || !previousState;
  return different || force ? result : undefined;
};

export default filterFieldState;

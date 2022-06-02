export type Subscription = Record<string, boolean>;
export type Subscriber<V> = (value: V) => void;
export type IsEqual = (a: any, b: any) => boolean;

export type FormValuesShape = Record<string, any>;

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};

export type FormProp =
  | "active"
  | "dirty"
  | "dirtyFields"
  | "dirtyFieldsSinceLastSubmit"
  | "dirtySinceLastSubmit"
  | "error"
  | "errors"
  | "hasSubmitErrors"
  | "hasValidationErrors"
  | "initialValues"
  | "invalid"
  | "modified"
  | "modifiedSinceLastSubmit"
  | "pristine"
  | "submitError"
  | "submitErrors"
  | "submitFailed"
  | "submitSucceeded"
  | "submitting"
  | "touched"
  | "valid"
  | "validating"
  | "values"
  | "visited";

export type FormSubscription = PartialRecord<FormProp, boolean>;

export interface FormState<FormValues extends FormValuesShape>
  extends PartialRecord<FormProp, unknown> {
  active?: string;
  dirty?: boolean;
  dirtyFields?: Record<string, boolean>;
  dirtyFieldsSinceLastSubmit?: Record<string, boolean>;
  dirtySinceLastSubmit?: boolean;
  error?: any;
  errors?: Record<string, any>;
  hasSubmitErrors?: boolean;
  hasValidationErrors?: boolean;
  initialValues?: FormValues;
  invalid?: boolean;
  modified?: Record<string, boolean>;
  modifiedSinceLastSubmit?: boolean;
  pristine?: boolean;
  submitError?: any;
  submitErrors?: Record<string, any>;
  submitFailed?: boolean;
  submitSucceeded?: boolean;
  submitting?: boolean;
  touched?: Record<string, boolean>;
  valid?: boolean;
  validating?: boolean;
  values?: FormValues;
  visited?: Record<string, boolean>;
}

export type FormSubscriber<FormValues extends FormValuesShape> = Subscriber<
  FormState<FormValues>
>;

export type FieldProp =
  | "active"
  | "blur"
  | "change"
  | "data"
  | "dirty"
  | "dirtySinceLastSubmit"
  | "error"
  | "focus"
  | "initial"
  | "invalid"
  | "length"
  | "modified"
  | "modifiedSinceLastSubmit"
  | "name"
  | "pristine"
  | "submitError"
  | "submitFailed"
  | "submitSucceeded"
  | "submitting"
  | "touched"
  | "valid"
  | "validating"
  | "value"
  | "visited";

export interface FieldState extends PartialRecord<FieldProp, any> {
  active?: boolean;
  blur: () => void;
  change: (value: any) => void;
  data?: Object;
  dirty?: boolean;
  dirtySinceLastSubmit?: boolean;
  error?: any;
  focus: () => void;
  initial?: any;
  invalid?: boolean;
  length?: number;
  modified?: boolean;
  modifiedSinceLastSubmit?: boolean;
  name: string;
  pristine?: boolean;
  submitError?: any;
  submitFailed?: boolean;
  submitSucceeded?: boolean;
  submitting?: boolean;
  touched?: boolean;
  valid?: boolean;
  validating?: boolean;
  value?: any;
  visited?: boolean;
}

export type FieldSubscription = PartialRecord<FieldProp, boolean>;

export type FieldSubscriber = Subscriber<FieldState>;
export type Subscribers<T extends Record<string, any>> = {
  index: number;
  entries: Record<
    number,
    {
      subscriber: Subscriber<T>;
      subscription: Subscription;
      notified: boolean;
    }
  >;
};

export type Unsubscribe = () => void;

export type FieldValidator = (
  value: any | null | undefined,
  allValues: Record<string, any>,
  meta: FieldState | null | undefined,
) => (any | Promise<any | null | undefined>) | null | undefined;
export type GetFieldValidator = () => FieldValidator | null | undefined;

export type FieldConfig = {
  afterSubmit?: () => void;
  beforeSubmit?: () => void | false;
  data?: any;
  defaultValue?: any;
  getValidator?: GetFieldValidator;
  initialValue?: any;
  isEqual?: IsEqual;
  silent?: boolean;
  validateFields?: string[];
};

export type RegisterField = (
  name: string,
  subscriber: FieldSubscriber,
  subscription: FieldSubscription,
  config?: FieldConfig,
) => Unsubscribe;

export type InternalFieldState = {
  active: boolean;
  afterSubmit?: () => void;
  beforeSubmit?: () => void | false;
  blur: () => void;
  change: (value: any) => void;
  data: Record<string, any>;
  focus: () => void;
  isEqual: IsEqual;
  lastFieldState: FieldState | null | undefined;
  length?: any;
  modified: boolean;
  modifiedSinceLastSubmit: boolean;
  name: string;
  touched: boolean;
  validateFields: string[] | null | undefined;
  validators: Record<number, GetFieldValidator>;
  valid: boolean;
  validating: boolean;
  visited: boolean;
};
export type InternalFormState<FormValues extends FormValuesShape> = {
  active?: string;
  asyncErrors: Record<string, any>;
  dirtySinceLastSubmit: boolean;
  modifiedSinceLastSubmit: boolean;
  error?: any;
  errors: Record<string, any>;
  initialValues?: FormValues;
  // initialValues?: Record<string, any>;
  invalid?: boolean;
  lastSubmittedValues?: Record<string, any>;
  pristine: boolean;
  resetWhileSubmitting: boolean;
  submitError?: any;
  submitErrors?: Record<string, any>;
  submitFailed: boolean;
  submitSucceeded: boolean;
  submitting: boolean;
  valid: boolean;
  validating: number;
  values: FormValues;
};
export type ConfigKey =
  | "debug"
  | "destroyOnUnregister"
  | "initialValues"
  | "keepDirtyOnReinitialize"
  | "mutators"
  | "onSubmit"
  | "validate"
  | "validateOnBlur";
export type FormApi<FormValues extends FormValuesShape> = {
  batch: (fn: () => void) => void;
  blur: (name: string) => void;
  change: (name: string, value: any | null | undefined) => void;
  destroyOnUnregister: boolean;
  focus: (name: string) => void;
  initialize: (
    data:
      | Record<string, any>
      | ((values: Record<string, any>) => Record<string, any>),
  ) => void;
  isValidationPaused: () => boolean;
  getFieldState: (field: string) => FieldState | null | undefined;
  getRegisteredFields: () => string[];
  getState: () => FormState<FormValues>;
  mutators: Record<string, (...args: any[]) => any>;
  pauseValidation: () => void;
  registerField: RegisterField;
  reset: (initialValues?: Record<string, any>) => void;
  resetFieldState: (name: string) => void;
  restart: (initialValues?: Record<string, any>) => void;
  resumeValidation: () => void;
  setConfig: (name: ConfigKey, value: any) => void;
  submit: () =>
    | Promise<Record<string, any> | null | undefined>
    | null
    | undefined;
  subscribe: (
    subscriber: FormSubscriber<FormValues>,
    subscription: FormSubscription,
  ) => Unsubscribe;
};
export type DebugFunction<FormValues extends FormValuesShape> = (
  state: FormState<FormValues>,
  fieldStates: Record<string, FieldState>,
) => void;
export type MutableState<FormValues extends FormValuesShape> = {
  fieldSubscribers: Record<string, Subscribers<FieldState>>;
  fields: Record<string, InternalFieldState>;
  formState: InternalFormState<FormValues>;
  lastFormState?: FormState<FormValues>;
};
export type GetIn = (state: Record<string, any>, complexKey: string) => any;
export type SetIn = <State extends Record<string, any>>(
  state: State | {},
  key: string,
  value: any,
  destroyArrays?: boolean,
) => State;
export type ChangeValue<FormValues extends FormValuesShape> = (
  state: MutableState<FormValues>,
  name: string,
  mutate: (value: any) => any,
) => void;
export type RenameField<FormValues extends FormValuesShape> = (
  state: MutableState<FormValues>,
  from: string,
  to: string,
) => void;
export type Tools<FormValues extends FormValuesShape> = {
  changeValue: ChangeValue<FormValues>;
  getIn: GetIn;
  renameField: RenameField<FormValues>;
  resetFieldState: (arg0: string) => void;
  setIn: SetIn;
  shallowEqual: IsEqual;
};
export type Mutator<FormValues extends FormValuesShape> = (
  args: any[],
  state: MutableState<FormValues>,
  tools: Tools<FormValues>,
) => any;
export type Config<FormValues extends FormValuesShape> = {
  debug?: DebugFunction<FormValues>;
  destroyOnUnregister?: boolean;
  initialValues?: FormValues;
  keepDirtyOnReinitialize?: boolean;
  mutators?: Record<string, Mutator<FormValues>>;
  onSubmit: (
    values: FormValues,
    form: FormApi<FormValues>,
    callback:
      | ((
          errors: Record<string, any> | null | undefined,
        ) => Record<string, any> | null | undefined)
      | null
      | undefined,
  ) =>
    | (Record<string, any> | null | undefined)
    | Promise<Record<string, any> | null | undefined>
    | void;
  validate?: (
    values: Record<string, any>,
  ) => Record<string, any> | Promise<Record<string, any>>;
  validateOnBlur?: boolean;
};
export type Decorator<FormValues extends FormValuesShape> = (
  form: FormApi<FormValues>,
) => Unsubscribe;

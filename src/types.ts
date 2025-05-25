export type Subscription = { [key: string]: boolean | undefined };
export type Subscriber<V> = (value: V) => void;
export type IsEqual = (a: any, b: any) => boolean;

export interface AnyObject {
  [key: string]: any;
}

export type ValidationErrors = AnyObject | undefined;
export type SubmissionErrors = AnyObject | undefined;

export interface FormSubscription extends Subscription {
  active?: boolean;
  dirty?: boolean;
  dirtyFields?: boolean;
  dirtyFieldsSinceLastSubmit?: boolean;
  dirtySinceLastSubmit?: boolean;
  modifiedSinceLastSubmit?: boolean;
  error?: boolean;
  errors?: boolean;
  hasSubmitErrors?: boolean;
  hasValidationErrors?: boolean;
  initialValues?: boolean;
  invalid?: boolean;
  modified?: boolean;
  pristine?: boolean;
  submitError?: boolean;
  submitErrors?: boolean;
  submitFailed?: boolean;
  submitting?: boolean;
  submitSucceeded?: boolean;
  touched?: boolean;
  valid?: boolean;
  validating?: boolean;
  values?: boolean;
  visited?: boolean;
}

export interface FormState<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> {
  active?: undefined | keyof FormValues;
  dirty?: boolean;
  dirtyFields?: { [key: string]: boolean };
  dirtyFieldsSinceLastSubmit?: { [key: string]: boolean };
  dirtySinceLastSubmit?: boolean;
  error?: any;
  errors?: ValidationErrors;
  hasSubmitErrors?: boolean;
  hasValidationErrors?: boolean;
  initialValues?: InitialFormValues;
  invalid?: boolean;
  modified?: { [key: string]: boolean };
  modifiedSinceLastSubmit?: boolean;
  pristine?: boolean;
  submitError?: any;
  submitErrors?: SubmissionErrors;
  submitFailed?: boolean;
  submitSucceeded?: boolean;
  submitting?: boolean;
  touched?: { [key: string]: boolean };
  valid?: boolean;
  validating?: boolean;
  values?: FormValues;
  visited?: { [key: string]: boolean };
}

export type FormSubscriber<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = Subscriber<FormState<FormValues, InitialFormValues>>;

export interface FieldState<FieldValue = any> {
  active?: boolean;
  blur: () => void;
  change: (value: FieldValue | undefined) => void;
  data?: AnyObject;
  dirty?: boolean;
  dirtySinceLastSubmit?: boolean;
  error?: any;
  focus: () => void;
  initial?: FieldValue;
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
  value?: FieldValue;
  visited?: boolean;
}

export interface FieldSubscription {
  active?: boolean;
  data?: boolean;
  dirty?: boolean;
  dirtySinceLastSubmit?: boolean;
  error?: boolean;
  initial?: boolean;
  invalid?: boolean;
  length?: boolean;
  modified?: boolean;
  modifiedSinceLastSubmit?: boolean;
  pristine?: boolean;
  submitError?: boolean;
  submitFailed?: boolean;
  submitSucceeded?: boolean;
  submitting?: boolean;
  touched?: boolean;
  valid?: boolean;
  validating?: boolean;
  value?: boolean;
  visited?: boolean;
}

export type FieldSubscriber<FieldValue = any> = Subscriber<FieldState<FieldValue>>;

export type Subscribers<T extends Object> = {
  index: number;
  entries: {
    [key: number]: {
      subscriber: Subscriber<T>;
      subscription: Subscription;
      notified: boolean;
    };
  };
};

export type Unsubscribe = () => void;

export type FieldValidator<FieldValue = any> = (
  value: FieldValue,
  allValues: object,
  meta?: FieldState<FieldValue>
) => any | Promise<any>;

export type GetFieldValidator<FieldValue = any> = () => FieldValidator<FieldValue> | undefined;

export interface FieldConfig<FieldValue = any> {
  afterSubmit?: () => void;
  beforeSubmit?: () => void | false;
  data?: any;
  defaultValue?: any;
  getValidator?: GetFieldValidator<FieldValue>;
  initialValue?: any;
  isEqual?: IsEqual;
  silent?: boolean;
  validateFields?: string[];
}

export type RegisterField<FormValues = Record<string, any>> = <F extends keyof FormValues>(
  name: F,
  subscriber: FieldSubscriber<FormValues[F]>,
  subscription: FieldSubscription,
  config?: FieldConfig<FormValues[F]>
) => Unsubscribe;

export interface InternalFieldState<FieldValue = any> {
  active: boolean;
  afterSubmit?: () => void;
  beforeSubmit?: () => void | false;
  blur: () => void;
  change: (value: any) => void;
  data: AnyObject;
  focus: () => void;
  isEqual: IsEqual;
  lastFieldState?: FieldState<FieldValue>;
  length?: any;
  modified: boolean;
  modifiedSinceLastSubmit: boolean;
  name: string;
  touched: boolean;
  validateFields?: string[];
  validators: {
    [index: number]: GetFieldValidator<FieldValue>;
  };
  valid: boolean;
  validating: boolean;
  visited: boolean;
}

export interface InternalFormState<FormValues = Record<string, any>> {
  active?: string;
  asyncErrors: AnyObject;
  dirtySinceLastSubmit: boolean;
  modifiedSinceLastSubmit: boolean;
  error?: any;
  errors: ValidationErrors;
  initialValues?: AnyObject;
  lastSubmittedValues?: AnyObject;
  pristine: boolean;
  resetWhileSubmitting: boolean;
  submitError?: any;
  submitErrors?: AnyObject;
  submitFailed: boolean;
  submitSucceeded: boolean;
  submitting: boolean;
  valid: boolean;
  validating: number;
  values: FormValues;
}

export type ConfigKey =
  | "debug"
  | "destroyOnUnregister"
  | "initialValues"
  | "keepDirtyOnReinitialize"
  | "mutators"
  | "onSubmit"
  | "validate"
  | "validateOnBlur";

export interface FormApi<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> {
  batch: (fn: () => void) => void;
  blur: (name: keyof FormValues) => void;
  change: <F extends keyof FormValues>(name: F, value?: FormValues[F]) => void;
  destroyOnUnregister: boolean;
  focus: (name: keyof FormValues) => void;
  initialize: (
    data: InitialFormValues | ((values: FormValues) => InitialFormValues)
  ) => void;
  isValidationPaused: () => boolean;
  getFieldState: <F extends keyof FormValues>(
    field: F
  ) => FieldState<FormValues[F]> | undefined;
  getRegisteredFields: () => string[];
  getState: () => FormState<FormValues, InitialFormValues>;
  mutators: Record<string, (...args: any[]) => any>;
  pauseValidation: () => void;
  registerField: RegisterField<FormValues>;
  reset: (initialValues?: InitialFormValues) => void;
  resetFieldState: (name: keyof FormValues) => void;
  restart: (initialValues?: InitialFormValues) => void;
  resumeValidation: () => void;
  setConfig: <K extends ConfigKey>(
    name: K,
    value: Config<FormValues, InitialFormValues>[K]
  ) => void;
  submit: () => Promise<FormValues | undefined> | undefined;
  subscribe: (
    subscriber: FormSubscriber<FormValues, InitialFormValues>,
    subscription: FormSubscription
  ) => Unsubscribe;
}

export type DebugFunction<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = (
  state: FormState<FormValues, InitialFormValues>,
  fieldStates: { [key: string]: FieldState<any> }
) => void;

export interface MutableState<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> {
  fieldSubscribers: { [key: string]: Subscribers<FieldState<any>> };
  fields: {
    [key: string]: InternalFieldState<any>;
  };
  formState: InternalFormState<FormValues>;
  lastFormState?: FormState<FormValues, InitialFormValues>;
}

export type GetIn = (state: object, complexKey: string) => any;
export type SetIn = (state: object, key: string, value: any, destroyArrays?: boolean) => object;

export type ChangeValue<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = (
  state: MutableState<FormValues, InitialFormValues>,
  name: string,
  mutate: (value: any) => any
) => void;

export type RenameField<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = (
  state: MutableState<FormValues, InitialFormValues>,
  from: string,
  to: string
) => void;

export interface Tools<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> {
  changeValue: ChangeValue<FormValues, InitialFormValues>;
  getIn: GetIn;
  renameField: RenameField<FormValues, InitialFormValues>;
  resetFieldState: (name: string) => void;
  setIn: SetIn;
  shallowEqual: IsEqual;
}

export type Mutator<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = (
  args: any[],
  state: MutableState<FormValues, InitialFormValues>,
  tools: Tools<FormValues, InitialFormValues>
) => any;

export interface Config<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> {
  debug?: DebugFunction<FormValues, InitialFormValues>;
  destroyOnUnregister?: boolean;
  initialValues?: InitialFormValues;
  keepDirtyOnReinitialize?: boolean;
  mutators?: { [key: string]: Mutator<FormValues, InitialFormValues> };
  onSubmit: (
    values: FormValues,
    form: FormApi<FormValues, InitialFormValues>,
    callback?: (errors?: SubmissionErrors) => void
  ) => SubmissionErrors | Promise<SubmissionErrors> | void;
  validate?: (
    values: FormValues
  ) => ValidationErrors | Promise<ValidationErrors>;
  validateOnBlur?: boolean;
}

export type Decorator<
  FormValues = Record<string, any>,
  InitialFormValues extends Partial<FormValues> = Partial<FormValues>
> = (form: FormApi<FormValues, InitialFormValues>) => Unsubscribe;

export type StateFilter<T> = (
  state: T,
  previousState: T | undefined,
  subscription: Subscription,
  force: boolean
) => T | undefined; 
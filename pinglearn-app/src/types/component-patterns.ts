/**
 * Advanced Component Type Patterns for PingLearn
 *
 * This module provides sophisticated TypeScript patterns specifically designed
 * for React components, including discriminated unions, polymorphic components,
 * conditional props, and type-safe form handling.
 *
 * Implements: TS-008 component-specific advanced TypeScript patterns
 */

import React from 'react';
import { ValidationErrors } from './advanced';

// =============================================================================
// DISCRIMINATED UNION PATTERNS
// =============================================================================

/**
 * Button variant discriminated union for type-safe styling
 */
export type ButtonVariant =
  | { variant: 'primary'; color: 'blue' | 'green' | 'purple'; size?: 'sm' | 'md' | 'lg' }
  | { variant: 'secondary'; color: 'gray' | 'white' | 'transparent'; size?: 'sm' | 'md' | 'lg' }
  | { variant: 'danger'; color: 'red' | 'orange'; size?: 'sm' | 'md' | 'lg' }
  | { variant: 'ghost'; color?: never; size?: 'sm' | 'md' | 'lg' }
  | { variant: 'link'; color?: never; size?: never };

/**
 * Alert variant discriminated union
 */
export type AlertVariant =
  | { type: 'success'; icon: 'check' | 'checkCircle'; dismissible?: boolean }
  | { type: 'warning'; icon: 'warning' | 'exclamation'; dismissible?: boolean }
  | { type: 'error'; icon: 'error' | 'x'; dismissible?: boolean }
  | { type: 'info'; icon: 'info' | 'lightbulb'; dismissible?: boolean }
  | { type: 'loading'; icon: 'spinner'; dismissible?: false };

/**
 * Modal variant discriminated union
 */
export type ModalVariant =
  | { type: 'dialog'; size: 'sm' | 'md' | 'lg' | 'xl'; closable: boolean }
  | { type: 'drawer'; position: 'left' | 'right' | 'top' | 'bottom'; closable: boolean }
  | { type: 'fullscreen'; size?: never; position?: never; closable: boolean }
  | { type: 'confirmation'; size: 'sm' | 'md'; closable: false };

// =============================================================================
// POLYMORPHIC COMPONENT PATTERNS
// =============================================================================

/**
 * Polymorphic props that allow changing the rendered element
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

/**
 * Polymorphic ref handling
 */
export type PolymorphicRef<T extends React.ElementType> = React.ComponentPropsWithRef<T>['ref'];

/**
 * Complete polymorphic component interface
 */
export type PolymorphicComponentProps<T extends React.ElementType, P = {}> = P &
  PolymorphicProps<T> & {
    ref?: PolymorphicRef<T>;
  };

/**
 * Text component that can render as different elements
 */
export interface TextProps<T extends React.ElementType = 'span'> {
  variant?: 'body' | 'caption' | 'label' | 'code';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  truncate?: boolean;
  children: React.ReactNode;
}

export type TextComponent = <T extends React.ElementType = 'span'>(
  props: PolymorphicComponentProps<T, TextProps<T>>
) => React.ReactElement | null;

/**
 * Box component for layout with polymorphic rendering
 */
export interface BoxProps<T extends React.ElementType = 'div'> {
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid';
  padding?: string | number;
  margin?: string | number;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string | number;
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
}

export type BoxComponent = <T extends React.ElementType = 'div'>(
  props: PolymorphicComponentProps<T, BoxProps<T>>
) => React.ReactElement | null;

// =============================================================================
// CONDITIONAL PROP PATTERNS
// =============================================================================

/**
 * Conditional props based on boolean flags
 */
export type ConditionalProps<T extends boolean> = T extends true
  ? { required: true; placeholder?: string; helpText?: string }
  : { required?: false; placeholder: string; helpText: string };

/**
 * Input component with conditional validation requirements
 */
export interface InputProps<TRequired extends boolean = false> extends ConditionalProps<TRequired> {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Form field component with conditional validation
 */
export type FormFieldComponent = {
  <TRequired extends true>(props: InputProps<TRequired>): React.ReactElement;
  <TRequired extends false>(props: InputProps<TRequired>): React.ReactElement;
};

/**
 * Loading state conditional props
 */
export type LoadingProps<T extends boolean> = T extends true
  ? {
      loading: true;
      data?: never;
      error?: never;
      loadingComponent?: React.ComponentType;
    }
  : {
      loading: false;
      data: unknown;
      error?: string | null;
      loadingComponent?: never;
    };

// =============================================================================
// TYPE-SAFE ROUTE PARAMETERS
// =============================================================================

/**
 * Extract route parameters from path string
 */
export type RouteParams<T extends string> = T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [K in Param]: string } & RouteParams<`${Start}${Rest}`>
  : T extends `${infer Start}:${infer Param}`
  ? { [K in Param]: string }
  : {};

/**
 * Route definition with type-safe parameters
 */
export interface RouteDefinition<TPath extends string> {
  path: TPath;
  params: RouteParams<TPath>;
  searchParams?: Record<string, string | string[] | undefined>;
  hash?: string;
}

/**
 * Common route patterns
 */
export type UserRoutes = RouteDefinition<'/users/:userId'>;
export type TextbookRoutes = RouteDefinition<'/textbooks/:textbookId/chapters/:chapterId'>;
export type LessonRoutes = RouteDefinition<'/lessons/:lessonId/topics/:topicId/questions/:questionId'>;

// =============================================================================
// FORM COMPONENT PATTERNS
// =============================================================================

/**
 * Generic form component with strict validation schema
 */
export interface FormProps<T extends Record<string, any>> {
  initialValues: T;
  validationSchema: ValidationSchema<T>;
  onSubmit: (values: T, helpers: FormHelpers<T>) => Promise<void> | void;
  validate?: (values: T) => ValidationErrors<T> | undefined;
  children: (formState: FormRenderProps<T>) => React.ReactNode;
}

/**
 * Validation schema for form fields
 */
export type ValidationSchema<T> = {
  [K in keyof T]: T[K] extends string
    ? StringFieldSchema
    : T[K] extends number
    ? NumberFieldSchema
    : T[K] extends boolean
    ? BooleanFieldSchema
    : T[K] extends Array<infer U>
    ? ArrayFieldSchema<U>
    : T[K] extends object
    ? ValidationSchema<T[K]>
    : FieldSchema;
};

interface FieldSchema {
  required?: boolean;
  custom?: (value: unknown) => string | null;
}

interface StringFieldSchema extends FieldSchema {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
}

interface NumberFieldSchema extends FieldSchema {
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
}

interface BooleanFieldSchema extends FieldSchema {
  mustBeTrue?: boolean;
}

interface ArrayFieldSchema<T> extends FieldSchema {
  minLength?: number;
  maxLength?: number;
  elementSchema?: T extends object ? ValidationSchema<T> : FieldSchema;
}

/**
 * Form helpers for submission handling
 */
export interface FormHelpers<T> {
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | null) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: (values?: T) => void;
  validateForm: () => Promise<ValidationErrors<T>>;
}

/**
 * Form render props interface
 */
export interface FormRenderProps<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | null) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  handleReset: (e?: React.FormEvent<HTMLFormElement>) => void;
  validateField: <K extends keyof T>(field: K) => Promise<string | null>;
  validateForm: () => Promise<ValidationErrors<T>>;
  submitForm: () => Promise<void>;
}

/**
 * Field component props with generic typing
 */
export interface FieldProps<T, K extends keyof T> {
  name: K;
  value: T[K];
  error: string | null;
  touched: boolean;
  onChange: (value: T[K]) => void;
  onBlur: () => void;
  disabled?: boolean;
  required?: boolean;
}

// =============================================================================
// DATA FETCHING COMPONENT PATTERNS
// =============================================================================

/**
 * Query component with render props pattern
 */
export interface QueryProps<TData, TError = Error, TVariables = void> {
  query: (variables: TVariables) => Promise<TData>;
  variables?: TVariables;
  enabled?: boolean;
  suspense?: boolean;
  children: (state: QueryState<TData, TError>) => React.ReactNode;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export interface QueryState<TData, TError> {
  data: TData | undefined;
  error: TError | null;
  loading: boolean;
  refetch: () => Promise<void>;
  fetchMore: (variables?: any) => Promise<void>;
}

/**
 * Mutation component pattern
 */
export interface MutationProps<TData, TError = Error, TVariables = void> {
  mutation: (variables: TVariables) => Promise<TData>;
  children: (state: MutationState<TData, TError, TVariables>) => React.ReactNode;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => void;
}

export interface MutationState<TData, TError, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: TError | null;
  loading: boolean;
  reset: () => void;
}

// =============================================================================
// COMPONENT COMPOSITION PATTERNS
// =============================================================================

/**
 * Compound component pattern for flexible composition
 */
export interface CompoundComponentProps {
  children: React.ReactNode;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

/**
 * Provider component pattern
 */
export interface ProviderProps<T> {
  value: T;
  children: React.ReactNode;
}

/**
 * Higher-order component pattern with proper typing
 */
export type HOC<TInjectedProps, TOriginalProps = {}> = <TProps extends TInjectedProps>(
  Component: React.ComponentType<TProps>
) => React.ComponentType<Omit<TProps, keyof TInjectedProps> & TOriginalProps>;

/**
 * Render prop pattern
 */
export type RenderProp<TArgs> = (args: TArgs) => React.ReactNode;

/**
 * Children as function pattern
 */
export type ChildrenAsFunction<TArgs> = {
  children: RenderProp<TArgs>;
} & TArgs;

// =============================================================================
// THEME AND STYLING PATTERNS
// =============================================================================

/**
 * Theme-aware component props
 */
export interface ThemeProps {
  theme?: 'light' | 'dark' | 'system';
  colorScheme?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray';
}

/**
 * Responsive prop pattern
 */
export type ResponsiveProp<T> = T | { sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T };

/**
 * Styled component variant props
 */
export interface StyledVariantProps {
  variant?: string;
  size?: ResponsiveProp<'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
  color?: string;
  spacing?: ResponsiveProp<string | number>;
}

// =============================================================================
// ACCESSIBILITY PATTERNS
// =============================================================================

/**
 * ARIA props pattern
 */
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  role?: React.AriaRole;
  tabIndex?: number;
}

/**
 * Keyboard navigation props
 */
export interface KeyboardProps {
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

/**
 * Focus management props
 */
export interface FocusProps {
  autoFocus?: boolean;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}

// =============================================================================
// EVENT HANDLER PATTERNS
// =============================================================================

/**
 * Mouse event handlers with proper typing
 */
export interface MouseEventProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Touch event handlers for mobile interactions
 */
export interface TouchEventProps {
  onTouchStart?: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd?: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchMove?: (event: React.TouchEvent<HTMLElement>) => void;
  onTouchCancel?: (event: React.TouchEvent<HTMLElement>) => void;
}

/**
 * Drag and drop event handlers
 */
export interface DragEventProps {
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLElement>) => void;
}

// =============================================================================
// COMPONENT STATE PATTERNS
// =============================================================================

/**
 * Controlled vs uncontrolled component pattern
 */
export type ControlledProps<T> = {
  value: T;
  onChange: (value: T) => void;
  defaultValue?: never;
};

export type UncontrolledProps<T> = {
  value?: never;
  onChange?: (value: T) => void;
  defaultValue: T;
};

export type ControllableProps<T> = ControlledProps<T> | UncontrolledProps<T>;

/**
 * Component state machine pattern
 */
export type ComponentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; error: string };

/**
 * Async component state pattern
 */
export interface AsyncComponentState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  reset: () => void;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  ButtonVariant,
  AlertVariant,
  ModalVariant,
  TextComponent,
  BoxComponent,
  FormFieldComponent,
  RouteDefinition,
  UserRoutes,
  TextbookRoutes,
  LessonRoutes,
  ValidationSchema,
  FormProps,
  FormHelpers,
  FormRenderProps,
  FieldProps,
  QueryProps,
  QueryState,
  MutationProps,
  MutationState,
  CompoundComponentProps,
  ProviderProps,
  HOC,
  RenderProp,
  ChildrenAsFunction,
  ThemeProps,
  ResponsiveProp,
  StyledVariantProps,
  AriaProps,
  KeyboardProps,
  FocusProps,
  MouseEventProps,
  TouchEventProps,
  DragEventProps,
  ControllableProps,
  ComponentState,
  AsyncComponentState
};
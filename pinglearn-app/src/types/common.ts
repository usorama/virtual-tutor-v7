/**
 * Common Shared Type Definitions
 *
 * This file contains base interfaces and common types that are reused
 * across multiple components to eliminate duplication and strengthen type safety.
 */

import { ReactNode } from 'react';

// ==================================================
// BASE COMPONENT INTERFACES
// ==================================================

/**
 * Base props that most components should have
 */
export interface BaseComponentProps {
  readonly id?: string;
  readonly className?: string;
  readonly testId?: string;
}

/**
 * Base props for components that can contain children
 */
export interface ComponentWithChildren extends BaseComponentProps {
  readonly children: ReactNode;
}

/**
 * Base props for interactive components (buttons, forms, etc.)
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

// ==================================================
// BUTTON & CONTROL TYPES
// ==================================================

/**
 * Standardized button variants across the application
 */
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'link' | 'text';

/**
 * Standardized button sizes across the application
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * HTML button types
 */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * Base button interface that all button components should extend
 */
export interface BaseButtonProps extends InteractiveComponentProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly type?: ButtonType;
  readonly children: ReactNode;
}

// ==================================================
// FORM & INPUT TYPES
// ==================================================

/**
 * Standardized input sizes
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Base form input props
 */
export interface BaseInputProps extends BaseComponentProps {
  readonly name?: string;
  readonly placeholder?: string;
  readonly size?: InputSize;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
}

/**
 * Base form props for form containers
 */
export interface BaseFormProps extends BaseComponentProps {
  readonly onSubmit?: () => void;
  readonly disabled?: boolean;
}

// ==================================================
// LOADING & STATE MANAGEMENT
// ==================================================

/**
 * Standard loading state interface
 */
export interface LoadingState {
  readonly isLoading: boolean;
  readonly error?: string | null;
}

/**
 * Processing status across different operations
 */
export type ProcessingStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'uploading';

/**
 * Extended loading state with progress information
 */
export interface ProgressState extends LoadingState {
  readonly progress?: number;
  readonly status?: ProcessingStatus;
  readonly message?: string;
}

// ==================================================
// API RESPONSE PATTERNS
// ==================================================

/**
 * Standard API response wrapper
 */
export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  readonly message: string;
  readonly code?: string;
  readonly statusCode?: number;
  readonly details?: Record<string, unknown>;
}

// ==================================================
// FILE & UPLOAD TYPES
// ==================================================

/**
 * File upload status
 */
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

/**
 * Base file information
 */
export interface BaseFileInfo {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly lastModified?: number;
}

/**
 * Upload progress information
 */
export interface UploadProgress extends LoadingState {
  readonly status: UploadStatus;
  readonly progress?: number;
  readonly message?: string;
  readonly uploadedBytes?: number;
  readonly totalBytes?: number;
}

/**
 * Base upload component props
 */
export interface BaseUploadProps extends BaseComponentProps {
  readonly accept?: string;
  readonly maxSize?: number; // in bytes
  readonly multiple?: boolean;
  readonly disabled?: boolean;
  readonly onFileSelect?: (files: File[]) => void;
  readonly onUploadComplete?: (result: unknown) => void;
  readonly onError?: (error: string) => void;
}

// ==================================================
// MODAL & DIALOG TYPES
// ==================================================

/**
 * Base modal/dialog props
 */
export interface BaseModalProps extends BaseComponentProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Confirmation dialog specific props
 */
export interface ConfirmationModalProps extends BaseModalProps {
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: 'default' | 'destructive';
  readonly onConfirm: () => void;
  readonly onCancel?: () => void;
}

// ==================================================
// NAVIGATION & WIZARD TYPES
// ==================================================

/**
 * Navigation direction
 */
export type NavigationDirection = 'next' | 'previous' | 'jump';

/**
 * Base navigation props
 */
export interface BaseNavigationProps extends BaseComponentProps {
  readonly onNavigate: (direction: NavigationDirection, step?: number) => void;
  readonly canGoNext?: boolean;
  readonly canGoPrevious?: boolean;
  readonly nextText?: string;
  readonly previousText?: string;
}

/**
 * Wizard step interface
 */
export interface WizardStep {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly isComplete?: boolean;
  readonly isOptional?: boolean;
}

/**
 * Base wizard props
 */
export interface BaseWizardProps extends BaseComponentProps {
  readonly steps: readonly WizardStep[];
  readonly currentStep: number;
  readonly onStepChange: (step: number) => void;
  readonly onComplete: () => void;
}

// ==================================================
// DASHBOARD & METRICS TYPES
// ==================================================

/**
 * Metric card data structure
 */
export interface MetricData {
  readonly value: number | string;
  readonly label: string;
  readonly unit?: string;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly trendValue?: number;
  readonly description?: string;
}

/**
 * Base metric card props
 */
export interface BaseMetricCardProps extends BaseComponentProps {
  readonly metric: MetricData;
  readonly variant?: 'default' | 'compact' | 'detailed';
  readonly icon?: ReactNode;
  readonly onClick?: () => void;
}

// ==================================================
// SEARCH & FILTER TYPES
// ==================================================

/**
 * Search and filter state
 */
export interface SearchState {
  readonly query: string;
  readonly filters: Record<string, unknown>;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Base search props
 */
export interface BaseSearchProps extends BaseComponentProps {
  readonly placeholder?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSearch?: (query: string) => void;
  readonly debounceMs?: number;
}

// ==================================================
// UTILITY TYPES
// ==================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequireProperties<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract the value type from an array type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Brand type for type-safe IDs
 *
 * @deprecated Use the new branded types from @/lib/types instead.
 * This old implementation uses __brand pattern which is visible in IntelliSense.
 * New implementation uses unique symbol pattern for better developer experience.
 *
 * Migration: import { Brand } from '@/lib/types';
 */
export type Brand<T, U> = T & { readonly __brand: U };

/**
 * Common ID types
 *
 * @deprecated These types are deprecated. Use the new branded types from @/lib/types instead.
 *
 * Migration:
 * - import { UserId, SessionId, TextbookId, ChapterId } from '@/lib/types';
 * - Use createUserId(), createSessionId(), etc. for validated creation
 * - Use unsafeCreateUserId(), etc. for trusted sources (DB reads)
 * - Use isUserId(), etc. for runtime type checking
 *
 * Benefits of new implementation:
 * - Unique symbol branding (hidden from IntelliSense)
 * - Runtime validation with factory functions
 * - Type guards for runtime checks
 * - Better developer experience
 */
export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TextbookId = Brand<string, 'TextbookId'>;
export type ChapterId = Brand<string, 'ChapterId'>;

// Re-export new branded types for backwards compatibility
export {
  UserId as BrandedUserId,
  SessionId as BrandedSessionId,
  TextbookId as BrandedTextbookId,
  ChapterId as BrandedChapterId,
  // Factories
  createUserId,
  createSessionId,
  createTextbookId,
  createChapterId,
  // Unsafe factories
  unsafeCreateUserId,
  unsafeCreateSessionId,
  unsafeCreateTextbookId,
  unsafeCreateChapterId,
  // Type guards
  isUserId,
  isSessionId,
  isTextbookId,
  isChapterId,
} from '@/lib/types';

// ==================================================
// THEME & STYLING TYPES
// ==================================================

/**
 * Color variants used throughout the app
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Spacing sizes
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Border radius sizes
 */
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
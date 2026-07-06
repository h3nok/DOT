export { useFormValidation } from "./useFormValidation";
export { useAutoSave } from "./useAutoSave";

// Enhanced validation and auto-save hooks
export { useAdvancedValidation } from "./useAdvancedValidation";
export { useAutoSave as useEnhancedAutoSave } from "./useEnhancedAutoSave";

// Re-export validation utilities
export {
  advancedValidationSchemas,
  commonCrossFieldRules,
  commonConditionalFields,
} from "./useAdvancedValidation";

export type { ValidationRule, ConditionalField } from "./useAdvancedValidation";

export type { AutoSaveOptions, AutoSaveState } from "./useEnhancedAutoSave";

import type {
	ActionType,
	DataType,
	LocalizedText,
	ValidationRule,
} from "./types";

/**
 * Validation error item with field name and error message
 */
export interface ValidationErrorItem {
	/** Field name that failed validation */
	field: string;
	/** Error message (supports multiple languages) */
	message: string;
}

/**
 * Result of action validation
 */
export interface ActionValidationResult {
	/** Whether validation passed */
	valid: boolean;
	/** List of validation errors */
	errors: ValidationErrorItem[];
}

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
	/** List of validation errors */
	public readonly errors: ValidationErrorItem[];

	constructor(message: string, errors: ValidationErrorItem[]) {
		super(message);
		this.name = "ValidationError";
		this.errors = errors;
	}
}

/**
 * Custom error class for approval failures
 */
export class ApprovalError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ApprovalError";
	}
}

/**
 * Custom error class for execution failures
 */
export class ExecutionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ExecutionError";
	}
}

/**
 * Validates action parameters against ActionType definitions
 */
export class ActionValidator {
	/**
	 * Validates parameters against action type definition
	 *
	 * @param actionType - The ActionType definition to validate against
	 * @param parameters - The parameters to validate
	 * @returns Validation result with any errors
	 */
	validate(
		actionType: ActionType,
		parameters: Record<string, unknown>,
	): ActionValidationResult {
		const errors: ValidationErrorItem[] = [];

		for (const paramDef of actionType.parameters) {
			const paramValue = parameters[paramDef.name];

			// Check required fields
			if (paramDef.required && paramValue === undefined) {
				errors.push({
					field: paramDef.name,
					message: `Required parameter '${paramDef.name}' is missing`,
				});
				continue;
			}

			// Skip validation if not required and undefined
			if (!paramDef.required && paramValue === undefined) {
				continue;
			}

			// Type validation
			const typeError = this.validateType(
				paramDef.name,
				paramValue,
				paramDef.type,
			);
			if (typeError) {
				errors.push(typeError);
				continue;
			}

			// Validation rules
			if (paramDef.validation) {
				const ruleErrors = this.validateRules(
					paramDef.name,
					paramValue,
					paramDef.validation,
				);
				errors.push(...ruleErrors);
			}
		}

		return { valid: errors.length === 0, errors };
	}

	/**
	 * Validates a single parameter value against its DataType
	 *
	 * @param fieldName - Name of the field being validated
	 * @param value - Value to validate
	 * @param dataType - Expected DataType
	 * @returns ValidationErrorItem if validation fails, undefined otherwise
	 */
	private validateType(
		fieldName: string,
		value: unknown,
		dataType: DataType,
	): ValidationErrorItem | undefined {
		switch (dataType) {
			case "string":
				if (typeof value !== "string") {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a string, got ${typeof value}`,
					};
				}
				break;

			case "integer":
				if (typeof value !== "number" || !Number.isInteger(value)) {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be an integer, got ${typeof value}`,
					};
				}
				break;

			case "float":
				if (typeof value !== "number") {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a number, got ${typeof value}`,
					};
				}
				break;

			case "boolean":
				if (typeof value !== "boolean") {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a boolean, got ${typeof value}`,
					};
				}
				break;

			case "datetime":
				if (typeof value !== "string") {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a datetime string, got ${typeof value}`,
					};
				}
				if (!this.isValidDatetime(value)) {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a valid ISO 8601 datetime string`,
					};
				}
				break;

			case "date":
				if (typeof value !== "string") {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a date string, got ${typeof value}`,
					};
				}
				if (!this.isValidDate(value)) {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a valid ISO 8601 date string (YYYY-MM-DD)`,
					};
				}
				break;

			case "array":
				if (!Array.isArray(value)) {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be an array, got ${typeof value}`,
					};
				}
				break;

			case "object":
				if (
					typeof value !== "object" ||
					value === null ||
					Array.isArray(value)
				) {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be an object, got ${typeof value}`,
					};
				}
				break;

			case "ref":
				if (typeof value !== "string") {
					return {
						field: fieldName,
						message: `Field '${fieldName}' must be a reference string (@id), got ${typeof value}`,
					};
				}
				break;

			default:
				return {
					field: fieldName,
					message: `Field '${fieldName}' has unknown data type: ${dataType}`,
				};
		}

		return undefined;
	}

	/**
	 * Validates a value against validation rules
	 *
	 * @param fieldName - Name of the field being validated
	 * @param value - Value to validate
	 * @param rules - Validation rules to apply
	 * @returns Array of ValidationErrorItem
	 */
	private validateRules(
		fieldName: string,
		value: unknown,
		rules: ValidationRule[],
	): ValidationErrorItem[] {
		const errors: ValidationErrorItem[] = [];

		for (const rule of rules) {
			switch (rule.type) {
				case "min":
					if (
						typeof value === "number" &&
						rule.value !== undefined &&
						value < (rule.value as number)
					) {
						errors.push({
							field: fieldName,
							message: this.getLocalizedMessage(
								rule.message,
								`Field '${fieldName}' must be >= ${rule.value}`,
							),
						});
					}
					if (
						typeof value === "string" &&
						rule.value !== undefined &&
						value.length < (rule.value as number)
					) {
						errors.push({
							field: fieldName,
							message: this.getLocalizedMessage(
								rule.message,
								`Field '${fieldName}' length must be >= ${rule.value}`,
							),
						});
					}
					break;

				case "max":
					if (
						typeof value === "number" &&
						rule.value !== undefined &&
						value > (rule.value as number)
					) {
						errors.push({
							field: fieldName,
							message: this.getLocalizedMessage(
								rule.message,
								`Field '${fieldName}' must be <= ${rule.value}`,
							),
						});
					}
					if (
						typeof value === "string" &&
						rule.value !== undefined &&
						value.length > (rule.value as number)
					) {
						errors.push({
							field: fieldName,
							message: this.getLocalizedMessage(
								rule.message,
								`Field '${fieldName}' length must be <= ${rule.value}`,
							),
						});
					}
					break;

				case "pattern":
					if (typeof value === "string" && rule.value !== undefined) {
						const regex = new RegExp(rule.value as string);
						if (!regex.test(value)) {
							errors.push({
								field: fieldName,
								message: this.getLocalizedMessage(
									rule.message,
									`Field '${fieldName}' does not match pattern`,
								),
							});
						}
					}
					break;

				case "custom":
					// TODO: Implement custom validation rule evaluation
					// Custom validation requires an evaluation context and safe execution environment
					// For now, skip custom validation
					break;
			}
		}

		return errors;
	}

	/**
	 * Gets localized message from LocalizedText or returns default
	 *
	 * @param localizedText - Localized text object
	 * @param defaultMsg - Default message if localized text not found
	 * @returns Message string
	 */
	private getLocalizedMessage(
		localizedText: LocalizedText | undefined,
		defaultMsg: string,
	): string {
		if (!localizedText) {
			return defaultMsg;
		}
		// Prefer English, fallback to first available language
		return (
			localizedText.en ??
			localizedText.zh ??
			Object.values(localizedText)[0] ??
			defaultMsg
		);
	}

	/**
	 * Checks if a string is a valid ISO 8601 datetime
	 *
	 * @param value - String to check
	 * @returns True if valid datetime
	 */
	private isValidDatetime(value: string): boolean {
		// ISO 8601 datetime format: YYYY-MM-DDTHH:mm:ss.sssZ or with timezone offset
		const isoRegex =
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
		if (!isoRegex.test(value)) {
			return false;
		}
		const date = new Date(value);
		return !Number.isNaN(date.getTime());
	}

	/**
	 * Checks if a string is a valid ISO 8601 date
	 *
	 * @param value - String to check
	 * @returns True if valid date
	 */
	private isValidDate(value: string): boolean {
		// ISO 8601 date format: YYYY-MM-DD
		const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!isoRegex.test(value)) {
			return false;
		}
		const date = new Date(value);
		return !Number.isNaN(date.getTime());
	}
}

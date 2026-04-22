import type { AuditConfig } from "./types";

/**
 * Audit log entry for action execution
 */
export interface AuditLogEntry {
	/** Unique identifier for this log entry */
	id: string;
	/** ID of the action executed */
	actionId: string;
	/** ID of the action type */
	actionTypeId: string;
	/** Timestamp of execution (ISO 8601) */
	timestamp: string;
	/** User ID who executed the action */
	userId: string;
	/** Parameters passed to action (sanitized, no sensitive data) */
	parameters: Record<string, unknown>;
	/** Execution result: "success" | "failure" | "approval_pending" */
	result: "success" | "failure" | "approval_pending";
	/** Error message if execution failed */
	error?: string;
	/** Duration of execution in milliseconds */
	duration: number;
}

/**
 * Filter for querying audit logs
 */
export interface AuditLogFilter {
	/** Filter by action type ID */
	actionTypeId?: string;
	/** Filter by user ID */
	userId?: string;
	/** Filter by date range start (ISO 8601) */
	startDate?: string;
	/** Filter by date range end (ISO 8601) */
	endDate?: string;
	/** Filter by result status */
	result?: "success" | "failure" | "approval_pending";
}

/**
 * Query result for audit logs
 */
export interface AuditLogQueryResult {
	/** Filtered audit log entries */
	entries: AuditLogEntry[];
	/** Total number of entries matching filter */
	total: number;
	/** Page number (1-indexed) */
	page: number;
	/** Number of entries per page */
	pageSize: number;
}

/**
 * Records and queries audit logs for action executions
 *
 * NOTE: Currently uses in-memory storage. TODO: Migrate to database.
 */
export class ActionAuditor {
	/** In-memory storage for audit logs */
	private logs: Map<string, AuditLogEntry> = new Map();
	/** Counter for generating unique IDs */
	private counter = 0;

	/**
	 * Records an audit log entry
	 *
	 * @param config - Audit configuration to check if logging is enabled
	 * @param entry - Log entry to record
	 * @returns ID of the recorded log entry
	 */
	recordLog(config: AuditConfig, entry: Omit<AuditLogEntry, "id">): string {
		// Check if audit logging is enabled
		if (!config.enabled) {
			return "";
		}

		const id = `audit_${Date.now()}_${++this.counter}`;
		const logEntry: AuditLogEntry = {
			id,
			...entry,
		};

		this.logs.set(id, logEntry);

		// TODO: Implement retention policy - cleanup old logs based on retentionDays
		if (config.retentionDays) {
			// TODO: Delete logs older than retentionDays
		}

		return id;
	}

	/**
	 * Queries audit logs with optional filtering and pagination
	 *
	 * @param filter - Optional filter criteria
	 * @param page - Page number (1-indexed, default 1)
	 * @param pageSize - Number of entries per page (default 50)
	 * @returns Query result with filtered entries
	 */
	queryLogs(
		filter?: AuditLogFilter,
		page = 1,
		pageSize = 50,
	): AuditLogQueryResult {
		let entries = Array.from(this.logs.values());

		// Apply filters
		if (filter) {
			if (filter.actionTypeId) {
				entries = entries.filter((e) => e.actionTypeId === filter.actionTypeId);
			}
			if (filter.userId) {
				entries = entries.filter((e) => e.userId === filter.userId);
			}
			if (filter.result) {
				entries = entries.filter((e) => e.result === filter.result);
			}
			if (filter.startDate) {
				const start = new Date(filter.startDate).getTime();
				entries = entries.filter(
					(e) => new Date(e.timestamp).getTime() >= start,
				);
			}
			if (filter.endDate) {
				const end = new Date(filter.endDate).getTime();
				entries = entries.filter((e) => new Date(e.timestamp).getTime() <= end);
			}
		}

		// Sort by timestamp descending (newest first)
		entries.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);

		const total = entries.length;
		const startIndex = (page - 1) * pageSize;
		const paginatedEntries = entries.slice(startIndex, startIndex + pageSize);

		return {
			entries: paginatedEntries,
			total,
			page,
			pageSize,
		};
	}

	/**
	 * Gets a specific audit log entry by ID
	 *
	 * @param id - Log entry ID
	 * @returns Log entry or undefined if not found
	 */
	getLogById(id: string): AuditLogEntry | undefined {
		return this.logs.get(id);
	}

	/**
	 * Gets statistics for audit logs
	 *
	 * @param filter - Optional filter criteria
	 * @returns Statistics object
	 */
	getStatistics(filter?: AuditLogFilter): {
		total: number;
		success: number;
		failure: number;
		approvalPending: number;
		successRate: number;
	} {
		const { entries } = this.queryLogs(filter, 1, Number.MAX_SAFE_INTEGER);

		const total = entries.length;
		const success = entries.filter((e) => e.result === "success").length;
		const failure = entries.filter((e) => e.result === "failure").length;
		const approvalPending = entries.filter(
			(e) => e.result === "approval_pending",
		).length;

		return {
			total,
			success,
			failure,
			approvalPending,
			successRate: total > 0 ? (success / total) * 100 : 0,
		};
	}

	/**
	 * Clears all audit logs (for testing purposes)
	 *
	 * NOTE: This should not be used in production without proper authorization
	 */
	clearAll(): void {
		this.logs.clear();
		this.counter = 0;
	}
}

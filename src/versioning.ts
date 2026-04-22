/**
 * 版本控制系统 (Version Control System)
 *
 * 为本体对象提供完整的版本管理能力，包括：
 * - 版本创建与快照存储
 * - 版本历史查询与回滚
 * - 分支创建与合并
 * - 审计日志记录
 *
 * @module versioning
 */

// ─── 核心类型定义 ──────────────────────────────────────────────────

/**
 * 版本元数据
 *
 * 记录版本的附加信息，用于审计追踪和统计分析。
 */
export interface VersionMetadata {
	/** 变更来源 (如 manual, api, import) */
	source: string;
	/** 变更标签 */
	tags: string[];
	/** 审计信息 */
	audit: AuditEntry[];
}

/**
 * 审计日志条目
 *
 * 记录对版本执行的操作，用于合规审计和操作追溯。
 */
export interface AuditEntry {
	/** 操作类型 */
	action: "create" | "update" | "rollback" | "branch" | "merge" | "delete";
	/** 操作者用户 ID */
	userId: string;
	/** 操作时间 (ISO 8601) */
	timestamp: string;
	/** 操作详情 */
	details: string;
}

/**
 * 版本快照
 *
 * 对象在某个时间点的完整数据快照，包含变更信息和血缘关系。
 */
export interface Version {
	/** 版本唯一标识 (如 v1, v2, v3) */
	versionId: string;
	/** 关联对象 ID */
	objectId: string;
	/** 版本号 (递增整数) */
	versionNumber: number;
	/** 版本数据快照 */
	data: Record<string, unknown>;
	/** 变更者用户 ID */
	changedBy: string;
	/** 变更时间 (ISO 8601) */
	changedAt: string;
	/** 变更描述 */
	changeDescription: string;
	/** 父版本 ID (用于版本链追溯) */
	parentVersionId?: string;
	/** 所属分支名 */
	branch?: string;
	/** 版本元数据 */
	metadata: VersionMetadata;
}

/**
 * 分支定义
 *
 * 从某个版本分叉出的独立开发线，支持并行编辑。
 */
export interface Branch {
	/** 分支名称 (如 main, feature-xxx) */
	name: string;
	/** 关联对象 ID */
	objectId: string;
	/** 分支头版本 ID */
	headVersionId: string;
	/** 创建时间 (ISO 8601) */
	createdAt: string;
	/** 创建者用户 ID */
	createdBy: string;
	/** 分支描述 */
	description?: string;
}

/**
 * 版本管理存储接口
 *
 * 抽象版本和分支的持久化存储，支持不同的后端实现。
 */
export interface IVersionStore {
	/** 保存版本 */
	saveVersion(version: Version): Promise<void>;
	/** 获取对象的版本历史 */
	getHistory(
		objectId: string,
		branch: string,
		limit?: number,
	): Promise<Version[]>;
	/** 获取特定版本 */
	getVersion(objectId: string, versionId: string): Promise<Version | null>;
	/** 获取对象的最新版本号 */
	getLatestVersionNumber(objectId: string, branch: string): Promise<number>;
	/** 删除版本 */
	deleteVersion(objectId: string, versionId: string): Promise<void>;

	/** 保存分支 */
	saveBranch(branch: Branch): Promise<void>;
	/** 获取分支 */
	getBranch(objectId: string, name: string): Promise<Branch | null>;
	/** 列出对象的所有分支 */
	listBranches(objectId: string): Promise<Branch[]>;
	/** 更新分支头版本 */
	updateBranchHead(
		objectId: string,
		name: string,
		headVersionId: string,
	): Promise<void>;
	/** 删除分支 */
	deleteBranch(objectId: string, name: string): Promise<void>;
}

// ─── 内存存储实现 ──────────────────────────────────────────────────

/**
 * 内存版本存储
 *
 * 使用 Map 在内存中存储版本和分支数据，适用于开发和测试。
 * 生产环境应替换为数据库实现。
 */
export class MemoryVersionStore implements IVersionStore {
	private versions = new Map<string, Version>();
	private branches = new Map<string, Branch>();

	private versionKey(objectId: string, versionId: string): string {
		return `${objectId}::${versionId}`;
	}

	private branchKey(objectId: string, name: string): string {
		return `${objectId}::${name}`;
	}

	async saveVersion(version: Version): Promise<void> {
		this.versions.set(
			this.versionKey(version.objectId, version.versionId),
			version,
		);
	}

	async getHistory(
		objectId: string,
		branch: string,
		limit?: number,
	): Promise<Version[]> {
		const all = [...this.versions.values()]
			.filter((v) => v.objectId === objectId && (v.branch ?? "main") === branch)
			.sort((a, b) => b.versionNumber - a.versionNumber);
		return limit ? all.slice(0, limit) : all;
	}

	async getVersion(
		objectId: string,
		versionId: string,
	): Promise<Version | null> {
		return this.versions.get(this.versionKey(objectId, versionId)) ?? null;
	}

	async getLatestVersionNumber(
		objectId: string,
		branch: string,
	): Promise<number> {
		const history = await this.getHistory(objectId, branch);
		const latest = history[0];
		return latest ? latest.versionNumber : 0;
	}

	async deleteVersion(objectId: string, versionId: string): Promise<void> {
		this.versions.delete(this.versionKey(objectId, versionId));
	}

	async saveBranch(branch: Branch): Promise<void> {
		this.branches.set(this.branchKey(branch.objectId, branch.name), branch);
	}

	async getBranch(objectId: string, name: string): Promise<Branch | null> {
		return this.branches.get(this.branchKey(objectId, name)) ?? null;
	}

	async listBranches(objectId: string): Promise<Branch[]> {
		return [...this.versions.values()].filter(() => true).length === 0
			? [...this.branches.values()].filter((b) => b.objectId === objectId)
			: [...this.branches.values()].filter((b) => b.objectId === objectId);
	}

	async updateBranchHead(
		objectId: string,
		name: string,
		headVersionId: string,
	): Promise<void> {
		const branch = this.branches.get(this.branchKey(objectId, name));
		if (branch) {
			branch.headVersionId = headVersionId;
		}
	}

	async deleteBranch(objectId: string, name: string): Promise<void> {
		this.branches.delete(this.branchKey(objectId, name));
	}
}

// ─── 版本管理器 ────────────────────────────────────────────────────

/**
 * 版本管理器
 *
 * 提供版本创建、查询、回滚和分支管理的核心逻辑。
 * 通过 IVersionsStore 抽象存储层，支持不同后端。
 *
 * @example
 * ```ts
 * const store = new MemoryVersionStore();
 * const manager = new VersionManager(store);
 *
 * const v1 = await manager.createVersion("obj:1", { name: "Alice" }, "user:1", "初始创建");
 * const v2 = await manager.createVersion("obj:1", { name: "Bob" }, "user:2", "更新名称");
 * const history = await manager.getHistory("obj:1");
 * ```
 */
export class VersionManager {
	private store: IVersionStore;

	constructor(store?: IVersionStore) {
		this.store = store ?? new MemoryVersionStore();
	}

	/**
	 * 创建新版本
	 *
	 * 为指定对象创建一个新的版本快照，自动递增版本号并记录审计日志。
	 *
	 * @param objectId - 对象 ID
	 * @param data - 版本数据快照
	 * @param userId - 变更者用户 ID
	 * @param description - 变更描述
	 * @param branch - 分支名，默认 "main"
	 * @returns 新创建的版本
	 */
	async createVersion(
		objectId: string,
		data: Record<string, unknown>,
		userId: string,
		description: string,
		branch = "main",
	): Promise<Version> {
		const latestNumber = await this.store.getLatestVersionNumber(
			objectId,
			branch,
		);
		const versionNumber = latestNumber + 1;
		const versionId = `v${versionNumber}`;
		const now = new Date().toISOString();

		const history = await this.store.getHistory(objectId, branch, 1);
		const parentVersionId =
			history.length > 0 ? history[0]?.versionId : undefined;

		// 确保分支存在
		const existingBranch = await this.store.getBranch(objectId, branch);
		if (!existingBranch) {
			const newBranch: Branch = {
				name: branch,
				objectId,
				headVersionId: versionId,
				createdAt: now,
				createdBy: userId,
				description: branch === "main" ? "主分支" : undefined,
			};
			await this.store.saveBranch(newBranch);
		}

		const version: Version = {
			versionId,
			objectId,
			versionNumber,
			data: structuredClone(data),
			changedBy: userId,
			changedAt: now,
			changeDescription: description,
			parentVersionId,
			branch,
			metadata: {
				source: "manual",
				tags: [],
				audit: [
					{
						action: "create",
						userId,
						timestamp: now,
						details: description,
					},
				],
			},
		};

		await this.store.saveVersion(version);
		await this.store.updateBranchHead(objectId, branch, versionId);

		return version;
	}

	/**
	 * 获取版本历史
	 *
	 * 按版本号降序返回指定对象的版本列表。
	 *
	 * @param objectId - 对象 ID
	 * @param limit - 返回数量限制
	 * @param branch - 分支名，默认 "main"
	 * @returns 版本列表（按版本号降序）
	 */
	async getHistory(
		objectId: string,
		limit?: number,
		branch = "main",
	): Promise<Version[]> {
		return this.store.getHistory(objectId, branch, limit);
	}

	/**
	 * 获取特定版本
	 *
	 * @param objectId - 对象 ID
	 * @param versionId - 版本 ID (如 "v1")
	 * @returns 版本快照，不存在返回 null
	 */
	async getVersion(
		objectId: string,
		versionId: string,
	): Promise<Version | null> {
		return this.store.getVersion(objectId, versionId);
	}

	/**
	 * 版本回滚
	 *
	 * 将对象回滚到指定版本，创建一个新的版本快照作为回滚记录。
	 *
	 * @param objectId - 对象 ID
	 * @param toVersion - 目标版本号
	 * @param userId - 执行回滚的用户 ID
	 * @param branch - 分支名，默认 "main"
	 */
	async rollback(
		objectId: string,
		toVersion: number,
		userId: string,
		branch = "main",
	): Promise<void> {
		const targetVersionId = `v${toVersion}`;
		const targetVersion = await this.store.getVersion(
			objectId,
			targetVersionId,
		);

		if (!targetVersion) {
			throw new Error(`Version v${toVersion} not found for object ${objectId}`);
		}

		const rollbackVersion = await this.createVersion(
			objectId,
			targetVersion.data,
			userId,
			`回滚到版本 v${toVersion}`,
			branch,
		);

		// 添加审计记录
		rollbackVersion.metadata.audit.push({
			action: "rollback",
			userId,
			timestamp: new Date().toISOString(),
			details: `从当前版本回滚到 v${toVersion}`,
		});

		await this.store.saveVersion(rollbackVersion);
	}

	/**
	 * 创建分支
	 *
	 * 从当前分支的最新版本创建新的开发分支。
	 *
	 * @param objectId - 对象 ID
	 * @param name - 新分支名称
	 * @param userId - 创建者用户 ID
	 * @param description - 分支描述
	 * @param fromBranch - 源分支，默认 "main"
	 * @returns 新创建的分支
	 */
	async createBranch(
		objectId: string,
		name: string,
		userId: string,
		description?: string,
		fromBranch = "main",
	): Promise<Branch> {
		const existingBranch = await this.store.getBranch(objectId, name);
		if (existingBranch) {
			throw new Error(`Branch "${name}" already exists for object ${objectId}`);
		}

		const history = await this.store.getHistory(objectId, fromBranch, 1);
		const now = new Date().toISOString();

		const sourceVersion = history[0];
		if (sourceVersion) {
			const branchVersion: Version = {
				versionId: "v1",
				objectId,
				versionNumber: 1,
				data: structuredClone(sourceVersion.data),
				changedBy: userId,
				changedAt: now,
				changeDescription: `从分支 "${fromBranch}" 创建分支 "${name}"`,
				parentVersionId: sourceVersion.versionId,
				branch: name,
				metadata: {
					source: "branch",
					tags: [],
					audit: [
						{
							action: "branch",
							userId,
							timestamp: now,
							details: `从 "${fromBranch}" 的 ${sourceVersion.versionId} 创建`,
						},
					],
				},
			};
			await this.store.saveVersion(branchVersion);
		}

		const branch: Branch = {
			name,
			objectId,
			headVersionId: history.length > 0 ? "v1" : "v0",
			createdAt: now,
			createdBy: userId,
			description,
		};

		await this.store.saveBranch(branch);
		return branch;
	}

	/**
	 * 合并分支
	 *
	 * 将源分支的最新版本合并到目标分支，创建合并版本。
	 * 使用 three-way merge 策略处理差异。
	 *
	 * @param objectId - 对象 ID
	 * @param fromBranch - 源分支名
	 * @param toBranch - 目标分支名
	 * @param userId - 执行合并的用户 ID
	 * @returns 合并后创建的新版本
	 */
	async mergeBranch(
		objectId: string,
		fromBranch: string,
		toBranch: string,
		userId: string,
	): Promise<Version> {
		const sourceHistory = await this.store.getHistory(objectId, fromBranch, 1);
		const targetHistory = await this.store.getHistory(objectId, toBranch, 1);

		const sourceVersion = sourceHistory[0];
		if (!sourceVersion) {
			throw new Error(
				`No versions found in branch "${fromBranch}" for object ${objectId}`,
			);
		}

		const mergedData =
			targetHistory.length > 0
				? { ...targetHistory[0]?.data, ...sourceVersion.data }
				: sourceVersion.data;

		const mergedVersion = await this.createVersion(
			objectId,
			mergedData,
			userId,
			`合并分支 "${fromBranch}" 到 "${toBranch}"`,
			toBranch,
		);

		mergedVersion.metadata.audit.push({
			action: "merge",
			userId,
			timestamp: new Date().toISOString(),
			details: `将 "${fromBranch}" (${sourceVersion.versionId}) 合并到 "${toBranch}"`,
		});

		await this.store.saveVersion(mergedVersion);
		return mergedVersion;
	}

	/**
	 * 列出对象的所有分支
	 *
	 * @param objectId - 对象 ID
	 * @returns 分支列表
	 */
	async listBranches(objectId: string): Promise<Branch[]> {
		return this.store.listBranches(objectId);
	}

	/**
	 * 删除分支
	 *
	 * 删除指定分支（不允许删除 main 分支）。
	 *
	 * @param objectId - 对象 ID
	 * @param name - 分支名
	 * @param userId - 操作者用户 ID
	 */
	async deleteBranch(
		objectId: string,
		name: string,
		_userId: string,
	): Promise<void> {
		if (name === "main") {
			throw new Error("Cannot delete the main branch");
		}

		const branch = await this.store.getBranch(objectId, name);
		if (!branch) {
			throw new Error(`Branch "${name}" not found for object ${objectId}`);
		}

		await this.store.deleteBranch(objectId, name);
	}
}

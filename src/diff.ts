/**
 * 版本差异计算引擎 (Version Diff Engine)
 *
 * 提供版本间差异计算、可视化输出和冲突检测能力。
 * 基于深层对象比较算法，递归检测 JSON 数据的增/删/改变化。
 *
 * @module diff
 */

import type { Version } from "./versioning";

/**
 * 变更类型 -- 区分数据的增/删/改操作
 */
export type ChangeType = "added" | "modified" | "deleted";

/**
 * 单个变更条目
 *
 * 描述 JSON 数据在某个路径上的具体变化。
 */
export interface Change {
	/** 变更类型 */
	type: ChangeType;
	/** JSON 路径 (如 "properties.name") */
	path: string;
	/** 变更前的值 (deleted/modified 时存在) */
	oldValue?: unknown;
	/** 变更后的值 (added/modified 时存在) */
	newValue?: unknown;
}

/**
 * 差异统计
 *
 * 汇总变更中的增/删/改数量。
 */
export interface DiffStats {
	/** 新增数量 */
	additions: number;
	/** 修改数量 */
	modifications: number;
	/** 删除数量 */
	deletions: number;
}

/**
 * 版本差异结果
 *
 * 两个版本之间的完整差异描述，包含变更列表和统计数据。
 */
export interface VersionDiff {
	/** 关联对象 ID */
	objectId: string;
	/** 源版本号 */
	fromVersion: number;
	/** 目标版本号 */
	toVersion: number;
	/** 变更列表 */
	changes: Change[];
	/** 差异统计 */
	statistics: DiffStats;
}

/**
 * 合并冲突
 *
 * 当两个分支修改了同一路径时产生的冲突记录。
 */
export interface Conflict {
	/** 冲突路径 */
	path: string;
	/** 分支 1 的值 */
	valueA: unknown;
	/** 分支 2 的值 */
	valueB: unknown;
	/** 冲突描述 */
	description: string;
}

/**
 * 差异计算引擎
 *
 * 递归比较两个版本的数据快照，生成变更列表和统计数据。
 * 支持深层嵌套对象、数组和原始类型的差异检测。
 *
 * @example
 * ```ts
 * const engine = new DiffEngine();
 * const diff = await engine.computeDiff(version1, version2);
 * console.log(diff.statistics); // { additions: 2, modifications: 1, deletions: 0 }
 * ```
 */
export class DiffEngine {
	/**
	 * 计算两个版本的差异
	 *
	 * 递归比较两个版本的数据字段，生成完整的变更列表。
	 *
	 * @param version1 - 源版本
	 * @param version2 - 目标版本
	 * @returns 版本差异结果
	 */
	async computeDiff(
		version1: Version,
		version2: Version,
	): Promise<VersionDiff> {
		const changes: Change[] = [];
		this.deepCompare(version1.data, version2.data, "", changes);

		const statistics: DiffStats = {
			additions: changes.filter((c) => c.type === "added").length,
			modifications: changes.filter((c) => c.type === "modified").length,
			deletions: changes.filter((c) => c.type === "deleted").length,
		};

		return {
			objectId: version1.objectId,
			fromVersion: version1.versionNumber,
			toVersion: version2.versionNumber,
			changes,
			statistics,
		};
	}

	/**
	 * 生成高亮 JSON 字符串
	 *
	 * 将差异结果转换为带颜色标记的 JSON 字符串，用于终端或日志输出。
	 *
	 * @param diff - 版本差异
	 * @returns 带标记的 JSON 字符串
	 */
	async toHighlightJSON(diff: VersionDiff): Promise<string> {
		const lines: string[] = [];
		lines.push(
			`diff --object ${diff.objectId} v${diff.fromVersion} -> v${diff.toVersion}`,
		);
		lines.push(
			`stats: +${diff.statistics.additions} ~${diff.statistics.modifications} -${diff.statistics.deletions}`,
		);
		lines.push("---");

		for (const change of diff.changes) {
			const prefix =
				change.type === "added" ? "+" : change.type === "deleted" ? "-" : "~";
			const path = change.path || "(root)";
			switch (change.type) {
				case "added":
					lines.push(`${prefix} ${path}: ${JSON.stringify(change.newValue)}`);
					break;
				case "deleted":
					lines.push(`${prefix} ${path}: ${JSON.stringify(change.oldValue)}`);
					break;
				case "modified":
					lines.push(
						`${prefix} ${path}: ${JSON.stringify(change.oldValue)} -> ${JSON.stringify(change.newValue)}`,
					);
					break;
			}
		}

		return lines.join("\n");
	}

	/**
	 * 冲突检测
	 *
	 * 比较两组差异，检测是否存在对同一路径的冲突修改。
	 *
	 * @param diff1 - 分支 1 的差异
	 * @param diff2 - 分支 2 的差异
	 * @returns 冲突列表，空数组表示无冲突
	 */
	detectConflict(diff1: VersionDiff, diff2: VersionDiff): Conflict[] {
		const conflicts: Conflict[] = [];
		const map1 = new Map(diff1.changes.map((c) => [c.path, c]));
		const map2 = new Map(diff2.changes.map((c) => [c.path, c]));

		for (const [path, change1] of map1) {
			const change2 = map2.get(path);
			if (!change2) continue;

			// 两侧都修改了同一路径
			if (change1.type === "modified" && change2.type === "modified") {
				if (
					JSON.stringify(change1.newValue) !== JSON.stringify(change2.newValue)
				) {
					conflicts.push({
						path,
						valueA: change1.newValue,
						valueB: change2.newValue,
						description: `路径 "${path}" 在两个分支上被修改为不同的值`,
					});
				}
			}

			// 一侧删除、一侧修改
			if (
				(change1.type === "deleted" && change2.type === "modified") ||
				(change1.type === "modified" && change2.type === "deleted")
			) {
				conflicts.push({
					path,
					valueA: change1.newValue ?? change1.oldValue,
					valueB: change2.newValue ?? change2.oldValue,
					description: `路径 "${path}" 在一个分支被删除，另一个分支被修改`,
				});
			}
		}

		return conflicts;
	}

	/**
	 * 深层对象比较
	 *
	 * 递归比较两个值，收集所有差异到 changes 数组。
	 */
	private deepCompare(
		oldVal: unknown,
		newVal: unknown,
		path: string,
		changes: Change[],
	): void {
		if (oldVal === newVal) return;

		const oldIsObj = this.isObject(oldVal);
		const newIsObj = this.isObject(newVal);

		// 两边都不是对象，直接比较
		if (!oldIsObj && !newIsObj) {
			if (oldVal !== newVal) {
				changes.push({
					type: "modified",
					path,
					oldValue: oldVal,
					newValue: newVal,
				});
			}
			return;
		}

		// 旧值不是对象或为 undefined -> 新增
		if (!oldIsObj) {
			changes.push({ type: "added", path, newValue: newVal });
			return;
		}

		// 新值不是对象或为 undefined -> 删除
		if (!newIsObj) {
			changes.push({ type: "deleted", path, oldValue: oldVal });
			return;
		}

		// 两边都是数组
		if (Array.isArray(oldVal) && Array.isArray(newVal)) {
			this.compareArrays(oldVal, newVal, path, changes);
			return;
		}

		// 一边是数组一边不是
		if (Array.isArray(oldVal) !== Array.isArray(newVal)) {
			changes.push({
				type: "modified",
				path,
				oldValue: oldVal,
				newValue: newVal,
			});
			return;
		}

		// 两边都是对象，递归比较
		this.compareObjects(
			oldVal as Record<string, unknown>,
			newVal as Record<string, unknown>,
			path,
			changes,
		);
	}

	private compareObjects(
		oldObj: Record<string, unknown>,
		newObj: Record<string, unknown>,
		basePath: string,
		changes: Change[],
	): void {
		const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

		for (const key of allKeys) {
			const childPath = basePath ? `${basePath}.${key}` : key;
			const oldHas = Object.hasOwn(oldObj, key);
			const newHas = Object.hasOwn(newObj, key);

			if (!oldHas && newHas) {
				changes.push({ type: "added", path: childPath, newValue: newObj[key] });
			} else if (oldHas && !newHas) {
				changes.push({
					type: "deleted",
					path: childPath,
					oldValue: oldObj[key],
				});
			} else {
				this.deepCompare(oldObj[key], newObj[key], childPath, changes);
			}
		}
	}

	private compareArrays(
		oldArr: unknown[],
		newArr: unknown[],
		basePath: string,
		changes: Change[],
	): void {
		const maxLen = Math.max(oldArr.length, newArr.length);

		for (let i = 0; i < maxLen; i++) {
			const childPath = `${basePath}[${i}]`;
			if (i >= oldArr.length) {
				changes.push({ type: "added", path: childPath, newValue: newArr[i] });
			} else if (i >= newArr.length) {
				changes.push({ type: "deleted", path: childPath, oldValue: oldArr[i] });
			} else {
				this.deepCompare(oldArr[i], newArr[i], childPath, changes);
			}
		}
	}

	private isObject(val: unknown): val is Record<string, unknown> {
		return val !== null && typeof val === "object";
	}
}

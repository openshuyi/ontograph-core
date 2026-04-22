import type { DerivedAttribute } from "../types";
import { SafeExpressionEvaluator } from "./evaluator";

/**
 * 派生属性求值器
 *
 * 对 EntityType 实例计算其 DerivedAttribute 的值。
 * 支持内存 LRU 缓存。
 */
export class DerivedAttributeEvaluator {
	private evaluator: SafeExpressionEvaluator;
	private cache: Map<string, { value: unknown; expiresAt: number }>;

	constructor(private maxCacheSize = 1000) {
		this.evaluator = new SafeExpressionEvaluator();
		this.cache = new Map();
	}

	/**
	 * 计算单个派生属性值
	 *
	 * @param attr - 派生属性定义
	 * @param context - 实例属性值上下文
	 * @returns 计算结果
	 */
	evaluate(attr: DerivedAttribute, context: Record<string, unknown>): unknown {
		// 检查缓存
		if (attr.cache?.enabled) {
			const cacheKey = this.getCacheKey(attr["@id"], context);
			const cached = this.cache.get(cacheKey);
			if (cached && Date.now() < cached.expiresAt) {
				// LRU: 重新插入以更新顺序
				this.cache.delete(cacheKey);
				this.cache.set(cacheKey, cached);
				return cached.value;
			}
		}

		// 求值
		const value = this.evaluator.evaluate(attr.expression, context);

		// 存入缓存
		if (attr.cache?.enabled) {
			const cacheKey = this.getCacheKey(attr["@id"], context);
			const ttlSeconds = attr.cache.ttlSeconds ?? 60;
			this.cache.set(cacheKey, {
				value,
				expiresAt: Date.now() + ttlSeconds * 1000,
			});

			// LRU 淘汰
			if (this.cache.size > this.maxCacheSize) {
				const firstKey = this.cache.keys().next().value;
				if (firstKey !== undefined) {
					this.cache.delete(firstKey);
				}
			}
		}

		return value;
	}

	/**
	 * 批量计算实体的所有派生属性
	 *
	 * @param derivedAttrs - 该实体类型关联的派生属性列表
	 * @param context - 实例属性值上下文
	 * @returns 属性名 → 计算值映射
	 */
	evaluateAll(
		derivedAttrs: DerivedAttribute[],
		context: Record<string, unknown>,
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const attr of derivedAttrs) {
			const attrName = attr["@id"].split(":").pop() ?? attr["@id"];
			result[attrName] = this.evaluate(attr, context);
		}
		return result;
	}

	/** 清除缓存 */
	clearCache(): void {
		this.cache.clear();
	}

	/** 生成缓存键（属性排序保证稳定性） */
	private getCacheKey(
		attrId: string,
		context: Record<string, unknown>,
	): string {
		const keys = Object.keys(context).sort();
		const stable = keys
			.map((k) => `${k}=${JSON.stringify(context[k])}`)
			.join("&");
		return `${attrId}:${stable}`;
	}
}

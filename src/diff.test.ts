import { describe, expect, it } from "vitest";
import type { VersionDiff } from "./diff";
import { DiffEngine } from "./diff";
import type { Version } from "./versioning";

// 辅助函数：创建测试用的版本
function createTestVersion(
	versionNumber: number,
	data: Record<string, unknown>,
	objectId = "test-object-1",
): Version {
	return {
		versionId: `v${versionNumber}`,
		objectId,
		versionNumber,
		data: structuredClone(data),
		changedBy: "test-user",
		changedAt: new Date().toISOString(),
		changeDescription: "Test version",
		metadata: {
			source: "manual",
			tags: [],
			audit: [],
		},
	};
}

describe("DiffEngine", () => {
	describe("computeDiff", () => {
		it("should return empty changes for identical objects", async () => {
			const engine = new DiffEngine();
			const data = { name: "Alice", age: 30 };
			const v1 = createTestVersion(1, data);
			const v2 = createTestVersion(2, data);

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(0);
			expect(diff.statistics.additions).toBe(0);
			expect(diff.statistics.modifications).toBe(0);
			expect(diff.statistics.deletions).toBe(0);
			expect(diff.objectId).toBe("test-object-1");
			expect(diff.fromVersion).toBe(1);
			expect(diff.toVersion).toBe(2);
		});

		it("should detect added property with type 'added'", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, { name: "Alice" });
			const v2 = createTestVersion(2, { name: "Alice", age: 30 });

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "added",
				path: "age",
				newValue: 30,
			});
			expect(diff.statistics.additions).toBe(1);
			expect(diff.statistics.modifications).toBe(0);
			expect(diff.statistics.deletions).toBe(0);
		});

		it("should detect deleted property with type 'deleted'", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, { name: "Alice", age: 30 });
			const v2 = createTestVersion(2, { name: "Alice" });

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "deleted",
				path: "age",
				oldValue: 30,
			});
			expect(diff.statistics.additions).toBe(0);
			expect(diff.statistics.modifications).toBe(0);
			expect(diff.statistics.deletions).toBe(1);
		});

		it("should detect modified property with type 'modified'", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, { name: "Alice", age: 30 });
			const v2 = createTestVersion(2, { name: "Alice", age: 31 });

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "modified",
				path: "age",
				oldValue: 30,
				newValue: 31,
			});
			expect(diff.statistics.additions).toBe(0);
			expect(diff.statistics.modifications).toBe(1);
			expect(diff.statistics.deletions).toBe(0);
		});

		it("should detect nested object changes with correct paths", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				user: { name: "Alice", address: { city: "Beijing" } },
			});
			const v2 = createTestVersion(2, {
				user: { name: "Alice", address: { city: "Shanghai" } },
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "modified",
				path: "user.address.city",
				oldValue: "Beijing",
				newValue: "Shanghai",
			});
		});

		it("should detect added nested property with correct path", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				user: { name: "Alice" },
			});
			const v2 = createTestVersion(2, {
				user: { name: "Alice", age: 30 },
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "added",
				path: "user.age",
				newValue: 30,
			});
		});

		it("should detect array changes with correct [index] paths", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				items: ["a", "b", "c"],
			});
			const v2 = createTestVersion(2, {
				items: ["a", "b", "d"],
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "modified",
				path: "items[2]",
				oldValue: "c",
				newValue: "d",
			});
		});

		it("should detect array additions with [index] paths", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				items: ["a", "b"],
			});
			const v2 = createTestVersion(2, {
				items: ["a", "b", "c"],
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "added",
				path: "items[2]",
				newValue: "c",
			});
		});

		it("should detect array deletions with [index] paths", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				items: ["a", "b", "c"],
			});
			const v2 = createTestVersion(2, {
				items: ["a", "b"],
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(1);
			expect(diff.changes[0]).toEqual({
				type: "deleted",
				path: "items[2]",
				oldValue: "c",
			});
		});

		it("should correctly count statistics for mixed changes", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				name: "Alice",
				age: 30,
				city: "Beijing",
			});
			const v2 = createTestVersion(2, {
				name: "Alice",
				age: 31,
				country: "China",
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(3);
			expect(diff.statistics.additions).toBe(1); // country added
			expect(diff.statistics.modifications).toBe(1); // age modified
			expect(diff.statistics.deletions).toBe(1); // city deleted
		});

		it("should handle multiple additions", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, { name: "Alice" });
			const v2 = createTestVersion(2, {
				name: "Alice",
				age: 30,
				city: "Beijing",
			});

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(2);
			expect(diff.statistics.additions).toBe(2);
			expect(diff.statistics.modifications).toBe(0);
			expect(diff.statistics.deletions).toBe(0);
		});

		it("should handle multiple deletions", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, {
				name: "Alice",
				age: 30,
				city: "Beijing",
			});
			const v2 = createTestVersion(2, { name: "Alice" });

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(2);
			expect(diff.statistics.additions).toBe(0);
			expect(diff.statistics.modifications).toBe(0);
			expect(diff.statistics.deletions).toBe(2);
		});

		it("should handle multiple modifications", async () => {
			const engine = new DiffEngine();
			const v1 = createTestVersion(1, { name: "Alice", age: 30 });
			const v2 = createTestVersion(2, { name: "Bob", age: 31 });

			const diff = await engine.computeDiff(v1, v2);

			expect(diff.changes).toHaveLength(2);
			expect(diff.statistics.additions).toBe(0);
			expect(diff.statistics.modifications).toBe(2);
			expect(diff.statistics.deletions).toBe(0);
		});
	});

	describe("toHighlightJSON", () => {
		it("should produce readable output", async () => {
			const engine = new DiffEngine();
			const diff: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [
					{ type: "added", path: "age", newValue: 30 },
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
					{ type: "deleted", path: "oldField", oldValue: "value" },
				],
				statistics: {
					additions: 1,
					modifications: 1,
					deletions: 1,
				},
			};

			const output = await engine.toHighlightJSON(diff);

			expect(output).toContain("diff --object test-object v1 -> v2");
			expect(output).toContain("stats: +1 ~1 -1");
			expect(output).toContain("+ age: 30");
			expect(output).toContain('~ name: "Alice" -> "Bob"');
			expect(output).toContain('- oldField: "value"');
		});

		it("should handle root-level changes", async () => {
			const engine = new DiffEngine();
			const diff: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [{ type: "added", path: "", newValue: "new root" }],
				statistics: {
					additions: 1,
					modifications: 0,
					deletions: 0,
				},
			};

			const output = await engine.toHighlightJSON(diff);

			expect(output).toContain('+ (root): "new root"');
		});

		it("should handle empty changes", async () => {
			const engine = new DiffEngine();
			const diff: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [],
				statistics: {
					additions: 0,
					modifications: 0,
					deletions: 0,
				},
			};

			const output = await engine.toHighlightJSON(diff);

			expect(output).toContain("diff --object test-object v1 -> v2");
			expect(output).toContain("stats: +0 ~0 -0");
		});
	});

	describe("detectConflict", () => {
		it("should detect conflict when both branches modify same path with different values", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Charlie",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(1);
			expect(conflicts[0]).toEqual({
				path: "name",
				valueA: "Bob",
				valueB: "Charlie",
				description: '路径 "name" 在两个分支上被修改为不同的值',
			});
		});

		it("should detect conflict when one deletes and one modifies same path", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [{ type: "deleted", path: "name", oldValue: "Alice" }],
				statistics: { additions: 0, modifications: 0, deletions: 1 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(1);
			expect(conflicts[0]?.path).toBe("name");
			expect(conflicts[0]?.description).toContain("删除");
			expect(conflicts[0]?.description).toContain("修改");
		});

		it("should detect conflict when one modifies and one deletes same path (reversed)", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [{ type: "deleted", path: "name", oldValue: "Alice" }],
				statistics: { additions: 0, modifications: 0, deletions: 1 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(1);
			expect(conflicts[0]?.path).toBe("name");
		});

		it("should not detect conflict when branches modify different paths", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [
					{ type: "modified", path: "age", oldValue: 30, newValue: 31 },
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(0);
		});

		it("should not detect conflict when both modify same path to same value", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(0);
		});

		it("should detect multiple conflicts", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
					{ type: "modified", path: "age", oldValue: 30, newValue: 31 },
					{ type: "deleted", path: "city", oldValue: "Beijing" },
				],
				statistics: { additions: 0, modifications: 2, deletions: 1 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Charlie",
					},
					{ type: "deleted", path: "age", oldValue: 30 },
					{ type: "deleted", path: "city", oldValue: "Beijing" },
				],
				statistics: { additions: 0, modifications: 1, deletions: 2 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(2);
			const paths = conflicts.map((c) => c.path);
			expect(paths).toContain("name");
			expect(paths).toContain("age");
		});

		it("should handle empty diffs", () => {
			const engine = new DiffEngine();
			const diff1: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 2,
				changes: [],
				statistics: { additions: 0, modifications: 0, deletions: 0 },
			};
			const diff2: VersionDiff = {
				objectId: "test-object",
				fromVersion: 1,
				toVersion: 3,
				changes: [
					{
						type: "modified",
						path: "name",
						oldValue: "Alice",
						newValue: "Bob",
					},
				],
				statistics: { additions: 0, modifications: 1, deletions: 0 },
			};

			const conflicts = engine.detectConflict(diff1, diff2);

			expect(conflicts).toHaveLength(0);
		});
	});
});

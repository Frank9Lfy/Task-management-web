import type { Task } from '@/types/task';

/**
 * 任务数据的序列化/反序列化工具。
 *
 * 序列化格式与 localStorage 中 "eisenhower-tasks" 键的格式保持一致，
 * 供 App 状态持久化与存档（useTaskArchive）共用，避免两处逻辑漂移。
 */

/** 将任务数组序列化为字符串（Date 字段会被转为 ISO 字符串） */
export function serializeTasks(tasks: Task[]): string {
  return JSON.stringify(tasks);
}

/**
 * 将字符串反序列化为任务数组，并对每个任务做防御性字段修复，
 * 防止历史数据或外部导入的数据损坏导致页面崩溃。
 * 解析失败或数据不是数组时返回 null（与"空数组"区分开）。
 */
export function deserializeTasks(str: string): Task[] | null {
  try {
    const parsed: unknown = JSON.parse(str);
    if (!Array.isArray(parsed)) {
      console.error('[taskSerializer] 任务数据不是数组');
      return null;
    }
    return parsed.map((raw: unknown) => {
      const t = (raw ?? {}) as Partial<Task>;
      return {
        ...t,
        deadline: t.deadline ? new Date(t.deadline) : undefined,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        // 确保所有必要字段都有默认值，防止数据损坏
        id: t.id || Date.now().toString(),
        title: t.title || '',
        description: t.description || '',
        importance: typeof t.importance === 'number' ? t.importance : 50,
        urgency: typeof t.urgency === 'number' ? t.urgency : 50,
        completed: typeof t.completed === 'boolean' ? t.completed : false,
      } as Task;
    });
  } catch (error) {
    console.error('[taskSerializer] 反序列化任务数据失败:', error);
    return null;
  }
}

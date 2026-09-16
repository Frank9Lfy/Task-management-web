import { useCallback, useEffect, useRef } from 'react';
import type { AppUiState, Task } from '@/types/task';
import { DEFAULT_UI_STATE } from '@/types/task';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { serializeTasks, deserializeTasks } from '@/lib/taskSerializer';

/** 单份存档快照 */
export interface ArchiveSnapshot {
  id: string;
  name: string;
  /** 保存时间（ISO 字符串） */
  savedAt: string;
  /** auto = 关闭页面时自动保存；manual = 用户手动创建/导入 */
  type: 'auto' | 'manual';
  taskCount: number;
  /** 任务数据 JSON 字符串，格式与 localStorage 中任务键一致 */
  data: string;
  /** 保存时的界面状态，恢复存档时一并还原 */
  ui: AppUiState;
}

/** 导出文件的包装格式 */
export interface ArchiveExportFile {
  app: 'eisenhower-tasks';
  version: number;
  exportedAt: string;
  name: string;
  taskCount: number;
  data: string;
  ui: AppUiState;
}

const ARCHIVE_KEY = 'eisenhower-archives';
const MAX_AUTO_ARCHIVES = 5;
const MAX_TOTAL_ARCHIVES = 30;

interface UseTaskArchiveOptions {
  tasks: Task[];
  ui: AppUiState;
  /** 恢复存档时回调：应用任务数据与界面状态 */
  onRestore: (tasks: Task[], ui: AppUiState) => void;
}

function isExportFile(value: unknown): value is ArchiveExportFile {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return r.app === 'eisenhower-tasks' && typeof r.data === 'string';
}

function normalizeSnapshot(raw: unknown): ArchiveSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.data !== 'string') return null;
  const rawUi = r.ui && typeof r.ui === 'object' ? (r.ui as Record<string, unknown>) : null;
  const ui: AppUiState = rawUi
    ? {
        viewMode: rawUi.viewMode === 'list' ? 'list' : 'chart',
        activeTab: typeof rawUi.activeTab === 'string' ? rawUi.activeTab : DEFAULT_UI_STATE.activeTab,
      }
    : { ...DEFAULT_UI_STATE };
  return {
    id: r.id,
    name: typeof r.name === 'string' && r.name ? r.name : '未命名存档',
    savedAt: typeof r.savedAt === 'string' ? r.savedAt : new Date().toISOString(),
    type: r.type === 'manual' ? 'manual' : 'auto',
    taskCount: typeof r.taskCount === 'number' ? r.taskCount : 0,
    data: r.data,
    ui,
  };
}

function normalizeUi(raw: unknown): AppUiState {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (!r) return { ...DEFAULT_UI_STATE };
  return {
    viewMode: r.viewMode === 'list' ? 'list' : 'chart',
    activeTab: typeof r.activeTab === 'string' ? r.activeTab : DEFAULT_UI_STATE.activeTab,
  };
}

/** 直接从 localStorage 读取存档列表（绕过 React，供页面卸载等极端时机使用） */
function readArchivesFromStorage(): ArchiveSnapshot[] {
  try {
    const item = localStorage.getItem(ARCHIVE_KEY);
    if (!item) return [];
    const parsed: unknown = JSON.parse(item);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSnapshot).filter((a): a is ArchiveSnapshot => a !== null);
  } catch {
    return [];
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * 任务存档 Hook。
 *
 * 功能：
 * 1. 关闭/隐藏页面时自动写入一份"自动存档"快照（保留最近 MAX_AUTO_ARCHIVES 份，
 *    数据与界面均无变化时跳过，避免产生无意义的重复存档）。
 * 2. 手动创建/删除/恢复存档；恢复时连同界面状态一起还原。
 * 3. 导出存档为 JSON 文件、从文件导入存档，作为跨设备/清空浏览器数据前的备份手段。
 *
 * 说明：任务数据的实时保存由 App 中的 useLocalStorage 负责（每次修改立即写盘），
 * 本 Hook 的自动存档提供的是"可回滚的历史快照"。
 */
export function useTaskArchive({ tasks, ui, onRestore }: UseTaskArchiveOptions) {
  const [archives, setArchives] = useLocalStorage<ArchiveSnapshot[]>(ARCHIVE_KEY, [], {
    deserialize: (str) => {
      try {
        const parsed: unknown = JSON.parse(str);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeSnapshot).filter((a): a is ArchiveSnapshot => a !== null);
      } catch (error) {
        console.error('[useTaskArchive] 读取存档列表失败:', error);
        return [];
      }
    },
  });

  // 用 ref 保存最新的 tasks/ui/onRestore，供页面卸载前的自动存档读取。
  // 在 effect 中同步 ref 值（而非渲染期间），避免级联渲染问题
  const tasksRef = useRef(tasks);
  const uiRef = useRef(ui);
  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    tasksRef.current = tasks;
    uiRef.current = ui;
    onRestoreRef.current = onRestore;
  });

  const createSnapshot = useCallback((type: ArchiveSnapshot['type'], name?: string): ArchiveSnapshot => {
    const now = new Date();
    const data = serializeTasks(tasksRef.current);
    return {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: name?.trim() || (type === 'auto' ? `自动存档 ${formatTimestamp(now).replace('_', ' ')}` : `手动存档 ${formatTimestamp(now).replace('_', ' ')}`),
      savedAt: now.toISOString(),
      type,
      taskCount: tasksRef.current.length,
      data,
      ui: { ...uiRef.current },
    };
  }, []);

  /** 手动创建一份存档，返回创建的快照 */
  const saveArchive = useCallback((name?: string): ArchiveSnapshot => {
    const snapshot = createSnapshot('manual', name);
    setArchives(prev => [snapshot, ...prev].slice(0, MAX_TOTAL_ARCHIVES));
    return snapshot;
  }, [createSnapshot, setArchives]);

  const deleteArchive = useCallback((id: string) => {
    setArchives(prev => prev.filter(a => a.id !== id));
  }, [setArchives]);

  /** 恢复存档；成功返回 true，存档不存在或数据损坏返回 false */
  const restoreArchive = useCallback((id: string): boolean => {
    const archive = readArchivesFromStorage().find(a => a.id === id) ?? archives.find(a => a.id === id);
    if (!archive) return false;
    const restored = deserializeTasks(archive.data);
    if (!restored) {
      console.error('[useTaskArchive] 存档数据损坏，无法恢复:', archive.id);
      return false;
    }
    onRestoreRef.current(restored, archive.ui);
    return true;
  }, [archives]);

  /** 将存档下载为 JSON 文件；不传 id 时导出当前正在编辑的数据 */
  const exportArchive = useCallback((id?: string): boolean => {
    const snapshot = id
      ? readArchivesFromStorage().find(a => a.id === id) ?? archives.find(a => a.id === id)
      : createSnapshot('manual');
    if (!snapshot) return false;
    try {
      const file: ArchiveExportFile = {
        app: 'eisenhower-tasks',
        version: 1,
        exportedAt: new Date().toISOString(),
        name: snapshot.name,
        taskCount: snapshot.taskCount,
        data: snapshot.data,
        ui: snapshot.ui,
      };
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `四象限任务存档_${formatTimestamp(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('[useTaskArchive] 导出存档失败:', error);
      return false;
    }
  }, [archives, createSnapshot]);

  /** 从 JSON 文件导入存档（加入存档列表，不直接覆盖当前数据）；成功返回存档名 */
  const importArchive = useCallback(async (file: File): Promise<string> => {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('文件不是有效的 JSON 格式');
    }

    let candidate: { data: string; name?: string; ui?: unknown; taskCount?: number };
    if (isExportFile(parsed)) {
      // 本应用导出的格式
      candidate = { data: parsed.data, name: parsed.name, ui: parsed.ui, taskCount: parsed.taskCount };
    } else if (Array.isArray(parsed)) {
      // 裸任务数组格式（例如手动整理的 JSON）
      candidate = { data: JSON.stringify(parsed), name: file.name.replace(/\.json$/i, '') };
    } else {
      throw new Error('文件格式不正确，请使用本应用导出的存档文件');
    }

    const validated = deserializeTasks(candidate.data);
    if (!validated) {
      throw new Error('存档内容校验失败，任务数据已损坏');
    }

    const baseName = candidate.name?.trim() || file.name.replace(/\.json$/i, '');
    const snapshot: ArchiveSnapshot = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: `导入：${baseName}`,
      savedAt: new Date().toISOString(),
      type: 'manual',
      taskCount: candidate.taskCount ?? validated.length,
      data: candidate.data,
      ui: normalizeUi(candidate.ui),
    };
    setArchives(prev => [snapshot, ...prev].slice(0, MAX_TOTAL_ARCHIVES));
    return snapshot.name;
  }, [setArchives]);

  // 关闭/隐藏页面时自动存档。
  // 直接写 localStorage 而不经过 setState：页面卸载阶段 React 可能不再处理状态更新，
  // 只有同步写盘才能保证存档一定落盘。
  useEffect(() => {
    const saveAutoArchive = () => {
      try {
        const current = serializeTasks(tasksRef.current);
        const currentUi = { ...uiRef.current };
        const list = readArchivesFromStorage();
        const lastAuto = list.find(a => a.type === 'auto');
        if (lastAuto && lastAuto.data === current
          && lastAuto.ui.viewMode === currentUi.viewMode
          && lastAuto.ui.activeTab === currentUi.activeTab) {
          return; // 数据与界面均无变化，跳过
        }
        const now = new Date();
        const snapshot: ArchiveSnapshot = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          name: `自动存档 ${formatTimestamp(now).replace('_', ' ')}`,
          savedAt: now.toISOString(),
          type: 'auto',
          taskCount: tasksRef.current.length,
          data: current,
          ui: currentUi,
        };
        const autos = [snapshot, ...list.filter(a => a.type === 'auto')].slice(0, MAX_AUTO_ARCHIVES);
        const next = [...autos, ...list.filter(a => a.type !== 'auto')].slice(0, MAX_TOTAL_ARCHIVES);
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('[useTaskArchive] 自动存档失败:', error);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveAutoArchive();
    };
    window.addEventListener('pagehide', saveAutoArchive);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', saveAutoArchive);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const lastAutoSavedAt = archives.find(a => a.type === 'auto')?.savedAt;

  return { archives, saveArchive, deleteArchive, restoreArchive, exportArchive, importArchive, lastAutoSavedAt };
}

import { useRef, useState } from 'react';
import type { ArchiveSnapshot } from '@/hooks/useTaskArchive';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Archive,
  ArchiveRestore,
  Clock,
  Download,
  History,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface ArchiveManagerProps {
  isOpen: boolean;
  onClose: () => void;
  archives: ArchiveSnapshot[];
  currentTaskCount: number;
  lastAutoSavedAt?: string;
  onSaveArchive: (name?: string) => ArchiveSnapshot;
  onDeleteArchive: (id: string) => void;
  onRestoreArchive: (id: string) => boolean;
  onExportArchive: (id?: string) => boolean;
  onImportArchive: (file: File) => Promise<string>;
}

type PendingAction =
  | { type: 'restore'; archive: ArchiveSnapshot }
  | { type: 'delete'; archive: ArchiveSnapshot }
  | null;

export const ArchiveManager: React.FC<ArchiveManagerProps> = ({
  isOpen,
  onClose,
  archives,
  currentTaskCount,
  lastAutoSavedAt,
  onSaveArchive,
  onDeleteArchive,
  onRestoreArchive,
  onExportArchive,
  onImportArchive,
}) => {
  const [archiveName, setArchiveName] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const name = archiveName.trim();
    const snapshot = onSaveArchive(name || undefined);
    setArchiveName('');
    toast.success(`已创建存档「${snapshot.name}」（${snapshot.taskCount} 个任务）`);
  };

  const handleConfirmPending = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'restore') {
      const ok = onRestoreArchive(pendingAction.archive.id);
      if (ok) {
        toast.success(`已恢复存档「${pendingAction.archive.name}」，可继续编辑，修改会自动保存`);
        onClose();
      } else {
        toast.error('存档数据已损坏，无法恢复');
      }
    } else {
      onDeleteArchive(pendingAction.archive.id);
      toast.success('存档已删除');
    }
    setPendingAction(null);
  };

  const handleExport = (id?: string) => {
    const ok = onExportArchive(id);
    toast[ok ? 'success' : 'error'](ok ? '存档文件已开始下载' : '导出失败，请重试');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsImporting(true);
    try {
      const name = await onImportArchive(file);
      toast.success(`已导入存档「${name}」，在列表中点击"恢复"即可应用`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败，请检查文件');
    } finally {
      setIsImporting(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return iso;
    }
  };

  // 按保存时间倒序展示（不改变存储顺序）
  const sortedArchives = [...archives].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <History className="w-5 h-5 text-indigo-600" />
              </div>
              存档管理
            </DialogTitle>
            <DialogDescription>
              任务数据在每次编辑时都会实时保存；关闭网页时还会自动生成一份可回滚的存档快照。
            </DialogDescription>
          </DialogHeader>

          {/* 当前状态 */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
            <Archive className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span>当前 <b className="text-indigo-600">{currentTaskCount}</b> 个任务</span>
            <span className="text-gray-300">|</span>
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{lastAutoSavedAt ? `最近自动存档：${formatTime(lastAutoSavedAt)}` : '暂无自动存档（关闭网页后生成）'}</span>
          </div>

          {/* 创建存档 */}
          <div className="flex gap-2">
            <Input
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="输入存档名称（可选，直接创建则自动命名）"
              className="h-10 rounded-xl border-gray-200 focus:border-indigo-500"
            />
            <Button
              onClick={handleSave}
              size="sm"
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              创建存档
            </Button>
          </div>

          {/* 导出 / 导入 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport()}
              className="h-9 px-3 rounded-xl border-gray-200 hover:bg-gray-50 text-xs flex-1"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              导出当前数据
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              disabled={isImporting}
              className="h-9 px-3 rounded-xl border-gray-200 hover:bg-gray-50 text-xs flex-1"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {isImporting ? '导入中...' : '从文件导入存档'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          {/* 存档列表 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              存档列表 <span className="text-gray-400 font-normal">（{sortedArchives.length} 份，自动存档最多保留 5 份）</span>
            </p>
            {sortedArchives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <History className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm">暂无存档</p>
                <p className="text-xs mt-1 text-gray-300">关闭网页时会自动创建，也可在上方手动创建</p>
              </div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-2 pr-3">
                  {sortedArchives.map((archive) => (
                    <div
                      key={archive.id}
                      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 transition-all px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={archive.type === 'auto' ? 'secondary' : 'default'}
                            className="text-[10px] px-1.5 py-0 flex-shrink-0"
                          >
                            {archive.type === 'auto' ? '自动' : '手动'}
                          </Badge>
                          <span className="text-sm font-medium text-gray-800 truncate">{archive.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(archive.savedAt)} · {archive.taskCount} 个任务
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingAction({ type: 'restore', archive })}
                          className="h-8 px-2.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
                          恢复
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExport(archive.id)}
                          className="h-8 px-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          title="导出此存档"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingAction({ type: 'delete', archive })}
                          className="h-8 px-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="删除此存档"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 恢复/删除确认弹窗 */}
      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmPending}
        title={pendingAction?.type === 'restore' ? '确认恢复存档' : '确认删除存档'}
        description={
          pendingAction?.type === 'restore'
            ? `恢复存档「${pendingAction?.archive.name}」将覆盖当前所有任务数据和界面状态（当前 ${currentTaskCount} 个任务），此操作不可撤销。确定继续吗？`
            : `确定要删除存档「${pendingAction?.archive.name}」吗？删除后无法找回。`
        }
        type={pendingAction?.type === 'restore' ? 'warning' : 'delete'}
        confirmText={pendingAction?.type === 'restore' ? '确认恢复' : '确认删除'}
      />
    </>
  );
};

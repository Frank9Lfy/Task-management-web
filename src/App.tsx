import { useState, useCallback } from 'react';
import type { Task } from '@/types/task';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { QuadrantChart } from '@/components/QuadrantChart';
import { TaskList } from '@/components/TaskList';
import { TaskDialog } from '@/components/TaskDialog';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, List, Sparkles, Trash2, BarChart3, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

function App() {
  // 使用 useLocalStorage 管理任务数据，自动处理本地存储的读取和写入
  // 通过自定义 deserialize/serialize 正确处理 Date 类型的序列化
  const [tasks, setTasks] = useLocalStorage<Task[]>('eisenhower-tasks', [], {
    serialize: (tasks) => JSON.stringify(tasks),
    deserialize: (str) => {
      try {
        const parsed = JSON.parse(str);
        // 防御性检查：确保解析结果是数组
        if (!Array.isArray(parsed)) {
          console.error('[App] localStorage 中的任务数据不是数组，已重置为空数组');
          return [];
        }
        return parsed.map((t: any) => ({
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
        }));
      } catch (error) {
        console.error('[App] 反序列化任务数据失败:', error);
        return [];
      }
    }
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ importance: number; urgency: number } | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  // 确认弹窗状态
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handlePositionSelect = useCallback((importance: number, urgency: number) => {
    setSelectedPosition({ importance, urgency });
    setSelectedTask(null);
    setIsDialogOpen(true);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setSelectedPosition(null);
    setIsDialogOpen(true);
  }, []);

  const handleSaveTask = useCallback((task: Task) => {
    setTasks(prev => {
      const existingIndex = prev.findIndex(t => t.id === task.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = task;
        return updated;
      } else {
        return [...prev, task];
      }
    });
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('任务已删除');
  }, []);

  const handleToggleComplete = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        const updated = prev.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        );
        toast.success(task.completed ? '任务已恢复' : '任务已完成', {
          icon: task.completed ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />
        });
        return updated;
      }
      return prev;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    setTasks([]);
    toast.success('所有任务已清空');
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedTask(null);
    setSelectedPosition(null);
    setIsDialogOpen(true);
  }, []);

  const filteredTasks = activeTab === 'all'
    ? tasks
    : activeTab === 'active'
      ? tasks.filter(t => !t.completed)
      : tasks.filter(t => t.completed);

  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  智能四象限任务管理
                </h1>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Circle className="w-3 h-3 text-indigo-500" />
                    {activeCount} 进行中
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {completedCount} 已完成
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
                  className="hidden sm:flex h-10 px-4 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  {viewMode === 'chart' ? <List className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
                  {viewMode === 'chart' ? '列表视图' : '图表视图'}
                </Button>
              </motion.div>

              {tasks.length > 0 && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-10 px-4 rounded-xl border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空
                  </Button>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={handleAddNew}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建任务
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：坐标轴或列表 */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {viewMode === 'chart' ? (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <LayoutGrid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">任务分布图</h2>
                          <p className="text-xs text-gray-500">点击坐标轴任意位置添加任务</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          紧急重要
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          重要
                        </span>
                      </div>
                    </div>
                    <QuadrantChart
                      tasks={filteredTasks}
                      onTaskClick={handleTaskClick}
                      onPositionSelect={handlePositionSelect}
                      selectedPosition={selectedPosition}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <List className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">任务列表</h2>
                  </div>
                  <TaskList
                    tasks={filteredTasks}
                    quadrantFilter="all"
                    onToggleComplete={handleToggleComplete}
                    onTaskClick={handleTaskClick}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 任务列表（图表视图下显示） */}
            {viewMode === 'chart' && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-gray-100/80 p-1 rounded-xl">
                      <TabsTrigger
                        value="all"
                        className="px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                      >
                        全部
                      </TabsTrigger>
                      <TabsTrigger
                        value="active"
                        className="px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                      >
                        进行中
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                      >
                        已完成
                      </TabsTrigger>
                    </TabsList>
                    <span className="text-sm text-gray-500 font-medium">
                      共 <span className="text-indigo-600 font-bold">{filteredTasks.length}</span> 个任务
                    </span>
                  </div>

                  <TabsContent value={activeTab} className="mt-0">
                    <TaskList
                      tasks={filteredTasks}
                      quadrantFilter="all"
                      onToggleComplete={handleToggleComplete}
                      onTaskClick={handleTaskClick}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* 右侧：智能建议 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">智能分析</h2>
              </div>
              <SmartSuggestions tasks={tasks} />
            </div>
          </div>
        </div>
      </main>

      {/* 任务对话框 */}
      <TaskDialog
        task={selectedTask}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPosition(null);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialPosition={selectedPosition}
      />

      {/* 清空确认弹窗 */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
        title="确认清空所有任务"
        description="您确定要删除所有任务吗？此操作不可撤销，所有任务数据将被永久删除。"
        type="delete"
        confirmText="确认清空"
      />
    </div>
  );
}

export default App;

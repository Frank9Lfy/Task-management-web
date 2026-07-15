import { QUADRANT_CONFIG } from '@/types/task';
import type { Task, QuadrantType } from '@/types/task';
import { TaskCard } from './TaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Inbox } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  quadrantFilter?: QuadrantType | 'all';
  onToggleComplete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  quadrantFilter = 'all',
  onToggleComplete,
  onTaskClick
}) => {
  const filteredTasks = quadrantFilter === 'all' 
    ? tasks 
    : tasks.filter(task => {
        const importance = task.importance >= 50;
        const urgency = task.urgency >= 50;
        switch (quadrantFilter) {
          case 'urgent-important': return importance && urgency;
          case 'not-urgent-important': return importance && !urgency;
          case 'urgent-not-important': return !importance && urgency;
          case 'not-urgent-not-important': return !importance && !urgency;
          default: return true;
        }
      });

  // 按优先级排序：未完成的在前，然后按重要性+紧急度排序
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const scoreA = a.importance + a.urgency;
    const scoreB = b.importance + b.urgency;
    return scoreB - scoreA;
  });

  // 按象限分组
  const groupedTasks = sortedTasks.reduce((acc, task) => {
    const importance = task.importance >= 50;
    const urgency = task.urgency >= 50;
    let quadrant: QuadrantType;
    if (importance && urgency) quadrant = 'urgent-important';
    else if (importance && !urgency) quadrant = 'not-urgent-important';
    else if (!importance && urgency) quadrant = 'urgent-not-important';
    else quadrant = 'not-urgent-not-important';
    
    if (!acc[quadrant]) acc[quadrant] = [];
    acc[quadrant].push(task);
    return acc;
  }, {} as Record<QuadrantType, Task[]>);

  const quadrantOrder: QuadrantType[] = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'];

  if (tasks.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-80 text-gray-400"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-inner">
          <ClipboardList className="w-12 h-12 text-gray-300" />
        </div>
        <p className="text-lg font-medium text-gray-500">暂无任务</p>
        <p className="text-sm mt-2 text-gray-400">点击坐标轴添加您的第一个任务</p>
      </motion.div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-64 text-gray-400"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">该筛选条件下无任务</p>
      </motion.div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-8 pr-4">
        <AnimatePresence mode="popLayout">
          {quadrantOrder.map((quadrant) => {
            const quadrantTasks = groupedTasks[quadrant];
            if (!quadrantTasks || quadrantTasks.length === 0) return null;
            if (quadrantFilter !== 'all' && quadrantFilter !== quadrant) return null;

            const config = QUADRANT_CONFIG[quadrant];
            const completedCount = quadrantTasks.filter(t => t.completed).length;
            const progress = quadrantTasks.length > 0 ? (completedCount / quadrantTasks.length) * 100 : 0;

            return (
              <motion.div
                key={quadrant}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* 象限标题栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center shadow-sm`}>
                      <div className={`w-4 h-4 rounded-full ${config.color.replace('text-', 'bg-').replace('600', '500')}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${config.color}`}>
                        {config.title}
                      </h3>
                      <p className="text-xs text-gray-400">{config.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 进度条 */}
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full rounded-full ${config.color.replace('text-', 'bg-').replace('600', '500')}`}
                      />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {completedCount}/{quadrantTasks.length}
                    </span>
                  </div>
                </div>

                {/* 任务列表 */}
                <div className="space-y-3 pl-2">
                  <AnimatePresence mode="popLayout">
                    {quadrantTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <TaskCard
                          task={task}
                          onToggleComplete={onToggleComplete}
                          onClick={onTaskClick}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

import { getQuadrant, calculatePriorityScore, getSmartSuggestion } from '@/types/task';
import type { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Target, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartSuggestionsProps {
  tasks: Task[];
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ tasks }) => {
  const activeTasks = tasks.filter(t => !t.completed);
  
  // 计算统计数据
  const stats = {
    urgentImportant: activeTasks.filter(t => getQuadrant(t.importance, t.urgency) === 'urgent-important').length,
    notUrgentImportant: activeTasks.filter(t => getQuadrant(t.importance, t.urgency) === 'not-urgent-important').length,
    urgentNotImportant: activeTasks.filter(t => getQuadrant(t.importance, t.urgency) === 'urgent-not-important').length,
    notUrgentNotImportant: activeTasks.filter(t => getQuadrant(t.importance, t.urgency) === 'not-urgent-not-important').length,
  };

  // 获取智能建议
  const suggestions = getSmartSuggestion(tasks);

  // 找出优先级最高的任务
  const topPriorityTask = activeTasks.length > 0 
    ? activeTasks.reduce((max, task) => 
        calculatePriorityScore(task) > calculatePriorityScore(max) ? task : max
      , activeTasks[0])
    : null;

  // 检查即将到期的任务
  const now = new Date();
  const upcomingTasks = activeTasks.filter(t => {
    if (!t.deadline) return false;
    const daysLeft = (t.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3 && daysLeft >= 0;
  }).sort((a, b) => {
    if (!a.deadline || !b.deadline) return 0;
    return a.deadline.getTime() - b.deadline.getTime();
  });

  // 计算完成率
  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  if (tasks.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-indigo-900 text-lg">开始使用</p>
              <p className="text-sm text-indigo-600/80 mt-0.5">点击坐标轴添加您的第一个任务</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 主要建议 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={suggestions.join(',')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-5 relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/25">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 text-base mb-2">智能建议</p>
                  <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <motion.li 
                        key={index} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-amber-800/90 flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-amber-500 mt-1">●</span>
                        {suggestion}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* 统计数据网格 */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-xs text-red-600 font-medium">重要且紧急</span>
              </div>
              <p className="text-3xl font-bold text-red-700">{stats.urgentImportant}</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs text-blue-600 font-medium">重要不紧急</span>
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.notUrgentImportant}</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-amber-600 font-medium">紧急不重要</span>
              </div>
              <p className="text-3xl font-bold text-amber-700">{stats.urgentNotImportant}</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-xs text-green-600 font-medium">完成率</span>
              </div>
              <p className="text-3xl font-bold text-green-700">{completionRate}%</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 最高优先级任务 */}
      {topPriorityTask && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 border-purple-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                最高优先级任务
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-bold text-purple-900 text-base mb-2">{topPriorityTask.title}</p>
              <div className="flex items-center gap-4 text-xs text-purple-600/80">
                <span className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-full">
                  <Target className="w-3 h-3" />
                  重要性: {Math.round(topPriorityTask.importance)}
                </span>
                <span className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  紧急度: {Math.round(topPriorityTask.urgency)}
                </span>
              </div>
              {topPriorityTask.deadline && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 w-fit px-3 py-1.5 rounded-full">
                  <CalendarIcon className="w-3 h-3" />
                  截止: {topPriorityTask.deadline.toLocaleDateString('zh-CN')}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 即将到期 */}
      {upcomingTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-900">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                即将到期 ({upcomingTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {upcomingTasks.slice(0, 3).map((task, index) => {
                  const daysLeft = task.deadline 
                    ? Math.ceil((task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  return (
                    <motion.li 
                      key={task.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate flex-1 text-orange-900 font-medium">{task.title}</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        daysLeft === 0 ? 'bg-red-100 text-red-600' : 
                        daysLeft === 1 ? 'bg-orange-100 text-orange-600' : 
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {daysLeft === 0 ? '今天' : daysLeft === 1 ? '明天' : `${daysLeft}天后`}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

// 导入 CalendarIcon
import { CalendarIcon } from 'lucide-react';

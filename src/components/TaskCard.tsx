import { getQuadrant, QUADRANT_CONFIG } from '@/types/task';
import type { Task } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onClick }) => {
  const quadrant = getQuadrant(task.importance, task.urgency);
  const config = QUADRANT_CONFIG[quadrant];
  
  // 计算距离截止日期的天数
  const getDaysUntilDeadline = () => {
    if (!task.deadline) return null;
    const now = new Date();
    const diff = task.deadline.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };
  
  const daysUntil = getDaysUntilDeadline();
  const isOverdue = daysUntil !== null && daysUntil < 0;
  const isUrgent = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
          task.completed ? 'opacity-50' : ''
        } border-0 shadow-md overflow-hidden`}
        onClick={() => onClick(task)}
      >
        {/* 顶部颜色条 */}
        <div className={`h-1.5 w-full ${config.bgColor.replace('50', '500')}`} />
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div 
              className="pt-1"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task.id);
              }}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                task.completed 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-300 hover:border-indigo-400'
              }`}>
                {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              
              {task.description && (
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* 象限标签 */}
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                  {config.subtitle}
                </span>
                
                {/* 截止日期 */}
                {task.deadline && (
                  <span className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-full font-medium ${
                    isOverdue ? 'bg-red-100 text-red-600' : 
                    isUrgent ? 'bg-orange-100 text-orange-600' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    <Calendar className="w-3 h-3" />
                    {isOverdue ? `逾期 ${Math.abs(daysUntil)} 天` : 
                     daysUntil === 0 ? '今天到期' :
                     daysUntil === 1 ? '明天到期' :
                     `${daysUntil} 天后`}
                  </span>
                )}
                
                {/* 重要性/紧急度指示 */}
                <span className="text-[10px] text-gray-400 flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full">
                  <span className="flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {Math.round(task.importance)}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {Math.round(task.urgency)}
                  </span>
                </span>
              </div>
            </div>
            
            {/* 紧急标记 */}
            {(isOverdue || isUrgent) && !task.completed && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isOverdue ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  <AlertCircle className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-orange-500'}`} />
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

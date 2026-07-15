import { useState, useEffect } from 'react';
import { getQuadrant, QUADRANT_CONFIG } from '@/types/task';
import type { Task } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2, Save, X, Sparkles, Clock, Target, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ConfirmDialog } from './ConfirmDialog';

interface TaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (id: string) => void;
  initialPosition?: { importance: number; urgency: number } | null;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialPosition
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(50);
  const [urgency, setUrgency] = useState(50);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [completed, setCompleted] = useState(false);
  
  // 确认弹窗状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setImportance(task.importance);
      setUrgency(task.urgency);
      setDeadline(task.deadline);
      setCompleted(task.completed);
    } else if (initialPosition) {
      setTitle('');
      setDescription('');
      setImportance(initialPosition.importance);
      setUrgency(initialPosition.urgency);
      setDeadline(undefined);
      setCompleted(false);
    } else {
      setTitle('');
      setDescription('');
      setImportance(50);
      setUrgency(50);
      setDeadline(undefined);
      setCompleted(false);
    }
  }, [task, initialPosition, isOpen]);

  const handleSaveClick = () => {
    if (!title.trim()) return;
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = () => {
    const newTask: Task = {
      id: task?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      importance,
      urgency,
      deadline,
      createdAt: task?.createdAt || new Date(),
      completed
    };
    onSave(newTask);
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  };

  const quadrant = getQuadrant(importance, urgency);
  const config = QUADRANT_CONFIG[quadrant];

  // 获取重要性/紧急度标签
  const getLevelLabel = (value: number) => {
    if (value >= 70) return { label: '高', color: 'text-red-500', bg: 'bg-red-50' };
    if (value >= 40) return { label: '中', color: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: '低', color: 'text-green-500', bg: 'bg-green-50' };
  };

  const importanceLevel = getLevelLabel(importance);
  const urgencyLevel = getLevelLabel(urgency);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
          {/* 头部渐变背景 */}
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
            quadrant === 'urgent-important' ? 'from-red-400 to-rose-500' :
            quadrant === 'not-urgent-important' ? 'from-blue-400 to-cyan-500' :
            quadrant === 'urgent-not-important' ? 'from-amber-400 to-yellow-500' :
            'from-gray-400 to-slate-500'
          }`} />
          
          <DialogHeader className="pt-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                  <Sparkles className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    {isEditing ? '编辑任务' : '新建任务'}
                  </span>
                  <motion.span
                    key={quadrant}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`ml-3 text-xs px-3 py-1 rounded-full ${config.bgColor} ${config.color} font-medium`}
                  >
                    {config.title}
                  </motion.span>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 任务标题 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                任务名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入任务名称..."
                className="w-full h-12 text-base rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* 任务描述 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                详细描述
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加任务的详细描述..."
                rows={3}
                className="w-full resize-none rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* 重要性滑块 */}
            <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border border-blue-100">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  重要性
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${importanceLevel.bg} ${importanceLevel.color}`}>
                    {importanceLevel.label}
                  </span>
                  <span className="text-lg font-bold text-gray-700 w-12 text-right">{Math.round(importance)}</span>
                </div>
              </div>
              <Slider
                value={[importance]}
                onValueChange={(value) => setImportance(value[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>低优先级</span>
                <span>中等</span>
                <span>高优先级</span>
              </div>
            </div>

            {/* 紧急度滑块 */}
            <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50/50 to-amber-50/50 border border-orange-100">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  紧急度
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${urgencyLevel.bg} ${urgencyLevel.color}`}>
                    {urgencyLevel.label}
                  </span>
                  <span className="text-lg font-bold text-gray-700 w-12 text-right">{Math.round(urgency)}</span>
                </div>
              </div>
              <Slider
                value={[urgency]}
                onValueChange={(value) => setUrgency(value[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>不紧急</span>
                <span>中等</span>
                <span>非常紧急</span>
              </div>
            </div>

            {/* 截止日期 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                截止日期
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal h-12 rounded-xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all ${
                      !deadline && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-indigo-400" />
                    {deadline ? format(deadline, 'yyyy年MM月dd日', { locale: zhCN }) : '选择截止日期（可选）'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 象限预览卡片 */}
            <motion.div 
              key={quadrant}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl ${config.bgColor} border-2 ${config.borderColor} relative overflow-hidden`}
            >
              {/* 装饰背景 */}
              <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className={`mt-1 ${config.color}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-base ${config.color}`}>{config.title}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{config.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-xs px-3 py-1.5 rounded-full bg-white/80 ${config.color} font-medium`}>
                      建议：{config.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            {isEditing && onDelete && (
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                className="mr-auto h-12 px-6 rounded-xl border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50 transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button 
              onClick={handleSaveClick} 
              disabled={!title.trim()}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? '保存修改' : '创建任务'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="确认删除任务"
        description={`您确定要删除任务 "${title}" 吗？此操作不可撤销。`}
        type="delete"
      />

      {/* 保存确认弹窗 */}
      <ConfirmDialog
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        title={isEditing ? "确认保存修改" : "确认创建任务"}
        description={isEditing 
          ? `您确定要保存对任务 "${title}" 的修改吗？` 
          : `您确定要创建新任务 "${title}" 吗？`
        }
        type={isEditing ? "edit" : "save"}
      />
    </>
  );
};

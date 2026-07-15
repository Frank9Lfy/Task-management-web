export interface Task {
  id: string;
  title: string;
  description: string;
  importance: number; // 0-100
  urgency: number; // 0-100
  deadline?: Date;
  createdAt: Date;
  completed: boolean;
}

export type QuadrantType = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

export interface QuadrantInfo {
  type: QuadrantType;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const QUADRANT_CONFIG: Record<QuadrantType, QuadrantInfo> = {
  'urgent-important': {
    type: 'urgent-important',
    title: '重要且紧急',
    subtitle: '立即执行',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    description: '危机、截止日期、紧急问题'
  },
  'not-urgent-important': {
    type: 'not-urgent-important',
    title: '重要不紧急',
    subtitle: '计划执行',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    description: '规划、学习、关系建设'
  },
  'urgent-not-important': {
    type: 'urgent-not-important',
    title: '紧急不重要',
    subtitle: '委托他人',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    description: '干扰、某些邮件、某些会议'
  },
  'not-urgent-not-important': {
    type: 'not-urgent-not-important',
    title: '不重要不紧急',
    subtitle: '尽量删除',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    description: '时间浪费、过度娱乐'
  }
};

export function getQuadrant(importance: number, urgency: number): QuadrantType {
  if (importance >= 50 && urgency >= 50) return 'urgent-important';
  if (importance >= 50 && urgency < 50) return 'not-urgent-important';
  if (importance < 50 && urgency >= 50) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

export function calculatePriorityScore(task: Task): number {
  const now = new Date();
  const daysUntilDeadline = task.deadline 
    ? Math.max(0, (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 365;
  
  // 紧急度随截止日期临近而增加
  const urgencyBoost = task.deadline 
    ? Math.max(0, (7 - daysUntilDeadline) / 7) * 30
    : 0;
  
  const adjustedUrgency = Math.min(100, task.urgency + urgencyBoost);
  
  // 综合评分：重要性占60%，紧急度占40%
  return task.importance * 0.6 + adjustedUrgency * 0.4;
}

export function getSmartSuggestion(tasks: Task[]): string[] {
  const suggestions: string[] = [];
  
  const urgentImportant = tasks.filter(t => getQuadrant(t.importance, t.urgency) === 'urgent-important' && !t.completed);
  const notUrgentImportant = tasks.filter(t => getQuadrant(t.importance, t.urgency) === 'not-urgent-important' && !t.completed);
  const urgentNotImportant = tasks.filter(t => getQuadrant(t.importance, t.urgency) === 'urgent-not-important' && !t.completed);
  
  if (urgentImportant.length > 3) {
    suggestions.push(`您有 ${urgentImportant.length} 个重要且紧急的任务，建议优先处理这些危机事项`);
  }
  
  if (notUrgentImportant.length > 5) {
    suggestions.push(`您有 ${notUrgentImportant.length} 个重要不紧急的任务，建议制定计划逐步完成`);
  }
  
  if (urgentNotImportant.length > 3) {
    suggestions.push(`您有 ${urgentNotImportant.length} 个紧急不重要的任务，考虑委托他人处理`);
  }
  
  // 检查即将到期的任务
  const now = new Date();
  const upcomingTasks = tasks.filter(t => {
    if (!t.deadline || t.completed) return false;
    const daysLeft = (t.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3 && daysLeft > 0;
  });
  
  if (upcomingTasks.length > 0) {
    suggestions.push(`有 ${upcomingTasks.length} 个任务将在3天内到期，请留意截止日期`);
  }
  
  return suggestions.length > 0 ? suggestions : ['您的任务分配很均衡，继续保持！'];
}

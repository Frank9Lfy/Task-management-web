import { useRef, useState } from 'react';
import { getQuadrant, QUADRANT_CONFIG } from '@/types/task';
import type { Task } from '@/types/task';
import { motion, AnimatePresence } from 'framer-motion';

interface QuadrantChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onPositionSelect: (importance: number, urgency: number) => void;
  selectedPosition: { importance: number; urgency: number } | null;
}

export const QuadrantChart: React.FC<QuadrantChartProps> = ({
  tasks,
  onTaskClick,
  onPositionSelect,
  selectedPosition
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 转换为百分比 (0-100)
    const urgency = (x / rect.width) * 100;
    const importance = 100 - (y / rect.height) * 100;
    
    onPositionSelect(Math.max(0, Math.min(100, importance)), Math.max(0, Math.min(100, urgency)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative w-full aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100">
      {/* 坐标轴背景 - 正确的四象限布局 */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {/* 左上象限：重要不紧急 (重要性>50, 紧急性<50) */}
        <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-b-2 border-r-2 border-blue-200/50 relative group hover:from-blue-100/80 hover:to-cyan-100/80 transition-all duration-300">
          <div className="absolute top-6 left-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
              <span className="text-blue-700 font-bold text-base tracking-wide">重要不紧急</span>
            </div>
            <p className="text-blue-500 text-xs font-medium ml-5">计划执行 · 第二象限</p>
          </div>
          {/* 装饰性图标 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
            <svg className="w-24 h-24 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        
        {/* 右上象限：重要且紧急 (重要性>50, 紧急性>50) */}
        <div className="bg-gradient-to-bl from-red-50/80 to-rose-50/80 border-b-2 border-l-2 border-red-200/50 relative group hover:from-red-100/80 hover:to-rose-100/80 transition-all duration-300">
          <div className="absolute top-6 right-6 text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="text-red-700 font-bold text-base tracking-wide">重要且紧急</span>
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
            </div>
            <p className="text-red-500 text-xs font-medium mr-5">立即执行 · 第一象限</p>
          </div>
          {/* 装饰性图标 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
            <svg className="w-24 h-24 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
        </div>
        
        {/* 左下象限：不重要不紧急 (重要性<50, 紧急性<50) */}
        <div className="bg-gradient-to-tr from-gray-50/80 to-slate-50/80 border-t-2 border-r-2 border-gray-200/50 relative group hover:from-gray-100/80 hover:to-slate-100/80 transition-all duration-300">
          <div className="absolute bottom-6 left-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm" />
              <span className="text-gray-700 font-bold text-base tracking-wide">不重要不紧急</span>
            </div>
            <p className="text-gray-500 text-xs font-medium ml-5">尽量删除 · 第四象限</p>
          </div>
          {/* 装饰性图标 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
            <svg className="w-24 h-24 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
            </svg>
          </div>
        </div>
        
        {/* 右下象限：紧急不重要 (重要性<50, 紧急性>50) */}
        <div className="bg-gradient-to-tl from-amber-50/80 to-yellow-50/80 border-t-2 border-l-2 border-amber-200/50 relative group hover:from-amber-100/80 hover:to-yellow-100/80 transition-all duration-300">
          <div className="absolute bottom-6 right-6 text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="text-amber-700 font-bold text-base tracking-wide">紧急不重要</span>
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
            </div>
            <p className="text-amber-500 text-xs font-medium mr-5">委托他人 · 第三象限</p>
          </div>
          {/* 装饰性图标 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
            <svg className="w-24 h-24 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11h-4V7h2v4h2v2z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 坐标轴线 - 更精致的设计 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gray-400 to-transparent transform -translate-x-1/2 z-10" />
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent transform -translate-y-1/2 z-10" />
      
      {/* 中心点装饰 */}
      <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-md" />

      {/* 坐标轴标签 - 更美观 */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 text-gray-600 font-semibold text-sm tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
        重要性 ↑
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-600 font-semibold text-sm tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
        紧急性 →
      </div>

      {/* 点击区域 */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair z-30"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos(null)}
      >
        {/* 选中位置标记 */}
        {selectedPosition && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute w-5 h-5 border-3 border-purple-500 rounded-full bg-purple-300 shadow-lg"
            style={{
              left: `${selectedPosition.urgency}%`,
              top: `${100 - selectedPosition.importance}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-50" />
          </motion.div>
        )}

        {/* 鼠标跟随十字线 */}
        {mousePos && (
          <>
            <div 
              className="absolute w-full h-px bg-purple-300/50 pointer-events-none z-40"
              style={{ top: mousePos.y }}
            />
            <div 
              className="absolute h-full w-px bg-purple-300/50 pointer-events-none z-40"
              style={{ left: mousePos.x }}
            />
            {/* 坐标提示 */}
            <div 
              className="absolute bg-purple-600 text-white text-xs px-2 py-1 rounded-lg shadow-lg pointer-events-none z-50"
              style={{ 
                left: mousePos.x + 10, 
                top: mousePos.y - 30,
              }}
            >
              重要性: {Math.round(100 - (mousePos.y / (canvasRef.current?.clientHeight || 1)) * 100)} | 
              紧急性: {Math.round((mousePos.x / (canvasRef.current?.clientWidth || 1)) * 100)}
            </div>
          </>
        )}

        {/* 任务点 */}
        <AnimatePresence>
          {tasks.map((task) => {
            const quadrant = getQuadrant(task.importance, task.urgency);
            const config = QUADRANT_CONFIG[quadrant];
            
            return (
              <motion.div
                key={task.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: task.completed ? 0.3 : 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.5, zIndex: 100 }}
                className={`absolute cursor-pointer ${task.completed ? 'grayscale' : ''}`}
                style={{
                  left: `${task.urgency}%`,
                  top: `${100 - task.importance}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(task);
                }}
                onMouseEnter={() => setHoveredTask(task)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                <motion.div 
                  className={`w-5 h-5 rounded-full border-2 shadow-lg ${config.bgColor}`}
                  style={{ borderColor: config.color.replace('text-', '').replace('600', '500') }}
                  whileHover={{ boxShadow: '0 0 20px rgba(0,0,0,0.2)' }}
                />
                
                {/* 悬停提示 - 更美观 */}
                {hoveredTask?.id === task.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50"
                  >
                    <div className="bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl px-4 py-3 whitespace-nowrap shadow-2xl border border-gray-700">
                      <div className="font-semibold text-base mb-1">{task.title}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-300">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          重要性: {Math.round(task.importance)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-400" />
                          紧急度: {Math.round(task.urgency)}
                        </span>
                      </div>
                      {task.deadline && (
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-red-300 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          截止: {task.deadline.toLocaleDateString('zh-CN')}
                        </div>
                      )}
                      {/* 小三角 */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900/95" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 刻度标记 - 更精致 */}
      <div className="absolute bottom-1 left-0 w-full flex justify-between px-3 text-[11px] text-gray-400 font-medium">
        <span className="bg-white/60 px-1 rounded">0</span>
        <span className="bg-white/60 px-1 rounded">25</span>
        <span className="bg-white/60 px-1 rounded">50</span>
        <span className="bg-white/60 px-1 rounded">75</span>
        <span className="bg-white/60 px-1 rounded">100</span>
      </div>
      <div className="absolute left-1 top-0 h-full flex flex-col justify-between py-3 text-[11px] text-gray-400 font-medium">
        <span className="bg-white/60 px-1 rounded">100</span>
        <span className="bg-white/60 px-1 rounded">75</span>
        <span className="bg-white/60 px-1 rounded">50</span>
        <span className="bg-white/60 px-1 rounded">25</span>
        <span className="bg-white/60 px-1 rounded">0</span>
      </div>
    </div>
  );
};

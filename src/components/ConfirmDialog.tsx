import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Trash2, Save, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  type: 'delete' | 'save' | 'edit' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type,
  confirmText,
  cancelText = '取消'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
    onClose();
  };

  const config = {
    delete: {
      icon: <Trash2 className="w-12 h-12 text-red-500" />,
      confirmButton: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
      confirmText: confirmText || '确认删除',
      iconBg: 'bg-red-100'
    },
    save: {
      icon: <Save className="w-12 h-12 text-green-500" />,
      confirmButton: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      confirmText: confirmText || '确认保存',
      iconBg: 'bg-green-100'
    },
    edit: {
      icon: <Edit3 className="w-12 h-12 text-blue-500" />,
      confirmButton: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
      confirmText: confirmText || '确认修改',
      iconBg: 'bg-blue-100'
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
      confirmButton: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
      confirmText: confirmText || '确认',
      iconBg: 'bg-amber-100'
    }
  };

  const currentConfig = config[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mx-auto w-20 h-20 ${currentConfig.iconBg} rounded-full flex items-center justify-center mb-4`}
          >
            {currentConfig.icon}
          </motion.div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-11 text-base"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 h-11 text-base text-white ${currentConfig.confirmButton}`}
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {currentConfig.confirmText}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

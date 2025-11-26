import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 max-w-md w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: { id: string; title: string; description?: string; variant?: 'default' | 'destructive' | 'success' } }) {
  const { removeToast } = useToast();
  
  const variantStyles = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  };

  const handleRemove = () => {
    removeToast(toast.id);
  };

  return (
    <div
      className={`rounded-lg border shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right ${variantStyles[toast.variant || 'default']}`}
    >
      <div className="flex-1">
        <div className="font-semibold">{toast.title}</div>
        {toast.description && (
          <div className="text-sm mt-1 opacity-90">{toast.description}</div>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

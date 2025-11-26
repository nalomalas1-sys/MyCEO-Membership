import * as React from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string };

interface ToastState {
  toasts: Toast[];
}

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    default:
      return state;
  }
};

const ToastContext = React.createContext<{
  toasts: Toast[];
  dispatch: React.Dispatch<ToastAction>;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  const toast = React.useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      context.dispatch({
        type: 'ADD_TOAST',
        toast: { id, title, description, variant },
      });

      // Auto remove after 5 seconds
      setTimeout(() => {
        context.dispatch({ type: 'REMOVE_TOAST', id });
      }, 5000);
    },
    [context]
  );

  const removeToast = React.useCallback(
    (id: string) => {
      context.dispatch({ type: 'REMOVE_TOAST', id });
    },
    [context]
  );

  return { toast, toasts: context.toasts, removeToast };
}




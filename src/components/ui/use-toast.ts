// Simple toast implementation compatible with react-hot-toast
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Simple toast function that logs to console for now
// In a real app, you'd integrate with a toast library like react-hot-toast
export function toast({ title, description, variant }: ToastProps) {
  const message = title ? `${title}: ${description || ''}` : description || '';
  
  if (variant === 'destructive') {
    console.error('Toast Error:', message);
  } else {
    console.log('Toast:', message);
  }
  
  // Return a simple object to match expected interface
  return {
    id: Date.now().toString(),
    dismiss: () => {},
    update: () => {},
  };
}

// Hook that returns the toast function
export function useToast() {
  return {
    toast,
    dismiss: () => {},
    toasts: [],
  };
}

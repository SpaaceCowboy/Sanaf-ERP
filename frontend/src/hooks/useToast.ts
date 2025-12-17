// Simple toast hook for notifications
export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    // For now, use browser alert as a fallback
    // In production, you'd integrate with a proper toast library
    const message = description ? `${title}: ${description}` : title;

    if (variant === 'destructive') {
      console.error(message);
      alert(`Error: ${message}`);
    } else {
      console.log(message);
      alert(message);
    }
  };

  return { toast };
}

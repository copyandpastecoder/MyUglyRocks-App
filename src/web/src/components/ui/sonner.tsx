"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand={true}
      richColors={true}
      closeButton={true}
      duration={4000}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-emerald-500/10 group-[.toaster]:!border-emerald-500/20 group-[.toaster]:!text-emerald-600 dark:group-[.toaster]:!text-emerald-400",
          error: "group-[.toaster]:!bg-red-500/10 group-[.toaster]:!border-red-500/20 group-[.toaster]:!text-red-600 dark:group-[.toaster]:!text-red-400",
          warning: "group-[.toaster]:!bg-amber-500/10 group-[.toaster]:!border-amber-500/20 group-[.toaster]:!text-amber-600 dark:group-[.toaster]:!text-amber-400",
          info: "group-[.toaster]:!bg-blue-500/10 group-[.toaster]:!border-blue-500/20 group-[.toaster]:!text-blue-600 dark:group-[.toaster]:!text-blue-400",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

// Helper functions for common toast patterns
const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

export { Toaster, showToast, toast }

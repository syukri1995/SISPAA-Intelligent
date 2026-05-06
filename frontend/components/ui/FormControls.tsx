"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-xs text-slate-500", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
        "outline-none placeholder:text-slate-400",
        "focus:border-transparent focus:ring-2 focus:ring-gov-accent",
        "disabled:bg-slate-50 disabled:text-slate-600",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
        "outline-none placeholder:text-slate-400",
        "focus:border-transparent focus:ring-2 focus:ring-gov-accent",
        "disabled:bg-slate-50 disabled:text-slate-600",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
        "outline-none",
        "focus:border-transparent focus:ring-2 focus:ring-gov-accent",
        "disabled:bg-slate-50 disabled:text-slate-600",
        className
      )}
      {...props}
    />
  );
}


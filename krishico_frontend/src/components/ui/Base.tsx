import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-slate-100 rounded-2xl shadow-sm p-6", className)}>
        {children}
    </div>
);

export const Button = ({
    children,
    variant = 'primary',
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }) => {
    const variants = {
        primary: "bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-100",
        secondary: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100",
        outline: "border-2 border-green-700 text-green-700 hover:bg-green-50"
    };

    return (
        <button
            className={cn(
                "px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = ({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>}
        <input
            className={cn(
                "px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all",
                error && "border-red-300 bg-red-50 focus:ring-red-500/10 focus:border-red-500"
            )}
            {...props}
        />
        {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
);

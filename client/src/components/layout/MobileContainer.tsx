import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MobileContainerProps {
    children: React.ReactNode;
    className?: string;
    /** If true, adds subtle background pattern */
    withPattern?: boolean;
    /** If true, centers content vertically */
    centered?: boolean;
    /** Max width breakpoint: 'mobile' = 420px, 'tablet' = 768px, 'laptop' = 1024px */
    maxWidth?: "mobile" | "tablet" | "laptop";
}

/**
 * MobileContainer - Premium mobile-first layout wrapper
 * 
 * Enforces tablet-max width on desktop (768px by default)
 * for consistent mobile experience across all devices
 */
export function MobileContainer({
    children,
    className,
    withPattern = false,
    centered = false,
    maxWidth = "tablet",
}: MobileContainerProps) {
    const maxWidthClasses = {
        mobile: "max-w-[420px]",
        tablet: "max-w-[768px]",
        laptop: "max-w-[1024px]",
    };

    return (
        <div
            className={cn(
                "w-full min-h-screen bg-background relative",
                withPattern && "mobile-pattern",
                className
            )}
        >
            <div
                className={cn(
                    "mx-auto px-4 sm:px-6",
                    maxWidthClasses[maxWidth],
                    centered && "flex flex-col items-center justify-center min-h-screen"
                )}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * AnimatedPage - Wrapper with page transition animations
 */
export function AnimatedPage({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * GlassCard - Premium glassmorphism card component
 */
export function GlassCard({
    children,
    className,
    hover = true,
}: {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}) {
    return (
        <motion.div
            whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
            whileTap={hover ? { scale: 0.99 } : undefined}
            className={cn(
                "bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg shadow-slate-200/50",
                "transition-all duration-300",
                hover && "hover:shadow-xl hover:shadow-slate-200/60 hover:border-white/80",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

/**
 * PremiumGradient - Gradient background component
 */
export function PremiumGradient({
    children,
    className,
    variant = "blue",
}: {
    children?: React.ReactNode;
    className?: string;
    variant?: "blue" | "purple" | "green" | "orange" | "sunset";
}) {
    const gradients = {
        blue: "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700",
        purple: "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700",
        green: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700",
        orange: "bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600",
        sunset: "bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600",
    };

    return (
        <div className={cn(gradients[variant], "text-white", className)}>
            {children}
        </div>
    );
}

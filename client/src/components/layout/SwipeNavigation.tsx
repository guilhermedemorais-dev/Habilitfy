import { motion, useDragControls, PanInfo } from "framer-motion";
import { useLocation } from "wouter";
import { useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getNavItems } from "@/components/layout/navigation";

interface SwipeNavigationProps {
    children: ReactNode;
}

export function SwipeNavigation({ children }: SwipeNavigationProps) {
    const [location, setLocation] = useLocation();
    const { user } = useAuth();
    const navItems = getNavItems(user?.role);
    const dragControls = useDragControls();

    const currentIndex = navItems.findIndex((item) => item.href === location);

    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const SWIPE_THRESHOLD = 50;
            const VELOCITY_THRESHOLD = 500;

            const isSignificantSwipe =
                Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
                Math.abs(info.velocity.x) > VELOCITY_THRESHOLD;

            if (!isSignificantSwipe) return;

            const direction = info.offset.x > 0 ? -1 : 1;
            const nextIndex = currentIndex + direction;

            if (nextIndex >= 0 && nextIndex < navItems.length) {
                setLocation(navItems[nextIndex].href);
            }
        },
        [currentIndex, navItems, setLocation]
    );

    // Disable swipe on routes that don't have BottomNav
    const isSwipeEnabled =
        currentIndex !== -1 &&
        !location.startsWith("/login") &&
        !location.startsWith("/cadastro") &&
        !location.startsWith("/signup") &&
        !location.startsWith("/admin") &&
        !location.startsWith("/instrutor/");

    if (!isSwipeEnabled) {
        return <>{children}</>;
    }

    return (
        <motion.div
            drag="x"
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="min-h-screen touch-pan-y"
            style={{ touchAction: "pan-y" }}
        >
            {children}
        </motion.div>
    );
}

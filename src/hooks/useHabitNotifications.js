import { useState, useEffect, useCallback, useRef } from 'react';

const REMINDER_STORAGE_KEY = 'habitflow_reminder_shown_date';

/**
 * Hook to manage habit completion notifications.
 * Shows at most one in-app reminder per day to avoid overlapping toasts.
 */
export const useHabitNotifications = (habits, config) => {
    const [toasts, setToasts] = useState([]);
    const reminderShownRef = useRef(false);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const checkHabits = useCallback(async () => {
        if (!config?.notificationsEnabled || habits.length === 0) return;

        const today = new Date().toISOString().split('T')[0];
        const unloggedGoodHabits = habits.filter(h =>
            h.type === 'Good' &&
            !h.logs.some(l => l.date === today)
        );

        if (unloggedGoodHabits.length > 0) {
            // Show in-app reminder only once per day (no stacking/overlap)
            const lastShown = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(REMINDER_STORAGE_KEY) : null;
            if (lastShown !== today && !reminderShownRef.current) {
                reminderShownRef.current = true;
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(REMINDER_STORAGE_KEY, today);
                const names = unloggedGoodHabits.map(h => h.name).join(', ');
                const message = `Reminder: You haven't logged ${names} today. Keep the flow!`;
                addToast(message, 'reminder');
            }

            if (Notification.permission === 'granted') {
                new Notification('AurisTitutum PRO', {
                    body: `Reminder: You haven't logged ${unloggedGoodHabits.map(h => h.name).join(', ')} today. Keep the flow!`,
                    icon: '/favicon.ico'
                });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification('AurisTitutum PRO', {
                        body: `Reminder: You haven't logged ${unloggedGoodHabits.map(h => h.name).join(', ')} today. Keep the flow!`,
                        icon: '/favicon.ico'
                    });
                }
            }
        }
    }, [habits, config, addToast]);

    // Request notification permission on mount so reminders work everywhere
    useEffect(() => {
        if (config?.notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [config?.notificationsEnabled]);

    // Check on mount and periodically (every 60 min) and when window gains focus
    useEffect(() => {
        const run = () => setTimeout(checkHabits, 2000);
        run();
        const interval = setInterval(run, 60 * 60 * 1000);
        const onFocus = () => run();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [checkHabits]);

    return { toasts, removeToast, addToast };
};

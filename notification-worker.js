// Notification Worker - Handles background scheduled notifications
// This worker runs independently and can send notifications even when the main app is closed

const NOTIFICATION_STORE = 'scheduled-notifications';

// Store for scheduled notifications
let scheduledNotifications = [];

// Notification templates
const notificationTemplates = {
    urgent: (task) => {
        const messages = [
            `Get off your lazy ass and ${task} already.`,
            `You've had all day. Just ${task}. Now.`,
            `Reminder: You said you'd ${task} like... forever ago.`,
            `The world might end before you ${task}, huh?`,
            `Oh look, another chance to actually ${task}. Will you take it?`,
            `If you don't ${task} soon, I'm judging you.`,
            `Hey genius, it's time to ${task}.`,
            `Just pretend ${task} is something fun and do it.`,
            `Prove you're better than your snooze button: ${task}.`,
            `Literally no excuse left — just ${task}.`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    },
    medium: (task) => {
        const messages = [
            `Hey, remember ${task}? Yeah, me too.`,
            `Could be a good time to ${task}, just sayin'.`,
            `Not urgent or anything, but maybe ${task}?`,
            `You'll feel 2% more productive if you ${task}.`,
            `If you're bored, why not ${task}?`,
            `Imagine how smug you'll feel after you ${task}.`,
            `Mildly suggesting that you ${task} now.`,
            `A totally reasonable time to maybe ${task}.`,
            `Statistically speaking, this is a great moment to ${task}.`,
            `Somewhere out there, a better version of you already ${task}.`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    },
    low: (task) => {
        const messages = [
            `idk... maybe ${task} or something.`,
            `When you get around to it, ${task} might be nice.`,
            `No rush, but ${task} is a thing that exists.`,
            `Someday, someone might want you to ${task}.`,
            `Just throwing this out there: ${task}.`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
};

// Load scheduled notifications from storage
function loadScheduledNotifications() {
    try {
        const stored = localStorage.getItem(NOTIFICATION_STORE);
        scheduledNotifications = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading scheduled notifications:', error);
        scheduledNotifications = [];
    }
}

// Save scheduled notifications to storage
function saveScheduledNotifications() {
    try {
        localStorage.setItem(NOTIFICATION_STORE, JSON.stringify(scheduledNotifications));
    } catch (error) {
        console.error('Error saving scheduled notifications:', error);
    }
}

// Add a scheduled notification
function scheduleNotification(task) {
    if (!task.reminderTime || task.completed || task.notificationSent) {
        return;
    }

    const reminderDate = new Date(task.reminderTime);
    const now = new Date();

    if (reminderDate <= now) {
        return;
    }

    const notification = {
        id: task.id,
        taskTitle: task.title,
        priority: task.priority,
        reminderTime: task.reminderTime,
        scheduled: true
    };

    // Remove existing notification for this task
    scheduledNotifications = scheduledNotifications.filter(n => n.id !== task.id);
    
    // Add new notification
    scheduledNotifications.push(notification);
    saveScheduledNotifications();

    console.log('Notification scheduled for:', task.title, 'at', reminderDate);
}

// Remove a scheduled notification
function cancelScheduledNotification(taskId) {
    scheduledNotifications = scheduledNotifications.filter(n => n.id !== taskId);
    saveScheduledNotifications();
}

// Check for due notifications
function checkDueNotifications() {
    const now = new Date();
    const dueNotifications = scheduledNotifications.filter(n => {
        const reminderTime = new Date(n.reminderTime);
        return reminderTime <= now && n.scheduled;
    });

    dueNotifications.forEach(notification => {
        sendNotification(notification);
        // Mark as sent
        const index = scheduledNotifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
            scheduledNotifications[index].scheduled = false;
        }
    });

    if (dueNotifications.length > 0) {
        saveScheduledNotifications();
    }
}

// Send a notification
function sendNotification(notification) {
    try {
        const title = "Hey, you!";
        const body = notificationTemplates[notification.priority](notification.taskTitle);

        if ('serviceWorker' in navigator && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        body: body,
                        icon: './icon-192x192.png',
                        badge: './badge.png',
                        data: { taskId: notification.id },
                        requireInteraction: true,
                        vibrate: [200, 100, 200, 100, 200, 100, 200],
                        tag: `task-${notification.id}`,
                        renotify: true,
                        actions: [
                            {
                                action: 'complete',
                                title: 'Mark Complete',
                                icon: './icon-120x120.png'
                            },
                            {
                                action: 'dismiss',
                                title: 'Dismiss',
                                icon: './icon-87x87.png'
                            }
                        ]
                    });
                });
            }
        }

        console.log('Notification sent:', notification.taskTitle);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Initialize notification system
function initNotificationWorker() {
    loadScheduledNotifications();
    
    // Check for due notifications every 10 seconds for better responsiveness
    setInterval(checkDueNotifications, 10000);
    
    // Also check immediately
    checkDueNotifications();
}

// Expose functions for main app
if (typeof window !== 'undefined') {
    window.notificationWorker = {
        schedule: scheduleNotification,
        cancel: cancelScheduledNotification,
        init: initNotificationWorker
    };
}

// Auto-initialize if this script is loaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationWorker);
    } else {
        initNotificationWorker();
    }
} 
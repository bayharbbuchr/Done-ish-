// DOM Elements
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const reminderTime = document.getElementById('reminderTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const taskLists = {
    urgent: document.getElementById('urgentTasks'),
    medium: document.getElementById('mediumTasks'),
    low: document.getElementById('lowTasks')
};
const toast = document.getElementById('toast');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

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

// Completion messages
const completionMessages = [
    "Cool, guess you finally decided to be productive...",
    "Miracles do happen.",
    "Well, color me surprised.",
    "Shocking development: you did a thing.",
    "Mark this date in history — someone finished a task.",
    "👏 You did it. Want a cookie?",
    "One small click for you, one giant leap for laziness.",
    "Honestly didn't think you had it in you.",
    "Wow. A round of applause from your future self.",
    "Is that... growth I see?",
    "Good job! Now go lie down for 6 hours.",
    "Are you... okay? You completed something.",
    "Somewhere, a productivity coach just smiled.",
    "I'm shook. You finished a thing.",
    "I'll be damned. You actually did it.",
    "Did it hurt? Being this responsible?",
    "I'm not crying, you're crying.",
    "This deserves a parade. A very tiny, imaginary parade.",
    "You beat the procrastination boss.",
    "Don't get cocky, you still have more to do."
];

// Initialize the app
function init() {
    loadTasks();
    setupEventListeners();
    checkNotificationPermission();
    scheduleNotifications();
}

// Load tasks from localStorage
function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Set up event listeners
function setupEventListeners() {
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js', { 
                scope: './' 
            })
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                // Check if there's a new service worker waiting
                if (registration.waiting) {
                    console.log('New service worker found, consider updating');
                    // You could add UI to prompt user to update
                }
            })
            .catch(error => {
                console.error('ServiceWorker registration failed: ', error);
            });
            
            // Check for updates to the service worker
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'COMPLETE_TASK') {
                toggleTaskComplete(event.data.taskId);
            }
        });
    }
}

// Add a new task
function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;

    const task = {
        id: Date.now().toString(),
        title,
        priority: prioritySelect.value,
        reminderTime: reminderTime.value ? new Date(reminderTime.value).toISOString() : null,
        notificationSent: false,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    
    // Schedule notification using the original method
    scheduleNotification(task);
    
    // Reset form
    taskInput.value = '';
    reminderTime.value = '';
    taskInput.focus();

    showToast('Task added. Good luck with that.');
}

// Render tasks based on current filter
function renderTasks() {
    // Clear all task lists
    Object.values(taskLists).forEach(list => {
        list.innerHTML = '';
    });

    // Filter tasks
    let filteredTasks = [...tasks];
    
    if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (currentFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === currentFilter);
    }

    // Sort tasks: incomplete first, then by priority, then by creation time
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        const priorityOrder = { urgent: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Render each task
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskLists[task.priority].appendChild(taskElement);
    });
}

// Create a task element
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskTitle = document.createElement('span');
    taskTitle.className = 'task-title';
    taskTitle.textContent = task.title;
    
    taskContent.appendChild(taskTitle);

    // Add due date if exists
    if (task.reminderTime) {
        const dueDate = document.createElement('div');
        dueDate.className = 'task-due';
        dueDate.textContent = `Due: ${formatDate(new Date(task.reminderTime))}`;
        taskContent.appendChild(dueDate);
    }

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';
    
    const completeBtn = document.createElement('button');
    completeBtn.className = 'complete-btn';
    completeBtn.innerHTML = task.completed ? 
        '<span class="material-icons">undo</span>' : 
        '<span class="material-icons">check</span>';
    
    completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskComplete(task.id);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    taskActions.appendChild(completeBtn);
    taskActions.appendChild(deleteBtn);
    
    li.appendChild(taskContent);
    li.appendChild(taskActions);
    
    // Toggle completion on task click
    li.addEventListener('click', () => {
        toggleTaskComplete(task.id);
    });
    
    return li;
}

// Toggle task completion
function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    const wasCompleted = task.completed;
    
    // Toggle completion status
    task.completed = !wasCompleted;
    
    if (task.completed && !wasCompleted) {
        // If task was just marked as completed
        task.completedAt = new Date().toISOString();
        showRandomCompletionMessage();
        
        // Cancel any pending notification
        if (task.reminderTime && !task.notificationSent) {
            cancelScheduledNotification(task.id);
            task.notificationSent = true;
        }
    } else if (!task.completed && wasCompleted) {
        // If task was unmarked as completed
        task.completedAt = null;
        
        // Reschedule notification if there's a reminder time
        if (task.reminderTime) {
            scheduleNotification(task);
        }
    }
    
    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    
    // Cancel any pending notification
    if (task.reminderTime && !task.notificationSent) {
        cancelScheduledNotification(task.id);
    }
    
    tasks.splice(taskIndex, 1);
    saveTasks();
    renderTasks();
    
    showToast('Task deleted. Out of sight, out of mind, right?');
}

// Show a random completion message
function showRandomCompletionMessage() {
    const message = completionMessages[Math.floor(Math.random() * completionMessages.length)];
    showToast(message);
}

// Show toast notification
function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Format date for display
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Check notification permission
function checkNotificationPermission() {
    if (Notification.permission === 'default') {
        // We'll request permission when the user tries to set a reminder
        console.log('Notification permission not yet granted');
    } else if (Notification.permission === 'granted') {
        console.log('Notification permission already granted');
    } else {
        console.log('Notification permission denied');
    }
    
    // Add a mobile-specific check
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Push notifications are supported');
    } else {
        console.log('Push notifications may not be fully supported on this device');
    }
}

// Schedule a notification for a task
async function scheduleNotification(task) {
    // Skip if no reminder time or notification already sent
    if (!task.reminderTime || task.completed || task.notificationSent) {
        return;
    }
    
    const reminderDate = new Date(task.reminderTime);
    const now = new Date();
    
    // Skip if reminder time is in the past
    if (reminderDate <= now) {
        task.notificationSent = true;
        saveTasks();
        return;
    }
    
    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                showToast('Enable notifications to receive reminders!');
                return;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return;
        }
    }
    
    // Wait for service worker to be ready
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            if (!registration) {
                console.error('Service worker not ready');
                return;
            }
        } catch (error) {
            console.error('Service worker error:', error);
            return;
        }
    }
    
    // Schedule the notification
    const delay = reminderDate.getTime() - now.getTime();
    
    // Store the timeout ID so we can cancel it if needed
    const timeoutId = setTimeout(async () => {
        try {
            // Only send if task is not completed
            const currentTask = tasks.find(t => t.id === task.id);
            if (!currentTask || currentTask.completed || currentTask.notificationSent) {
                return;
            }
            
            const notificationTitle = `Hey, you!`;
            const notificationBody = notificationTemplates[task.priority](task.title);
            
            // Show notification using service worker
            if ('serviceWorker' in navigator) {
                console.log('Attempting to show notification:', notificationTitle, notificationBody);
                const registration = await navigator.serviceWorker.ready;
                console.log('Service worker ready, showing notification');
                await registration.showNotification(notificationTitle, {
                    body: notificationBody,
                    icon: './icon-192x192.png',
                    badge: './badge.png',
                    data: { taskId: task.id },
                    requireInteraction: true,
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    tag: `task-${task.id}`,
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
            } else {
                // Fallback for browsers that don't support service workers
                new Notification(notificationTitle, {
                    body: notificationBody,
                    icon: './icon-192x192.png',
                    tag: `task-${task.id}`
                });
            }
            
            // Mark notification as sent
            currentTask.notificationSent = true;
            saveTasks();
            
        } catch (error) {
            console.error('Error showing notification:', error);
        }
        
    }, delay); // Use actual delay time
    
    // Store timeout ID for potential cancellation
    if (!window.notificationTimeouts) {
        window.notificationTimeouts = {};
    }
    window.notificationTimeouts[task.id] = timeoutId;
}

// Cancel a scheduled notification
function cancelScheduledNotification(taskId) {
    // Cancel the timeout if it exists
    if (window.notificationTimeouts && window.notificationTimeouts[taskId]) {
        clearTimeout(window.notificationTimeouts[taskId]);
        delete window.notificationTimeouts[taskId];
        console.log('Cancelled timeout for task:', taskId);
    }
    
    // Mark task as notification not sent
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.notificationSent = false;
        saveTasks();
    }
}

// Schedule all pending notifications
function scheduleNotifications() {
    console.log('Scheduling pending notifications...');
    tasks.forEach(task => {
        if (task.reminderTime && !task.completed && !task.notificationSent) {
            console.log('Scheduling notification for:', task.title);
            scheduleNotification(task);
        }
    });
}

// Test function for mobile notifications (can be called from console)
window.testNotification = async function() {
    try {
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Permission denied');
                return;
            }
        }
        
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('Test Notification', {
                body: 'This is a test notification to check if mobile notifications work',
                icon: './icon-192x192.png',
                badge: './badge.png',
                requireInteraction: true,
                vibrate: [200, 100, 200],
                tag: 'test-notification'
            });
            console.log('Test notification sent via service worker');
        } else {
            new Notification('Test Notification', {
                body: 'This is a test notification (fallback)',
                icon: './icon-192x192.png'
            });
            console.log('Test notification sent via Notification API');
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
    }
};

// Test function for background notifications
window.testBackgroundNotification = async function() {
    try {
        // Create a test task with a reminder in 30 seconds
        const testTask = {
            id: 'test-' + Date.now(),
            title: 'Test Background Task',
            priority: 'urgent',
            reminderTime: new Date(Date.now() + 30000).toISOString(), // 30 seconds from now
            completed: false,
            notificationSent: false
        };
        
        // Add to both systems
        scheduleNotification(testTask);
        if (window.notificationWorker) {
            window.notificationWorker.schedule(testTask);
            console.log('Background notification scheduled for 30 seconds from now');
            showToast('Test background notification scheduled! Close the app and wait 30 seconds.');
        } else {
            console.log('Notification worker not available, using fallback');
        }
    } catch (error) {
        console.error('Error scheduling background notification:', error);
    }
};

// Quick immediate test (5 seconds)
window.testQuickNotification = async function() {
    try {
        const testTask = {
            id: 'quick-' + Date.now(),
            title: 'Quick Test',
            priority: 'urgent',
            reminderTime: new Date(Date.now() + 5000).toISOString(), // 5 seconds from now
            completed: false,
            notificationSent: false
        };
        
        scheduleNotification(testTask);
        console.log('Quick notification scheduled for 5 seconds from now');
        showToast('Quick test notification in 5 seconds!');
    } catch (error) {
        console.error('Error scheduling quick notification:', error);
    }
};

// Super simple test - immediate notification
window.testImmediateNotification = async function() {
    try {
        console.log('Current permission:', Notification.permission);
        
        if (Notification.permission !== 'granted') {
            showToast('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('Permission result:', permission);
            
            if (permission !== 'granted') {
                showToast('❌ Permission denied - notifications won\'t work');
                return;
            } else {
                showToast('✅ Permission granted! Testing notification...');
            }
        }
        
        // Try PWA-style notification first (service worker)
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('PWA Test Notification', {
                body: 'This notification was sent via Service Worker for PWA compatibility',
                icon: './icon-192x192.png',
                badge: './badge.png',
                requireInteraction: true,
                vibrate: [200, 100, 200],
                tag: 'immediate-test'
            });
            console.log('PWA notification sent via Service Worker');
            showToast('PWA notification sent!');
        } else {
            // Fallback - direct notification
            new Notification('Fallback Test', {
                body: 'This is a fallback notification test',
                icon: './icon-192x192.png'
            });
            console.log('Fallback notification sent');
            showToast('Fallback notification sent');
        }
    } catch (error) {
        console.error('Error with notification:', error);
        showToast('Error: ' + error.message);
    }
};

// Request notification permission
window.requestNotificationPermission = async function() {
    try {
        showToast('Requesting notification permission...');
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            showToast('✅ Notifications enabled! You can now set reminders.');
            
            // Test a simple notification
            setTimeout(() => {
                new Notification('Done(ish) Notifications Enabled!', {
                    body: 'You can now receive reminders for your tasks.',
                    icon: './icon-192x192.png'
                });
            }, 1000);
            
        } else if (permission === 'denied') {
            showToast('❌ Notifications blocked. Check your browser settings.');
        } else {
            showToast('⚠️ Permission request dismissed.');
        }
        
        console.log('Permission result:', permission);
        
    } catch (error) {
        console.error('Permission request error:', error);
        showToast('Error requesting permissions: ' + error.message);
    }
};

// Complete debugging function - shows results in UI for iPhone users
window.debugNotifications = function() {
    let results = [];
    
    // Check basic support
    results.push('📱 DEVICE INFO:');
    results.push(`iOS: ${/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'YES' : 'NO'}`);
    results.push(`Android: ${/Android/.test(navigator.userAgent) ? 'YES' : 'NO'}`);
    results.push(`PWA Mode: ${window.matchMedia('(display-mode: standalone)').matches ? 'YES' : 'NO'}`);
    
    results.push('\n🔔 NOTIFICATION SUPPORT:');
    results.push(`Notifications: ${'Notification' in window ? 'YES' : 'NO'}`);
    results.push(`Permission: ${Notification.permission}`);
    results.push(`Service Worker: ${'serviceWorker' in navigator ? 'YES' : 'NO'}`);
    
    results.push('\n🌐 ENVIRONMENT:');
    results.push(`HTTPS: ${location.protocol === 'https:' ? 'YES' : 'NO'}`);
    results.push(`URL: ${location.hostname}`);
    
         // Permission and iPhone-specific message
     if (Notification.permission === 'default') {
         results.push('\n⚠️ PERMISSION NEEDED:');
         results.push('Click "Enable Notifications" button first!');
         results.push('You must grant permission for notifications to work.');
     }
     
     if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
         results.push('\n📱 IPHONE NOTES:');
         if (Notification.permission === 'default') {
             results.push('1. First: Click "Enable Notifications" button');
             results.push('2. Grant permission when prompted');
             results.push('3. Then test notifications');
         } else if (Notification.permission === 'granted') {
             results.push('Permission granted ✅');
             results.push('However: iPhone PWAs have limited notification support.');
             results.push('Background notifications may not work reliably.');
         } else {
             results.push('Permission denied ❌');
             results.push('Go to Settings > Safari > Notifications to enable.');
         }
         
         if (window.matchMedia('(display-mode: standalone)').matches) {
             results.push('Note: You\'re in PWA mode - some limitations apply.');
         }
     }
    
    // Create a popup-style display
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #000;
        color: #fff;
        padding: 20px;
        border-radius: 10px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 10000;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-line;
        box-shadow: 0 0 20px rgba(0,0,0,0.8);
    `;
    
    debugDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <strong>🔍 NOTIFICATION DEBUG RESULTS</strong>
        </div>
        ${results.join('\n')}
        <div style="text-align: center; margin-top: 15px;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(debugDiv);
    
    // Also log to console for desktop users
    console.log('=== PWA DEBUG RESULTS ===');
    results.forEach(result => console.log(result));
    
    // Try a simple test for iPhone
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && Notification.permission === 'granted') {
        setTimeout(() => {
            try {
                new Notification('iPhone Test', {
                    body: 'Testing if iPhone notifications work at all...'
                });
                showToast('iPhone notification attempted');
            } catch (error) {
                showToast('iPhone notification failed: ' + error.message);
            }
        }, 1000);
    }
};

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

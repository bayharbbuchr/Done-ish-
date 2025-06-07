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
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.error('ServiceWorker registration failed: ', err);
                });
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
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return;
        }
    }
    
    // Register service worker if not already registered
    if (!navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        if (!registration) {
            console.error('Service worker not registered');
            return;
        }
    }
    
    // Schedule the notification
    const delay = reminderDate.getTime() - now.getTime();
    
    // For demo purposes, we'll show the notification after a short delay
    // In a real app, you would use the Push API with a backend service
    setTimeout(() => {
        // Only send if task is not completed
        const currentTask = tasks.find(t => t.id === task.id);
        if (!currentTask || currentTask.completed || currentTask.notificationSent) {
            return;
        }
        
        const notificationTitle = `Hey, you!`;
        const notificationBody = notificationTemplates[task.priority](task.title);
        
        // Show notification
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(notificationTitle, {
                    body: notificationBody,
                    icon: '/icon-192x192.png',
                    badge: '/badge.png',
                    data: { taskId: task.id },
                    requireInteraction: true,
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                });
            });
        } else {
            // Fallback for browsers that don't support service workers
            new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/icon-192x192.png'
            });
        }
        
        // Mark notification as sent
        currentTask.notificationSent = true;
        saveTasks();
        
    }, Math.min(delay, 10000)); // Cap at 10 seconds for demo purposes
}

// Cancel a scheduled notification
function cancelScheduledNotification(taskId) {
    // In a real app, you would cancel the notification with the Push API
    // For this demo, we're just marking it as not sent
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.notificationSent = false;
        saveTasks();
    }
}

// Schedule all pending notifications
function scheduleNotifications() {
    tasks.forEach(task => {
        if (task.reminderTime && !task.completed && !task.notificationSent) {
            scheduleNotification(task);
        }
    });
}

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

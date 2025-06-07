# Done(ish) - The Guilt Trip To-Do App

A Progressive Web App (PWA) to-do list with a side of sarcasm. Because sometimes you need a little guilt to get things done.

## Features

- **Task Management**: Add, edit, and delete tasks with different priorities
- **Sarcastic Notifications**: Get roasted into productivity with humorous reminders
- **Offline Support**: Works even when you're offline (just like your motivation)
- **Installable**: Add to your home screen on any device
- **Responsive Design**: Looks great on mobile, tablet, and desktop
- **Dark Mode**: Easy on the eyes, just like avoiding work

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- For development: Node.js and npm (optional)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/done-ish.git
   cd done-ish
   ```

2. For local development (optional):
   ```bash
   # Install http-server if you don't have it
   npm install -g http-server
   
   # Start the server
   http-server -p 3000
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Using the App

1. **Add a task**: Type your task in the input field, select a priority, and optionally set a reminder time.
2. **Complete a task**: Click on a task to mark it as complete and receive a sarcastic message.
3. **Filter tasks**: Use the filter buttons to view tasks by priority or completion status.
4. **Get reminded**: Set a reminder time to receive a push notification (if you've granted permission).
5. **Install the app**: Look for the install button in your browser to add the app to your home screen.

## Browser Support

- Chrome 50+
- Firefox 44+
- Safari 16.4+ (iOS 16.4+)
- Edge 17+
- Opera 37+

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Service Workers for offline functionality
- Web Push API for notifications
- IndexedDB for local storage
- PWA features (Web App Manifest, Service Worker)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by all the to-do lists we've started and never finished
- Built with ❤️ and a healthy dose of sarcasm
- Special thanks to caffeine for making this possible

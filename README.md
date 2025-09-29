# 🐻‍❄️ Polar Bear Chatbot - Arctic Intake Assistant

A responsive, AI-powered chatbot that simulates conversations with a polar bear for Arctic intake processes. Built with modern web technologies and integrated with OpenRouter (DeepSeek AI) for dynamic, intelligent responses.

## ✨ Features

- **🤖 AI-Powered Responses**: Integration with OpenRouter (DeepSeek AI) for intelligent, contextual conversations
- **📱 Fully Responsive**: Beautiful, modern UI that works on all devices
- **💾 Local Database**: IndexedDB for storing conversations and settings offline
- **🔄 Real-time Chat**: Smooth typing indicators and message animations
- **⚙️ Configurable Settings**: Toggle AI mode, auto-save, and API key management
- **📊 Analytics**: Track conversation patterns and usage statistics
- **💾 Export/Import**: Save and share conversation transcripts
- **🌐 Offline Support**: Service worker for offline functionality
- **🎨 Modern UI**: Clean, Arctic-themed design with smooth animations

## 🚀 Quick Start

### Option 1: Simple Setup (No AI)
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start chatting with Polar using fallback responses!

### Option 2: Full AI Setup
1. Get an OpenRouter API key from [OpenRouter](https://openrouter.ai/keys) (Free access to DeepSeek AI)
2. Open the chatbot in your browser
3. Click the "Settings" button
4. Enter your OpenRouter API key
5. Toggle "AI Mode" on
6. Enjoy intelligent conversations with Polar!

## 🛠️ Development Setup

### Prerequisites
- Python 3.x (for local server)
- Modern web browser with IndexedDB support
- OpenRouter API key (optional, for AI features - free access to DeepSeek AI)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/polar-bear-chatbot.git
cd polar-bear-chatbot

# Start local development server
python -m http.server 8000

# Or use Node.js if you prefer
npx http-server -p 8000
```

### File Structure
```
polar-bear-chatbot/
├── index.html              # Main HTML file
├── js/
│   ├── app.js              # Main application controller
│   ├── chat-manager.js     # Chat functionality and UI
│   ├── database.js         # IndexedDB database manager
│   └── ai-service.js       # OpenAI API integration
├── sw.js                   # Service worker for offline support
├── package.json            # Project configuration
└── README.md              # This file
```

## 🔧 Configuration

### AI Settings
- **Model**: DeepSeek Chat (via OpenRouter)
- **Max Tokens**: 500 (adjustable)
- **Temperature**: 0.8 (for creative responses)
- **API Key**: Stored securely in local database

### Database Settings
- **Storage**: IndexedDB (browser-native)
- **Auto-save**: Enabled by default
- **Session Management**: Automatic session tracking
- **Data Export**: JSON format with full conversation history

## 🎯 Usage

### Basic Chat
1. Type your message in the input field
2. Press Enter or click Send
3. Polar will respond based on your question

### Quick Actions
Click on the suggested questions to quickly start conversations:
- "What's your name?"
- "Where do you live?"
- "What do you eat?"
- "What are your special skills?"

### Settings Panel
- **AI Mode**: Toggle between AI responses and fallback responses
- **Auto-save**: Automatically save conversations to local database
- **API Key**: Enter your OpenRouter API key for AI features

### Export/Import
- **Export**: Download conversation transcripts as JSON
- **Reset**: Start a new conversation
- **Analytics**: View conversation statistics

## 🧠 AI Integration

### OpenRouter API (DeepSeek AI)
The chatbot integrates with OpenRouter to access DeepSeek AI for intelligent responses. When AI mode is enabled:

- Responses are generated dynamically based on conversation context
- The AI maintains Polar's personality and Arctic knowledge
- Fallback responses are used if the API is unavailable
- Free access to DeepSeek AI through OpenRouter

### Fallback System
When AI is not available, the chatbot uses a sophisticated fallback system:
- Topic detection based on keywords
- Pre-written responses for common Arctic topics
- Random selection for variety
- Maintains Polar's personality

## 🎨 Customization

### Styling
The app uses CSS custom properties for easy theming:
```css
:root {
  --primary-color: #2196f3;
  --secondary-color: #21cbf3;
  --accent-color: #ff6b6b;
  /* ... more variables */
}
```

### Adding New Topics
Edit `js/ai-service.js` to add new conversation topics:
```javascript
const topicKeywords = {
  newTopic: ['keyword1', 'keyword2', 'keyword3']
};

const fallbackResponses = {
  newTopic: [
    "Response 1",
    "Response 2",
    "Response 3"
  ]
};
```

## 📊 Analytics

The app tracks various metrics:
- Total conversations
- Message count
- Session data
- AI vs fallback usage
- User interaction patterns

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in your browser
- **API Keys**: Stored securely in IndexedDB
- **No Tracking**: No external analytics or tracking
- **Offline First**: Works without internet connection

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires IndexedDB support for database functionality.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**AI not working?**
- Check your OpenRouter API key is correct
- Ensure you have OpenRouter credits (free tier available)
- Check browser console for errors

**Database errors?**
- Clear browser data and try again
- Check IndexedDB is supported
- Try in incognito mode

**Styling issues?**
- Clear browser cache
- Check CSS is loading properly
- Try different browser

### Getting Help
- Check the browser console for error messages
- Ensure all files are served from a web server (not file://)
- Verify your OpenRouter API key has sufficient credits

## 🎉 Acknowledgments

- OpenRouter for AI API access
- Font Awesome for icons
- Google Fonts for typography
- Arctic wildlife for inspiration

---

Made with ❄️ for Arctic conservation awareness

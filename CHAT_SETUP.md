# CRM System with LLM + Real-time Chat

This CRM system includes an integrated AI chat assistant that helps users with customer management, sales processes, and general CRM best practices.

## Chat Features

### 1. HTTP-Based Chat (Currently Active)

- **Location**: `/chat` page
- **Component**: `HttpChatComponent`
- **Technology**: Simple HTTP API calls with axios
- **Benefits**: Easy to deploy, no additional server setup required

### 2. Socket.IO Real-time Chat (Available)

- **Location**: Available in `SocketProvider` and `ChatComponent`
- **Technology**: Real-time bidirectional communication
- **Benefits**: Instant messaging, typing indicators, real-time updates

## Setup Instructions

### Basic Setup (HTTP Chat)

The system is ready to run with the HTTP-based chat. Just start the development server:

```bash
npm run dev
```

The chat will work with fallback responses. To enable OpenAI integration:

1. **Get OpenAI API Key**

   - Sign up at [OpenAI](https://platform.openai.com/)
   - Create an API key
   - Add billing information (required for API usage)

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Test the Chat**
   - Go to `/chat` page
   - Start chatting with the AI assistant
   - The AI is specialized for CRM-related questions

### Advanced Setup (Socket.IO Real-time Chat)

To enable real-time chat with Socket.IO:

1. **Switch to Socket.IO Component**
   In `src/app/(dashboard)/chat/page.tsx`, replace:

   ```tsx
   import HttpChatComponent from "../../components/chat/HttpChatComponent";

   // Use this instead:
   import { SocketProvider } from "../../components/chat/SocketContext";
   import ChatComponent from "../../components/chat/ChatComponent";
   ```

2. **Update the JSX**:

   ```tsx
   <SocketProvider>
     <ChatComponent userId="user-123" conversationId="main-conversation" />
   </SocketProvider>
   ```

3. **Environment Variables**
   Add to `.env.local`:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   SOCKET_PORT=3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

4. **Production Deployment**
   For production, update the Socket.IO URLs in:
   - `SocketContext.tsx`
   - `route.ts` (socket API)

## AI Assistant Capabilities

The AI assistant is specialized for CRM tasks and can help with:

- **Customer Management**: Contact organization, data entry best practices
- **Sales Pipeline**: Lead qualification, follow-up strategies
- **Activity Tracking**: Logging interactions, scheduling follow-ups
- **Data Analysis**: Interpreting CRM metrics and reports
- **Best Practices**: CRM workflow optimization

## API Endpoints

### Chat API

- **Endpoint**: `/api/chat`
- **Method**: POST
- **Body**:
  ```json
  {
    "message": "Your question here",
    "userId": "user-id",
    "conversationId": "conversation-id"
  }
  ```
- **Response**:
  ```json
  {
    "message": "AI response",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "conversationId": "conversation-id",
    "sender": "ai"
  }
  ```

### Socket.IO API

- **Endpoint**: `/api/socket`
- **Events**:
  - `join-room`: Join a conversation room
  - `send-message`: Send a message
  - `receive-message`: Receive messages
  - `typing`: Typing indicators
  - `stop-typing`: Stop typing indicators

## File Structure

```
src/app/
├── api/
│   ├── chat/route.ts              # HTTP chat API
│   └── socket/route.ts            # Socket.IO server setup
├── components/
│   ├── chat/
│   │   ├── HttpChatComponent.tsx  # HTTP-based chat UI
│   │   ├── ChatComponent.tsx      # Socket.IO chat UI
│   │   └── SocketContext.tsx      # Socket.IO context provider
│   └── services/
│       └── openaiService.ts       # OpenAI integration service
└── (dashboard)/
    └── chat/
        └── page.tsx               # Chat page component
```

## Error Handling

The system includes comprehensive error handling:

1. **OpenAI API Errors**: Fallback to predetermined responses
2. **Network Errors**: User-friendly error messages
3. **Rate Limiting**: Graceful degradation
4. **Missing API Key**: Clear instructions for setup

## Customization

### Modify AI Behavior

Edit the system prompt in `openaiService.ts`:

```typescript
const SYSTEM_PROMPT = `Your custom instructions here...`;
```

### Add New Chat Features

- Extend the `Message` interface for new message types
- Add custom event handlers in Socket.IO implementation
- Implement message persistence with MongoDB

### Styling

The chat components use Tailwind CSS classes and can be easily customized by modifying the className props.

## Deployment Notes

### Environment Variables for Production

```env
OPENAI_API_KEY=your_production_api_key
NEXT_PUBLIC_SOCKET_URL=wss://your-domain.com
NODE_ENV=production
```

### Socket.IO Deployment

For real-time features in production:

1. Deploy Socket.IO server separately or use services like Socket.IO's managed service
2. Update CORS settings in the Socket.IO configuration
3. Use Redis adapter for multi-server deployments

## Troubleshooting

### Common Issues

1. **"API key not configured"**

   - Add OPENAI_API_KEY to .env.local
   - Restart the development server

2. **Socket.IO connection fails**

   - Check if port 3001 is available
   - Verify firewall settings
   - Check browser console for errors

3. **AI responses are slow**

   - This is normal for OpenAI API calls
   - Consider implementing response streaming for better UX

4. **TypeScript errors**
   - Run `npm run build` to check for type issues
   - Ensure all dependencies are properly installed

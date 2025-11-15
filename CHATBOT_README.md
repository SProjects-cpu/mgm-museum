# AI-Powered Help & Support Chatbot

## Overview

The MGM Museum website now features an AI-powered chatbot using Google's Gemini 2.5 Flash model. The chatbot provides instant help and support to visitors with information about the museum, tickets, exhibitions, and more.

## Features

✅ **AI-Powered Responses** - Uses Google Gemini 2.5 Flash for intelligent, context-aware answers
✅ **Conversation History** - Maintains context across multiple messages
✅ **Quick Questions** - Pre-built buttons for common inquiries
✅ **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
✅ **Dark Mode Support** - Fully compatible with light and dark themes
✅ **Loading States** - Visual feedback during AI processing
✅ **Error Handling** - Graceful fallbacks if API fails
✅ **Museum Context** - Trained with MGM Museum-specific information

## Location

The chatbot appears as a floating button in the **bottom-right corner** of all customer-facing pages.

## Quick Questions

Users can click these buttons to quickly ask common questions:
- 🕒 What are your opening hours?
- 🎫 How do I book tickets?
- 🎨 What exhibitions are available?

## Technical Details

### API Endpoint
- **Route**: `/api/chat`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "message": "User's question",
    "conversationHistory": [
      { "role": "user", "text": "Previous message" },
      { "role": "assistant", "text": "Previous response" }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "response": "AI-generated answer"
  }
  ```

### Component
- **Location**: `components/ui/minimal-chat-box.tsx`
- **Type**: Client component ("use client")
- **State Management**: React useState hooks
- **Animation**: Framer Motion

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### System Prompt
The chatbot is configured with MGM Museum-specific context:
- Museum name and location
- Opening hours (9:30 AM - 5:30 PM, Closed Mondays)
- Facilities (Planetarium, Science Exhibitions, 3D Theatre, Holography)
- Ticket booking information

## Testing

### Test Gemini API Connection
```bash
npx tsx scripts/test-gemini-api.ts
```

### Test Chatbot API Endpoint
```bash
# Start dev server first
npm run dev

# In another terminal
npx tsx scripts/test-chatbot-api.ts
```

## Usage

### For Visitors
1. Click the message icon in the bottom-right corner
2. Type your question or click a quick question button
3. Wait for the AI response
4. Continue the conversation as needed

### For Developers

#### Modify System Prompt
Edit `app/api/chat/route.ts`:
```typescript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

#### Adjust AI Parameters
In `app/api/chat/route.ts`:
```typescript
generationConfig: {
  temperature: 0.7,      // Creativity (0-1)
  maxOutputTokens: 500,  // Response length
  topP: 0.8,            // Diversity
  topK: 40,             // Token selection
}
```

#### Customize Appearance
Edit `components/ui/minimal-chat-box.tsx`:
- Change colors in className strings
- Adjust dimensions in motion.div animate prop
- Modify quick question buttons

## Deployment

### Environment Variables
Ensure `GEMINI_API_KEY` is set in your production environment:
- Vercel: Project Settings → Environment Variables
- Other platforms: Follow their environment variable setup

### API Key Security
⚠️ **Important**: The API key is only used server-side in the API route. It's never exposed to the client.

## Troubleshooting

### Chatbot not responding
1. Check if `GEMINI_API_KEY` is set in `.env.local`
2. Verify API key is valid: `npx tsx scripts/test-gemini-api.ts`
3. Check browser console for errors
4. Verify `/api/chat` endpoint is accessible

### API Errors
- **404 Model Not Found**: Model name might have changed. Check available models in test script output.
- **403 Forbidden**: API key might be invalid or restricted.
- **429 Rate Limit**: Too many requests. Implement rate limiting or upgrade API plan.

### Styling Issues
- Clear browser cache
- Check Tailwind CSS classes are properly compiled
- Verify dark mode classes if using dark theme

## Future Enhancements

Potential improvements:
- [ ] Add conversation persistence (localStorage/database)
- [ ] Implement typing indicators
- [ ] Add voice input/output
- [ ] Multi-language support
- [ ] Analytics tracking for common questions
- [ ] Admin dashboard for chatbot metrics
- [ ] Custom training on museum-specific FAQs
- [ ] Integration with booking system for direct ticket purchase

## Support

For issues or questions about the chatbot:
1. Check this README
2. Review test scripts output
3. Check browser console for errors
4. Contact development team

## Credits

- **AI Model**: Google Gemini 2.5 Flash
- **UI Framework**: Next.js 15 + React 19
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

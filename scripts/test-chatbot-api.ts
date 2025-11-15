/**
 * Test script to verify the chatbot API endpoint
 * Run with: npx tsx scripts/test-chatbot-api.ts
 */

async function testChatbotAPI() {
  console.log("🤖 Testing Chatbot API Endpoint...\n");
  console.log("=" .repeat(60) + "\n");

  const testMessages = [
    "Hello! What are your opening hours?",
    "How much do tickets cost?",
    "What exhibitions do you have?",
  ];

  for (const message of testMessages) {
    console.log(`📤 User: ${message}`);
    console.log("-".repeat(60));

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: [],
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        console.log(`🤖 Assistant: ${data.response}\n`);
        console.log("=" .repeat(60) + "\n");
      } else {
        console.error(`❌ Error: ${data.error || "Unknown error"}\n`);
        console.log("=" .repeat(60) + "\n");
      }

      // Wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Request failed:`, error);
      console.log("\n⚠️  Make sure the development server is running:");
      console.log("   npm run dev\n");
      console.log("=" .repeat(60) + "\n");
      break;
    }
  }

  console.log("✅ Chatbot API test complete!\n");
}

testChatbotAPI();

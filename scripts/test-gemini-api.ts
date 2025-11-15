/**
 * Test script to verify Gemini API key functionality
 */

const GEMINI_API_KEY = "AIzaSyDyWFP313-6YAQaNEv1unEnxQzFjl2Virg";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

async function listAvailableModels() {
  console.log("📋 Listing available models...\n");
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    if (response.ok && data.models) {
      console.log("✅ Available models:");
      data.models.forEach((model: any) => {
        console.log(`  - ${model.name}`);
      });
      console.log("\n" + "=".repeat(60) + "\n");
      return data.models;
    } else {
      console.error("❌ Failed to list models:", data);
      return [];
    }
  } catch (error) {
    console.error("❌ Error listing models:", error);
    return [];
  }
}

async function testGeminiAPI() {
  console.log("🧪 Testing Gemini API...\n");
  console.log("API Key:", GEMINI_API_KEY.substring(0, 20) + "...");
  console.log("\n" + "=".repeat(60) + "\n");

  // First, list available models
  const models = await listAvailableModels();
  
  if (models.length === 0) {
    console.error("❌ No models available or API key invalid");
    process.exit(1);
  }

  // Find a suitable model for text generation
  const textModel = models.find((m: any) => 
    m.name.includes('gemini') && 
    m.supportedGenerationMethods?.includes('generateContent')
  );

  if (!textModel) {
    console.error("❌ No suitable text generation model found");
    process.exit(1);
  }

  const modelName = textModel.name;
  console.log("📤 Using model:", modelName);
  console.log("Sending test prompt: Hello! Can you respond with a brief greeting?");
  console.log("\n" + "-".repeat(60) + "\n");

  try {
    const testPrompt = "Hello! Can you respond with a brief greeting?";
    const apiUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent`;

    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      }),
    });

    const data: GeminiResponse = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:");
      console.error("Status:", response.status);
      console.error("Error:", data.error);
      console.log("\n" + "=".repeat(60) + "\n");
      process.exit(1);
    }

    if (data.candidates && data.candidates.length > 0) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log("✅ API Response Received:");
      console.log("\n" + aiResponse);
      console.log("\n" + "=".repeat(60) + "\n");
      console.log("✅ Gemini API is working correctly!");
      console.log("🎉 Ready to integrate into chatbot\n");
    } else {
      console.error("❌ Unexpected response format:");
      console.error(JSON.stringify(data, null, 2));
      console.log("\n" + "=".repeat(60) + "\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test failed:");
    console.error(error);
    console.log("\n" + "=".repeat(60) + "\n");
    process.exit(1);
  }
}

// Run the test
testGeminiAPI();

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: "A quick test prompt",
      config: {
        responseMimeType: "application/json",
      }
    });
    console.log("SUCCESS");
    console.log(response.text());
  } catch(e) {
    console.error("ERROR DETAILS:");
    console.error(e);
  }
}
run();

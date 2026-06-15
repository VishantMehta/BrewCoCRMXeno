const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

async function generateAIResponse(prompt, systemInstruction) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    return response.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

module.exports = {
  generateAIResponse
};

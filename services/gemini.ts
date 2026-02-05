import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AudioAnalysis } from '../types';

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to upload files via Gemini File API
// Note: We now use this for ALL files to ensure consistency and support larger files
const uploadFileToGemini = async (file: File): Promise<{ fileData: { fileUri: string, mimeType: string } }> => {
  try {
    console.log(`Starting upload for ${file.name} (${file.size} bytes)`);
    
    const uploadResult = await ai.files.upload({
      file: file,
      config: {
        displayName: file.name,
        mimeType: file.type || 'audio/mp3', // Fallback for files with missing type
      },
    });

    console.log("Upload initiated, result:", uploadResult);

    // Handle potential response structure variations (wrapped in .file or direct object)
    // The SDK returns the File metadata directly in the new @google/genai version.
    let fileResource = uploadResult;

    if (!fileResource || !fileResource.name) {
       throw new Error(`Gemini API returned invalid file data. Response: ${JSON.stringify(uploadResult)}`);
    }

    console.log(`File uploaded. URI: ${fileResource.uri}, State: ${fileResource.state}`);
    
    // Poll until the file is active
    let attempts = 0;
    while (fileResource.state === 'PROCESSING') {
      attempts++;
      if (attempts > 60) { // Timeout after ~2 minutes
         throw new Error("File processing timed out.");
      }
      
      console.log(`File state: ${fileResource.state}. Waiting 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const getResult = await ai.files.get({ name: fileResource.name });
      
      if (!getResult) {
        throw new Error("Failed to retrieve file status updates from Gemini.");
      }

      fileResource = getResult;
    }

    if (fileResource.state === 'FAILED') {
      throw new Error("Audio file processing failed on Gemini servers.");
    }
    
    console.log("File ready:", fileResource.state);

    return {
      fileData: {
        fileUri: fileResource.uri,
        mimeType: fileResource.mimeType,
      },
    };
  } catch (error: any) {
    console.error("Upload failed:", error);
    // Propagate a clean error message
    throw new Error(`Failed to upload file to Gemini: ${error.message || "Unknown error"}`);
  }
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tldr: {
      type: Type.STRING,
      description: "A one-sentence 'Too Long; Didn't Read' summary of the audio.",
    },
    summary: {
      type: Type.STRING,
      description: "A detailed semantic summary of the content discussed in the audio.",
    },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 main topics or themes found in the audio.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["Positive", "Neutral", "Negative", "Mixed"],
      description: "The overall sentiment or tone of the audio.",
    },
    speakerCountEstimate: {
      type: Type.STRING,
      description: "An estimated count or description of speakers (e.g., '2 speakers', 'Single monologue').",
    },
    keyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of actionable insights or key points.",
    },
    memorableQuotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of at least five memorable, verbatim quotes from the audio.",
    },
  },
  required: ["tldr", "summary", "topics", "sentiment", "speakerCountEstimate", "keyTakeaways", "memorableQuotes"],
};

export const analyzeAudio = async (file: File): Promise<AudioAnalysis> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  // Gemini 3 Pro Preview is excellent for multimodal reasoning
  const model = "gemini-3-pro-preview"; 

  // Always use the File API upload strategy now
  console.log("Uploading file to Gemini...");
  const contentPart = await uploadFileToGemini(file);

  const prompt = `
    Listen to this audio file carefully. 
    Perform a deep semantic analysis of the content.
    Provide a structured analysis including a TL;DR, a detailed summary, key topics, sentiment, speaker estimate, key takeaways, and a list of memorable quotes.
    Ensure the output matches the JSON schema provided.
  `;

  try {
    console.log("Sending generateContent request...");
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [contentPart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(text) as AudioAnalysis;
    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
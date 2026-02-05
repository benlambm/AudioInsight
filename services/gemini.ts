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
    audioDescription: {
      type: Type.STRING,
      description: "A factual description of what is heard in the audio: background noises, music, static, silence, speech clarity, number of voices, language, and overall audio quality. This must be based only on what is actually audible.",
    },
    tldr: {
      type: Type.STRING,
      description: "A one-sentence 'Too Long; Didn't Read' summary of the audio. If speech is not clearly audible, say so honestly.",
    },
    summary: {
      type: Type.STRING,
      description: "A detailed semantic summary of the content discussed in the audio. Only summarize what is actually said — do not infer or fabricate content.",
    },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 main topics or themes found in the audio. Return an empty array if no clear topics are discernible.",
    },
    sentiment: {
      type: Type.STRING,
      enum: ["Positive", "Neutral", "Negative", "Mixed"],
      description: "The overall sentiment or tone of the audio.",
    },
    speakerCountEstimate: {
      type: Type.STRING,
      description: "An estimated count or description of speakers (e.g., '2 speakers', 'Single monologue'). Say 'Unknown' or 'No audible speech' if unclear.",
    },
    keyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of actionable insights or key points. Return an empty array if none can be reliably identified.",
    },
    memorableQuotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of memorable, verbatim quotes from the audio. Only include quotes you are confident were actually spoken. Return an empty array if speech is not clearly audible.",
    },
  },
  required: ["audioDescription", "tldr", "summary", "topics", "sentiment", "speakerCountEstimate", "keyTakeaways", "memorableQuotes"],
};

const MODEL = "gemini-3-pro-preview";

const runAnalysisCall = async (contentPart: { fileData: { fileUri: string, mimeType: string } }): Promise<AudioAnalysis> => {
  const prompt = `You are an audio analysis assistant. Your top priority is accuracy — never fabricate or hallucinate content.

STEP 1 — AUDIO DESCRIPTION (do this first):
Listen carefully and describe exactly what you hear in the audio file. Report:
- What kinds of sounds are present (speech, music, static, silence, background noise, etc.)
- Whether human speech is clearly audible or not
- Audio quality (clear, muffled, distorted, noisy)
- How many distinct voices you can identify, and in what language(s)

STEP 2 — ANALYSIS (only if speech is audible):
Based on what you actually heard, provide the structured analysis fields (TL;DR, summary, topics, sentiment, speaker estimate, key takeaways, and memorable quotes).

CRITICAL RULES:
- If the audio is mostly static, noise, music, or silence with no clear speech, say so honestly in every field. Do not invent a narrative.
- Only include quotes you are confident were actually spoken — never paraphrase or fabricate quotes.
- If you are uncertain about any content, explicitly say you are uncertain rather than guessing.
- Return empty arrays for topics, keyTakeaways, and memorableQuotes if nothing can be reliably identified.

Ensure the output matches the JSON schema provided.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: {
      parts: [contentPart, { text: prompt }],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      thinkingConfig: { thinkingBudget: 8192 },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }

  return JSON.parse(text) as AudioAnalysis;
};

const runTranscriptionCall = async (contentPart: { fileData: { fileUri: string, mimeType: string } }): Promise<string> => {
  const prompt = `Transcribe all human speech in this audio file verbatim.

FORMAT RULES:
- Identify each speaker and label them consistently (e.g., BECKY:, BEN:, SPEAKER 1:, etc.). Use real names if they are mentioned in the conversation.
- Format as a conversation: each speaker's turn on its own line, prefixed with their name in uppercase followed by a colon.
- Do NOT include timestamps.
- Do NOT describe non-speech sounds (background noise, music, static, footsteps, etc.). Only transcribe spoken words.
- If a word or phrase is inaudible, write [inaudible] in its place.
- If no human speech is present, respond with exactly: "No audible speech detected."

Example format:
BECKY: Hello, how are you doing today?
BEN: I'm doing well, thanks for asking.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: {
      parts: [contentPart, { text: prompt }],
    },
    config: {
      thinkingConfig: { thinkingBudget: 4096 },
    },
  });

  return response.text || "No transcription generated.";
};

export interface ProcessResult {
  analysis: AudioAnalysis;
  transcription: string;
}

export const processAudio = async (file: File): Promise<ProcessResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  // Upload once, use for both calls
  console.log("Uploading file to Gemini...");
  const contentPart = await uploadFileToGemini(file);

  // Run analysis and transcription in parallel
  console.log("Running analysis and transcription in parallel...");
  const [analysis, transcription] = await Promise.all([
    runAnalysisCall(contentPart),
    runTranscriptionCall(contentPart),
  ]);

  return { analysis, transcription };
};
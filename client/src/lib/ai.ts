import { Message } from "ai";
import { useChat, useCompletion } from "ai/react";
import { apiRequest } from "./queryClient";

// AI message interface
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

// Save training data to the server
export async function saveTrainingData(prompt: string, response: string) {
  try {
    await apiRequest("POST", "/api/training", {
      prompt,
      response,
    });
  } catch (error) {
    console.error("Error saving training data:", error);
    throw error;
  }
}

// Re-export the AI hooks
export { useChat, useCompletion };

// Function to help generate a quote using AI
export async function generateQuoteWithAI(projectDescription: string): Promise<string> {
  try {
    const response = await fetch("/api/ai/generate-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: projectDescription }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.quote;
  } catch (error) {
    console.error("Error generating quote with AI:", error);
    throw error;
  }
}

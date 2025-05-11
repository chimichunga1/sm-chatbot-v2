import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
// AI stream handling
import { Response } from 'express';

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Check if AI providers are configured
export function isConfigured(provider: string): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    default:
      return false;
  }
}

// Handle streaming chat completions
export async function streamingChatCompletion(
  messages: any[],
  options: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const provider = options.provider || 'openai';
  
  try {
    if (provider === 'openai') {
      // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
      });
      
      // Return the response directly to be handled by the client
      return response;
    } 
    else if (provider === 'anthropic') {
      // The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await anthropic.messages.create({
        model: options.model || 'claude-3-7-sonnet-20250219',
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        system: messages.find(m => m.role === 'system')?.content || '',
        messages: messages.filter(m => m.role !== 'system'),
        stream: true,
      });
      
      // Return the response directly to be handled by the client
      return response;
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error(`Error in ${provider} streaming chat completion:`, error);
    throw error;
  }
}

// Parse and validate messages to ensure they're in the correct format
export function validateAndFormatMessages(messages: any[]) {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }
  
  // Ensure all messages have role and content
  return messages.map(message => {
    if (!message.role || !message.content) {
      throw new Error('Each message must have a role and content');
    }
    
    // Convert to OpenAI/Anthropic format
    return {
      role: message.role,
      content: message.content
    };
  });
}

// Generate text with AI
export async function generateText(
  provider: string,
  prompt: string,
  options: {
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  try {
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: [
          { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return response.choices[0].message.content || '';
    } 
    else if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: options.model || 'claude-3-7-sonnet-20250219',
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        system: options.systemPrompt || 'You are a helpful assistant.',
        messages: [{ role: 'user', content: prompt }]
      });
      
      const content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
      
      return content;
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error(`Error generating text with ${provider}:`, error);
    throw error;
  }
}

// Generate a quote with AI
export async function generateQuote(
  description: string,
  model: any,
  additionalContext?: string,
  systemPrompt?: string
): Promise<string> {
  const provider = model?.provider || 'openai';
  const baseModel = model?.baseModel || (provider === 'openai' ? 'gpt-4o' : 'claude-3-7-sonnet-20250219');
  
  const prompt = `
    Create a detailed quote for this project: "${description}"
    ${additionalContext ? `\nAdditional context: ${additionalContext}` : ''}
    
    Your response should include:
    1. Line items with descriptions, quantities, and unit prices
    2. Any assumptions made
    3. Terms and conditions
    4. Timeline estimates
    
    Format prices as numbers (e.g., use 500 instead of $500) to help with extraction.
  `;
  
  const defaultSystemPrompt = `
    You are a professional quote creator. Your task is to create detailed, realistic quotes 
    based on project descriptions. Include all necessary line items, pricing, and terms.
    Be specific about what's included and what's not. Use industry-standard pricing and terms.
  `;
  
  return generateText(
    provider,
    prompt,
    {
      model: baseModel,
      systemPrompt: systemPrompt || defaultSystemPrompt,
      temperature: 0.7
    }
  );
}

// Convert training data to the format expected by the provider
export function convertTrainingData(
  provider: string,
  data: Array<{ prompt: string; response: string }>,
  systemPrompt?: string
): any[] {
  if (provider === 'openai') {
    return data.map(item => ({
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: item.prompt },
        { role: 'assistant', content: item.response }
      ]
    }));
  }
  else if (provider === 'anthropic') {
    return data.map(item => ({
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: item.prompt },
        { role: 'assistant', content: item.response }
      ]
    }));
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// Create a fine-tuning job
export async function createFineTuningJob(
  provider: string,
  baseModel: string,
  trainingData: any[],
  hyperparams: any = {}
): Promise<string> {
  try {
    if (provider === 'openai') {
      // In a real implementation, we'd upload these files and get file IDs
      // For stub purposes, we're returning a mock job ID
      console.log('Fine-tuning with data:', trainingData.length, 'examples');
      
      return `ft-job-${Date.now()}`;
    }
    else if (provider === 'anthropic') {
      // Anthropic doesn't have a direct fine-tuning API yet
      throw new Error('Fine-tuning not supported for Anthropic');
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error(`Error creating fine-tuning job with ${provider}:`, error);
    throw error;
  }
}

// Get fine-tuning job status
export async function getFineTuningStatus(
  provider: string,
  jobId: string
): Promise<{
  status: string;
  model?: string;
  error?: string;
  createdAt?: Date;
  finishedAt?: Date;
}> {
  try {
    if (provider === 'openai') {
      // For stub purposes, using a mock response
      console.log('Getting fine-tuning status for job:', jobId);
      
      // Generate a deterministic status based on the job ID
      const jobCreationTime = parseInt(jobId.split('-').pop() || '0', 10);
      const elapsedTime = Date.now() - jobCreationTime;
      
      let status = 'running';
      if (elapsedTime > 30000) status = 'succeeded';
      
      return {
        status: status,
        model: `ft:gpt-4o:${jobId}`,
        createdAt: new Date(jobCreationTime),
        finishedAt: status === 'succeeded' ? new Date() : undefined,
        error: undefined
      };
    }
    else if (provider === 'anthropic') {
      // Anthropic doesn't have a direct fine-tuning API yet
      throw new Error('Fine-tuning status check not supported for Anthropic');
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error(`Error checking fine-tuning status with ${provider}:`, error);
    throw error;
  }
}

export async function extractLineItemsFromText(text: string, provider = 'openai') {
  try {
    const systemPrompt = `
      You are a helpful assistant that extracts structured line items from text.
      Look for items, quantities, prices, and descriptions.
      Format your response as a valid JSON array of objects with these properties:
      - description: string (the item or service description)
      - quantity: number (the quantity, default to 1 if not specified)
      - unitPrice: number (the price per unit in dollars)
      
      Only respond with the JSON array and nothing else.
    `;
    
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices[0].message.content;
      if (!content) return [];
      
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed.items) ? parsed.items : [];
      } catch (e) {
        console.error('Failed to parse JSON response from OpenAI:', e);
        return [];
      }
    } 
    else if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }]
      });
      
      // Handle structured content from Anthropic
      const content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : JSON.stringify(response.content[0]);
      
      if (!content) return [];
      
      try {
        // Extract JSON from the response in case Claude adds extra text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];
        
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed.items) ? parsed.items : [];
      } catch (e) {
        console.error('Failed to parse JSON response from Anthropic:', e);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting line items:', error);
    return [];
  }
}
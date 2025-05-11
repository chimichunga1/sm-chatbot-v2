import { Message } from 'ai';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Check if AI providers are configured
export function isProviderConfigured(provider: string): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    default:
      return false;
  }
}

// Stream AI responses directly
export async function streamingChatHandler(messages: Message[], res: any) {
  // Set up server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Log the incoming messages for debugging
  console.log('AI Chat Request received with messages:', JSON.stringify(messages.map(m => ({
    role: m.role,
    contentPreview: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
  }))));
  
  // Default to OpenAI if available, otherwise try Anthropic
  try {
    if (isProviderConfigured('openai')) {
      console.log('Using OpenAI for chat response');
      // Create a streaming chat completion with OpenAI
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages as any[],
        temperature: 0.7,
        stream: true,
      });
      
      // Stream chunks to the client
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ text: content, done: false })}\n\n`);
        }
      }
      
      console.log('OpenAI stream completed successfully');
    } 
    else if (isProviderConfigured('anthropic')) {
      console.log('Using Anthropic for chat response');
      // Extract system message if present
      const systemMessage = messages.find(m => m.role === 'system');
      const systemPrompt = systemMessage?.content || '';
      
      // Filter out system messages for Anthropic
      const userMessages = messages.filter(m => m.role !== 'system');
      
      // Create a streaming chat completion with Anthropic
      const stream = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released after your knowledge cutoff.
        system: systemPrompt,
        messages: userMessages as any[],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      });
      
      // Stream chunks to the client
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ text: content, done: false })}\n\n`);
          }
        }
      }
      
      console.log('Anthropic stream completed successfully');
    }
    else {
      // No AI provider configured
      console.warn('No AI provider configured, sending error message');
      res.write(`data: ${JSON.stringify({ text: "No AI provider configured. Please add an OpenAI or Anthropic API key.", done: false })}\n\n`);
    }
    
    // End the stream
    res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    
    // Get detailed error information
    let errorMessage = "Sorry, I encountered an error processing your request. Please try again later.";
    
    if (error instanceof Error) {
      console.error('Detailed error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages based on error type
      if (error.message.includes('API key')) {
        errorMessage = "There was an issue with the AI provider's API key. Please check your configuration.";
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = "The request to the AI provider timed out. Please try again later.";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "We've hit the rate limit for the AI provider. Please try again in a few minutes.";
      }
    }
    
    // Send error message in the stream format
    res.write(`data: ${JSON.stringify({ 
      text: errorMessage, 
      done: false 
    })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    res.end();
  }
}

// Function to generate structured data (like line items) from chat
export async function generateStructuredData(messages: Message[], options: {
  systemPrompt?: string;
  temperature?: number;
  responseFormat?: 'json_object' | 'text';
}) {
  const { systemPrompt, temperature = 0.1, responseFormat = 'json_object' } = options;
  
  // Get the full conversation text
  const conversationText = messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
  
  try {
    if (isProviderConfigured('openai')) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt || '' },
          { role: 'user', content: conversationText }
        ],
        temperature,
        response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined
      });
      
      return response.choices[0].message.content;
    }
    else if (isProviderConfigured('anthropic')) {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt || '',
        messages: [{ role: 'user', content: conversationText }],
        max_tokens: 1000,
        temperature,
      });
      
      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
    }
    
    return null;
  } catch (error) {
    console.error('Error generating structured data:', error);
    return null;
  }
}

// Line items extractor function
export async function extractLineItems(messages: Message[]) {
  console.log('Extracting line items from messages...');
  
  // Log simplified version of messages for debugging
  console.log('Line item extraction input:', JSON.stringify(messages.map(m => ({
    role: m.role,
    contentPreview: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
  }))));
  
  const systemPrompt = `
    You are a specialized AI that extracts structured line items from a conversation about creating a quote or invoice.
    Analyze the entire conversation carefully and look for:
    - Services or products that are described with specific quantities and prices
    - Mentions of numerical values that could represent costs, quantities, or hours
    - Descriptive terms that represent billable items or services
    
    Format your response as a valid JSON object with a "items" array containing objects with these properties:
    - description: string (clear, descriptive name of the service or product)
    - quantity: number (the quantity, default to 1 if not specified)
    - unitPrice: number (the price per unit in dollars, without currency symbols)
    
    Example of expected JSON:
    {
      "items": [
        {
          "description": "Logo design service",
          "quantity": 1,
          "unitPrice": 500
        },
        {
          "description": "Social media banner design",
          "quantity": 5,
          "unitPrice": 100
        }
      ]
    }
    
    Only include items that have clear pricing information. If no line items can be extracted, return an empty array: { "items": [] }
    Don't make up information - only extract items explicitly mentioned in the conversation.
    Include EXACTLY this key in your response: "items" (not "lineItems" or anything else).
  `;
  
  try {
    console.log('Generating structured data for line items...');
    const jsonResponse = await generateStructuredData(messages, {
      systemPrompt,
      temperature: 0.1,
      responseFormat: 'json_object'
    });
    
    if (!jsonResponse) {
      console.warn('No JSON response received from AI');
      return [];
    }
    
    console.log('Received JSON response:', jsonResponse.substring(0, 200) + (jsonResponse.length > 200 ? '...' : ''));
    
    try {
      const parsed = JSON.parse(jsonResponse);
      
      // First check for the expected 'items' field
      if (parsed.items && Array.isArray(parsed.items)) {
        console.log(`Successfully extracted ${parsed.items.length} line items`);
        return parsed.items;
      } 
      // Fallback to 'lineItems' field if present (for backward compatibility)
      else if (parsed.lineItems && Array.isArray(parsed.lineItems)) {
        console.log(`Successfully extracted ${parsed.lineItems.length} line items (using 'lineItems' field)`);
        return parsed.lineItems;
      }
      
      console.warn('No valid line items found in JSON response');
      return [];
    } catch (e) {
      console.error('Failed to parse JSON from AI:', e);
      console.error('Raw JSON response:', jsonResponse);
      return [];
    }
  } catch (error) {
    console.error('Error in line item extraction:', error);
    return [];
  }
}
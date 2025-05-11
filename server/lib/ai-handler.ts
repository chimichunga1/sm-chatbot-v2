import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createHierarchicalPromptChain } from './langchain-ai';
import { IStorage } from '../storage';

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

// Handle streaming chat responses
export async function handleAIChat(req: any, res: any) {
  console.log('AI Chat handler called');
  
  // Extract data from request body
  const { messages, clientId, companyId, systemPrompt } = req.body;
  
  console.log(`AI Chat request data: clientId=${clientId}, companyId=${companyId}, hasSystemPrompt=${!!systemPrompt}`);
  console.log(`Messages count: ${messages?.length || 0}`);
  
  if (!messages || !Array.isArray(messages)) {
    console.error('Invalid messages format in request:', req.body);
    return res.status(400).json({ error: "Invalid messages format" });
  }
  
  // Get the last message from the user
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    console.error('Last message must be from user. Last message:', lastMessage);
    return res.status(400).json({ error: "Last message must be from user" });
  }
  
  // Check API key configuration
  if (!isProviderConfigured('openai') && !isProviderConfigured('anthropic')) {
    console.error('No AI provider configured. Missing API keys.');
    return res.status(500).json({ 
      error: "No AI provider configured. Please add an OpenAI or Anthropic API key."
    });
  }
  
  // Set up server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    // If a custom system prompt was provided, inject it into the messages
    let processedMessages = [...messages];
    if (systemPrompt) {
      // Replace any existing system message or add a new one at the beginning
      const hasSystemMsg = processedMessages.some(m => m.role === 'system');
      
      if (hasSystemMsg) {
        processedMessages = processedMessages.map(m => 
          m.role === 'system' ? { ...m, content: systemPrompt } : m
        );
      } else {
        processedMessages = [
          { role: 'system', content: systemPrompt },
          ...processedMessages
        ];
      }
    }
    
    console.log('AI Chat using processed messages:', processedMessages.map(m => ({
      role: m.role,
      contentLength: m.content.length,
      preview: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
    })));
    // Check if we should use hierarchical prompts (requires OpenAI)
    const useHierarchicalPrompts = 
      isProviderConfigured('openai') && 
      (companyId !== undefined);
    
    if (useHierarchicalPrompts) {
      await handleHierarchicalPrompt(req, res, lastMessage.content, companyId, clientId);
    }
    // Fall back to the standard AI completion if no hierarchical data or OpenAI not available
    else if (isProviderConfigured('openai')) {
      // Create a streaming chat completion with OpenAI
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o', // The newest OpenAI model (May 2024)
        messages: formatMessagesForProvider(messages, 'openai'),
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
    } 
    else if (isProviderConfigured('anthropic')) {
      // Format messages for Anthropic
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      // Create a streaming chat completion with Anthropic
      const stream = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // The newest Anthropic model (Feb 2025)
        system: systemMessage?.content || '',
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
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
    }
    else {
      // No AI provider configured
      res.write(`data: ${JSON.stringify({ text: "No AI provider configured. Please add an OpenAI or Anthropic API key.", done: false })}\n\n`);
    }
    
    // End the stream
    res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    res.end();
  } 
  catch (error) {
    console.error('Error in AI chat endpoint:', error);
    
    // Send error message in the stream format
    res.write(`data: ${JSON.stringify({ 
      text: "Sorry, I encountered an error processing your request. Please try again later.", 
      done: false 
    })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: '', done: true })}\n\n`);
    res.end();
  }
}

// Handle hierarchical prompts using LangChain
async function handleHierarchicalPrompt(req: any, res: any, userMessage: string, companyId: number, clientId?: number) {
  try {
    // Get storage from app
    const storage: IStorage = req.app.locals.storage;
    
    console.log(`Creating hierarchical prompt chain for company=${companyId}, client=${clientId || 'none'}`);
    
    // Create the chain with appropriate prompts
    const chain = await createHierarchicalPromptChain(storage, companyId, clientId);
    
    // Stream the response
    const stream = chain.streamMessage(userMessage);
    
    for await (const chunk of stream) {
      if (chunk) {
        res.write(`data: ${JSON.stringify({ text: chunk, done: false })}\n\n`);
      }
    }
    
    console.log('Hierarchical prompt chain completed successfully');
    return true;
  } catch (error) {
    console.error('Error handling hierarchical prompt:', error);
    res.write(`data: ${JSON.stringify({ 
      text: "Sorry, I encountered an error processing your hierarchical prompt. Falling back to standard AI.", 
      done: false 
    })}\n\n`);
    return false;
  }
}

// Format messages for specific providers
function formatMessagesForProvider(messages: any[], provider: string) {
  // Clean and validate messages
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// Generate line items from conversation
export async function generateLineItems(conversation: any[]) {
  try {
    // Get the full conversation text
    const conversationText = conversation
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    // System prompt for extracting line items
    const systemPrompt = `
      You are a helpful assistant that extracts structured line items from a conversation.
      Look for items, quantities, prices, and descriptions in the conversation.
      Format your response as a valid JSON array of objects with these properties:
      - description: string (the item or service description)
      - quantity: number (the quantity, default to 1 if not specified)
      - unitPrice: number (the price per unit in dollars)
      
      Your response should be a JSON object with an "items" key containing the array.
    `;
    
    if (isProviderConfigured('openai')) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices[0].message.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          return parsed.items || [];
        } catch (e) {
          console.error('Failed to parse JSON from OpenAI:', e);
          return [];
        }
      }
    }
    else if (isProviderConfigured('anthropic')) {
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        messages: [{ role: 'user', content: conversationText }],
        max_tokens: 1000,
        temperature: 0.1,
      });
      
      const content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
        
      if (content) {
        try {
          // Extract JSON object from potential text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.items || [];
          }
        } catch (e) {
          console.error('Failed to parse JSON from Anthropic:', e);
          return [];
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error generating line items:', error);
    return [];
  }
}
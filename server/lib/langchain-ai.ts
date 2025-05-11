import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";

// Create a simplified Memory interface for our needs
interface Memory {
  saveContext(input: Record<string, any>, output: Record<string, any>): Promise<void>;
  loadMemoryVariables(values: Record<string, any>): Promise<Record<string, any>>;
}
import type { SystemPrompt, Company, Client } from "@shared/schema";

export interface HierarchicalPromptOptions {
  masterPrompt: SystemPrompt | null;
  industryPrompt: SystemPrompt | null;
  clientData?: string;
  memory?: Memory;
}

export class HierarchicalPromptChain {
  private openai: ChatOpenAI;
  private chain: RunnableSequence;
  private outputParser: StringOutputParser;
  private memory?: Memory;

  constructor(options: HierarchicalPromptOptions) {
    // Initialize the LLM model
    this.openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o",
      temperature: 0.7,
      streaming: true
    });

    this.outputParser = new StringOutputParser();
    
    // Memory will be optional for now
    this.memory = options.memory;

    // Build the prompt templates
    const promptTemplates = [];
    
    // Master prompt (always included)
    if (options.masterPrompt) {
      promptTemplates.push(
        SystemMessagePromptTemplate.fromTemplate(options.masterPrompt.content)
      );
    }
    
    // Industry prompt (if available)
    if (options.industryPrompt) {
      promptTemplates.push(
        SystemMessagePromptTemplate.fromTemplate(options.industryPrompt.content)
      );
    }
    
    // Client data context (if available)
    if (options.clientData) {
      promptTemplates.push(
        SystemMessagePromptTemplate.fromTemplate(
          `Additional client-specific context: ${options.clientData}`
        )
      );
    }
    
    // Add a template for the user's message
    promptTemplates.push(
      HumanMessagePromptTemplate.fromTemplate("{input}")
    );
    
    // Create the chat prompt from all templates
    const chatPrompt = ChatPromptTemplate.fromMessages(promptTemplates);
    
    // Create the chain
    this.chain = RunnableSequence.from([
      {
        input: (input: string) => input,
        // If needed, retrieve chat history from memory
        // chat_history: this.memory.loadMemoryVariables
      },
      chatPrompt,
      this.openai,
      this.outputParser
    ]);
  }

  /**
   * Process an input message through the hierarchical prompt chain
   */
  async processMessage(input: string, callbacks?: any[]): Promise<string> {
    try {
      const response = await this.chain.invoke(
        { input },
        { callbacks }
      );
      
      // Save to memory if needed
      // await this.memory.saveContext({ human_input: input }, { ai_output: response });
      
      return response;
    } catch (error) {
      console.error('Error processing message with LangChain:', error);
      throw error;
    }
  }

  /**
   * Process an input message with streaming responses
   */
  async *streamMessage(input: string, callbacks?: any[]): AsyncGenerator<string, void, unknown> {
    try {
      // Create a streaming version of the chain
      const streamingModel = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o",
        temperature: 0.7,
        streaming: true
      });
      
      // For simplicity, we'll just stream directly from the model 
      // rather than trying to integrate with the entire chain
      
      const stream = await streamingModel.stream(input);
      
      for await (const chunk of stream) {
        // Handle different content types that might come from the stream
        if (typeof chunk.content === 'string') {
          yield chunk.content;
        } else if (Array.isArray(chunk.content)) {
          // For complex message content, extract text parts
          for (const content of chunk.content) {
            if (content.type === 'text') {
              yield content.text;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming message with LangChain:', error);
      throw error;
    }
  }

  /**
   * Build client context data from database records
   */
  static buildClientContext(client: Client, quotes: any[] = []): string {
    let context = '';
    
    // Client info
    context += `CLIENT INFORMATION:\n`;
    context += `Name: ${client.companyName}\n`;
    context += `Contact: ${client.contactFirstName || ''} ${client.contactLastName || ''}\n`;
    context += `Email: ${client.email || 'Not provided'}\n`;
    context += `Phone: ${client.phone || 'Not provided'}\n`;
    
    // Recent quotes
    if (quotes.length > 0) {
      context += `\nRECENT QUOTES:\n`;
      quotes.slice(0, 5).forEach(quote => {
        context += `- ${quote.quoteNumber}: ${quote.description || 'No description'} ($${quote.amount || 0})\n`;
      });
    }
    
    // Notes
    if (client.notes) {
      context += `\nNOTES:\n${client.notes}\n`;
    }
    
    return context;
  }
}

/**
 * Create a hierarchical prompt chain using the storage interface
 */
export async function createHierarchicalPromptChain(
  storage: any,
  companyId: number,
  clientId?: number
): Promise<HierarchicalPromptChain> {
  try {
    // 1. Get the master prompt
    const masterPrompt = await storage.getCoreSystemPrompt();
    
    // 2. Get company and its industry
    const company = await storage.getCompany(companyId);
    
    // 3. Get industry prompt if available
    let industryPrompt = null;
    if (company?.industryId) {
      industryPrompt = await storage.getIndustrySystemPrompt(company.industryId);
    }
    
    // 4. Get client-specific data if available
    let clientData = '';
    if (clientId) {
      const client = await storage.getClient(clientId);
      if (client) {
        const quotes = await storage.getQuotesByClientId(clientId);
        clientData = HierarchicalPromptChain.buildClientContext(client, quotes);
      }
    }
    
    // Create the chain
    return new HierarchicalPromptChain({
      masterPrompt,
      industryPrompt,
      clientData: clientData || undefined
    });
  } catch (error) {
    console.error('Error creating hierarchical prompt chain:', error);
    throw error;
  }
}
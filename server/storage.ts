import { 
  users, type User, type InsertUser,
  companies, type Company, type InsertCompany,
  clients, type Client, type InsertClient,
  quotes, type Quote, type InsertQuote,
  trainingData, type TrainingData, type InsertTrainingData,
  aiModels, type AIModel, type InsertAIModel,
  finetuningSessions, type FinetuningSession, type InsertFinetuningSession,
  systemPrompts, type SystemPrompt, type InsertSystemPrompt,
  userOnboarding, type UserOnboarding, type InsertUserOnboarding,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  refreshTokens, type RefreshToken, type InsertRefreshToken,
  industries, type Industry, type InsertIndustry
} from "@shared/schema";

// Xero token data interface
export interface XeroTokenData {
  id?: number;
  userId: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tenantId: string;
  tenantName?: string;
  createdAt: Date;
  updatedAt: Date;
}
import { db, hasDatabaseConnection } from "./db";
import { eq, and, sql } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByCompanyId(companyId: number): Promise<User[]>;
  
  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Password reset operations
  storePasswordResetToken(userId: number, token: string, expires: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByCompanyName(companyName: string): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  getAllClients(): Promise<Client[]>;
  getClientsByCompanyId(companyId: number): Promise<Client[]>;
  getClientsByUserId(userId: number): Promise<Client[]>;
  
  // Quote operations
  getQuote(id: number): Promise<Quote | undefined>;
  getQuoteByNumber(quoteNumber: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  getAllQuotes(): Promise<Quote[]>;
  getQuotesByUserId(userId: number): Promise<Quote[]>;
  getQuotesByCompanyId(companyId: number): Promise<Quote[]>;
  
  // Training data operations
  getTrainingData(id: number): Promise<TrainingData | undefined>;
  createTrainingData(data: InsertTrainingData): Promise<TrainingData>;
  updateTrainingData(id: number, data: Partial<InsertTrainingData>): Promise<TrainingData | undefined>;
  deleteTrainingData(id: number): Promise<boolean>;
  getAllTrainingData(): Promise<TrainingData[]>;
  getTrainingDataByUserId(userId: number): Promise<TrainingData[]>;
  getTrainingDataByCompanyId(companyId: number): Promise<TrainingData[]>;
  getTrainingDataByIds(ids: number[]): Promise<TrainingData[]>;
  getTrainingDataByCategory(category: string): Promise<TrainingData[]>;
  getTrainingDataByTags(tags: string[]): Promise<TrainingData[]>;
  
  // AI Model operations
  getAIModel(id: number): Promise<AIModel | undefined>;
  getAIModelByName(name: string, companyId: number): Promise<AIModel | undefined>;
  createAIModel(model: InsertAIModel): Promise<AIModel>;
  updateAIModel(id: number, model: Partial<InsertAIModel>): Promise<AIModel | undefined>;
  deleteAIModel(id: number): Promise<boolean>;
  getAllAIModels(): Promise<AIModel[]>;
  getAIModelsByCompanyId(companyId: number): Promise<AIModel[]>;
  getAIModelsByProvider(provider: string): Promise<AIModel[]>;
  getActiveAIModels(companyId: number): Promise<AIModel[]>;
  
  // Fine-tuning operations
  getFinetuningSession(id: number): Promise<FinetuningSession | undefined>;
  createFinetuningSession(session: InsertFinetuningSession): Promise<FinetuningSession>;
  updateFinetuningSession(id: number, session: Partial<InsertFinetuningSession>): Promise<FinetuningSession | undefined>;
  deleteFinetuningSession(id: number): Promise<boolean>;
  getAllFinetuningSessionsByCompanyId(companyId: number): Promise<FinetuningSession[]>;
  getFinetuningSessionsByModelId(modelId: number): Promise<FinetuningSession[]>;
  getFinetuningSessionsByUserId(userId: number): Promise<FinetuningSession[]>;
  getFinetuningSessionsByStatus(status: string): Promise<FinetuningSession[]>;
  
  // Industry operations
  getIndustry(id: number): Promise<Industry | undefined>;
  getIndustryByName(name: string): Promise<Industry | undefined>;
  createIndustry(industry: InsertIndustry): Promise<Industry>;
  updateIndustry(id: number, industry: Partial<InsertIndustry>): Promise<Industry | undefined>;
  deleteIndustry(id: number): Promise<boolean>;
  getAllIndustries(): Promise<Industry[]>;
  
  // System Prompt operations
  getSystemPrompt(id: number): Promise<SystemPrompt | undefined>;
  getActiveSystemPrompt(companyId: number): Promise<SystemPrompt | undefined>;
  getCoreSystemPrompt(): Promise<SystemPrompt | undefined>;
  getIndustrySystemPrompt(industryId: number): Promise<SystemPrompt | undefined>;
  getClientSystemPrompt(companyId: number): Promise<SystemPrompt | undefined>;
  getSystemPromptsByType(promptType: string): Promise<SystemPrompt[]>;
  createSystemPrompt(prompt: InsertSystemPrompt): Promise<SystemPrompt>;
  updateSystemPrompt(id: number, prompt: Partial<InsertSystemPrompt>): Promise<SystemPrompt | undefined>;
  deleteSystemPrompt(id: number): Promise<boolean>;
  getAllSystemPrompts(): Promise<SystemPrompt[]>;
  getAllSystemPromptsByCompanyId(companyId: number): Promise<SystemPrompt[]>;
  
  // User Onboarding operations
  getUserOnboarding(userId: number): Promise<UserOnboarding | undefined>;
  createUserOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding>;
  updateUserOnboarding(userId: number, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding | undefined>;
  
  // Password reset token operations
  storePasswordResetToken(userId: number, token: string, expires: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  
  // Xero operations
  saveXeroToken(tokenData: XeroTokenData): Promise<XeroTokenData>;
  getXeroTokenByUserId(userId: number): Promise<XeroTokenData | undefined>;
  updateXeroToken(id: number, tokenData: Partial<XeroTokenData>): Promise<XeroTokenData | undefined>;
  deleteXeroToken(id: number): Promise<boolean>;
}

// Memory storage for fallback when database is not available
class MemStorage implements IStorage {
  private users: User[] = [];
  private companies: Company[] = [];
  private clients: Client[] = [];
  private quotes: Quote[] = [];
  private trainingData: TrainingData[] = [];
  private aiModels: AIModel[] = [];
  private finetuningSessions: FinetuningSession[] = [];
  private xeroTokens: XeroTokenData[] = [];
  private industries: Industry[] = [];
  private passwordResetTokens: PasswordResetToken[] = [];
  private userPreferences: UserPreferences[] = [];
  private userIdCounter = 1;
  private companyIdCounter = 1;
  private clientIdCounter = 1;
  private quoteIdCounter = 1;
  private trainingDataIdCounter = 1;
  private aiModelIdCounter = 1;
  private finetuningSessionIdCounter = 1;
  private xeroTokenIdCounter = 1;
  private industryIdCounter = 1;
  private passwordResetTokenIdCounter = 1;
  private userPreferencesIdCounter = 1;
  
  // Xero token operations
  async saveXeroToken(tokenData: XeroTokenData): Promise<XeroTokenData> {
    // Check if token for this user already exists
    const existingToken = await this.getXeroTokenByUserId(tokenData.userId);
    
    if (existingToken) {
      // Update existing token
      return this.updateXeroToken(existingToken.id!, {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        tenantId: tokenData.tenantId,
        tenantName: tokenData.tenantName,
        updatedAt: new Date()
      });
    }
    
    // Create new token
    const newToken: XeroTokenData = {
      id: this.xeroTokenIdCounter++,
      userId: tokenData.userId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      tenantId: tokenData.tenantId,
      tenantName: tokenData.tenantName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.xeroTokens.push(newToken);
    return newToken;
  }
  
  async getXeroTokenByUserId(userId: number): Promise<XeroTokenData | undefined> {
    return this.xeroTokens.find(t => t.userId === userId);
  }
  
  async updateXeroToken(id: number, tokenData: Partial<XeroTokenData>): Promise<XeroTokenData | undefined> {
    const index = this.xeroTokens.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    const currentToken = this.xeroTokens[index];
    const updatedToken: XeroTokenData = {
      ...currentToken,
      accessToken: tokenData.accessToken !== undefined ? tokenData.accessToken : currentToken.accessToken,
      refreshToken: tokenData.refreshToken !== undefined ? tokenData.refreshToken : currentToken.refreshToken,
      expiresAt: tokenData.expiresAt !== undefined ? tokenData.expiresAt : currentToken.expiresAt,
      tenantId: tokenData.tenantId !== undefined ? tokenData.tenantId : currentToken.tenantId,
      tenantName: tokenData.tenantName !== undefined ? tokenData.tenantName : currentToken.tenantName,
      updatedAt: new Date()
    };
    
    this.xeroTokens[index] = updatedToken;
    return updatedToken;
  }
  
  async deleteXeroToken(id: number): Promise<boolean> {
    const index = this.xeroTokens.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.xeroTokens.splice(index, 1);
    return true;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.users.find(u => u.googleId === googleId);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const lastLogin = new Date();
    const user: User = {
      id: this.userIdCounter++,
      username: insertUser.username,
      email: insertUser.email,
      name: insertUser.name,
      role: insertUser.role || "user",
      googleId: insertUser.googleId,
      avatarUrl: insertUser.avatarUrl || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      companyId: insertUser.companyId || null,
      lastLogin: lastLogin,
      xeroTokenSet: insertUser.xeroTokenSet || null,
      xeroTenantId: insertUser.xeroTenantId || null
    };
    this.users.push(user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    const updatedUser: User = {
      ...this.users[userIndex],
      ...userData
    };
    
    this.users[userIndex] = updatedUser;
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }
  
  async getUsersByCompanyId(companyId: number): Promise<User[]> {
    return this.users.filter(u => u.companyId === companyId);
  }
  
  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.find(c => c.id === id);
  }
  
  async getCompanyByName(name: string): Promise<Company | undefined> {
    return this.companies.find(c => c.name === name);
  }
  
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const company: Company = {
      id: this.companyIdCounter++,
      name: insertCompany.name,
      logo: insertCompany.logo || null,
      isActive: insertCompany.isActive !== undefined ? insertCompany.isActive : true
    };
    this.companies.push(company);
    return company;
  }
  
  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const companyIndex = this.companies.findIndex(c => c.id === id);
    if (companyIndex === -1) return undefined;
    
    const updatedCompany: Company = {
      ...this.companies[companyIndex],
      name: companyData.name !== undefined ? companyData.name : this.companies[companyIndex].name,
      logo: companyData.logo !== undefined ? companyData.logo : this.companies[companyIndex].logo,
      isActive: companyData.isActive !== undefined ? companyData.isActive : this.companies[companyIndex].isActive
    };
    
    this.companies[companyIndex] = updatedCompany;
    return updatedCompany;
  }
  
  async getAllCompanies(): Promise<Company[]> {
    return [...this.companies];
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.find(c => c.id === id);
  }
  
  async getClientByCompanyName(companyName: string): Promise<Client | undefined> {
    return this.clients.find(c => c.companyName === companyName);
  }
  
  async getClientByEmail(email: string): Promise<Client | undefined> {
    return this.clients.find(c => c.email === email);
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    const client: Client = {
      id: this.clientIdCounter++,
      companyName: insertClient.companyName,
      contactFirstName: insertClient.contactFirstName,
      contactLastName: insertClient.contactLastName,
      email: insertClient.email || null,
      phone: insertClient.phone || null,
      address: insertClient.address || null,
      notes: insertClient.notes || null,
      userId: insertClient.userId || null,
      companyId: insertClient.companyId || null,
      xeroContactId: insertClient.xeroContactId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clients.push(client);
    return client;
  }
  
  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const clientIndex = this.clients.findIndex(c => c.id === id);
    if (clientIndex === -1) return undefined;
    
    const currentClient = this.clients[clientIndex];
    const updatedClient: Client = {
      ...currentClient,
      companyName: clientData.companyName !== undefined ? clientData.companyName : currentClient.companyName,
      contactFirstName: clientData.contactFirstName !== undefined ? clientData.contactFirstName : currentClient.contactFirstName,
      contactLastName: clientData.contactLastName !== undefined ? clientData.contactLastName : currentClient.contactLastName,
      email: clientData.email !== undefined ? clientData.email : currentClient.email,
      phone: clientData.phone !== undefined ? clientData.phone : currentClient.phone,
      address: clientData.address !== undefined ? clientData.address : currentClient.address,
      notes: clientData.notes !== undefined ? clientData.notes : currentClient.notes,
      userId: clientData.userId !== undefined ? clientData.userId : currentClient.userId,
      companyId: clientData.companyId !== undefined ? clientData.companyId : currentClient.companyId,
      xeroContactId: clientData.xeroContactId !== undefined ? clientData.xeroContactId : currentClient.xeroContactId,
      updatedAt: new Date()
    };
    
    this.clients[clientIndex] = updatedClient;
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    const clientIndex = this.clients.findIndex(c => c.id === id);
    if (clientIndex === -1) return false;
    
    this.clients.splice(clientIndex, 1);
    return true;
  }
  
  async getAllClients(): Promise<Client[]> {
    return [...this.clients];
  }
  
  async getClientsByCompanyId(companyId: number): Promise<Client[]> {
    return this.clients.filter(c => c.companyId === companyId);
  }
  
  async getClientsByUserId(userId: number): Promise<Client[]> {
    return this.clients.filter(c => c.userId === userId);
  }
  
  // Quote operations
  async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.find(q => q.id === id);
  }
  
  async getQuoteByNumber(quoteNumber: string): Promise<Quote | undefined> {
    return this.quotes.find(q => q.quoteNumber === quoteNumber);
  }
  
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const quote: Quote = {
      id: this.quoteIdCounter++,
      quoteNumber: insertQuote.quoteNumber,
      clientId: insertQuote.clientId || null,
      clientName: insertQuote.clientName,
      description: insertQuote.description || null,
      amount: insertQuote.amount,
      date: insertQuote.date,
      status: insertQuote.status || "draft",
      userId: insertQuote.userId || null,
      companyId: insertQuote.companyId || null,
      xeroQuoteId: insertQuote.xeroQuoteId || null,
      xeroQuoteNumber: insertQuote.xeroQuoteNumber || null,
      xeroQuoteUrl: insertQuote.xeroQuoteUrl || null
    };
    this.quotes.push(quote);
    return quote;
  }
  
  async updateQuote(id: number, quoteData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const quoteIndex = this.quotes.findIndex(q => q.id === id);
    if (quoteIndex === -1) return undefined;
    
    const currentQuote = this.quotes[quoteIndex];
    const updatedQuote: Quote = {
      id: currentQuote.id,
      quoteNumber: quoteData.quoteNumber !== undefined ? quoteData.quoteNumber : currentQuote.quoteNumber,
      clientId: quoteData.clientId !== undefined ? quoteData.clientId : currentQuote.clientId,
      clientName: quoteData.clientName !== undefined ? quoteData.clientName : currentQuote.clientName,
      description: quoteData.description !== undefined ? quoteData.description : currentQuote.description,
      amount: quoteData.amount !== undefined ? quoteData.amount : currentQuote.amount,
      date: quoteData.date !== undefined ? quoteData.date : currentQuote.date,
      status: quoteData.status !== undefined ? quoteData.status : currentQuote.status,
      userId: quoteData.userId !== undefined ? quoteData.userId : currentQuote.userId,
      companyId: quoteData.companyId !== undefined ? quoteData.companyId : currentQuote.companyId,
      xeroQuoteId: quoteData.xeroQuoteId !== undefined ? quoteData.xeroQuoteId : currentQuote.xeroQuoteId,
      xeroQuoteNumber: quoteData.xeroQuoteNumber !== undefined ? quoteData.xeroQuoteNumber : currentQuote.xeroQuoteNumber,
      xeroQuoteUrl: quoteData.xeroQuoteUrl !== undefined ? quoteData.xeroQuoteUrl : currentQuote.xeroQuoteUrl
    };
    
    this.quotes[quoteIndex] = updatedQuote;
    return updatedQuote;
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    const quoteIndex = this.quotes.findIndex(q => q.id === id);
    if (quoteIndex === -1) return false;
    
    this.quotes.splice(quoteIndex, 1);
    return true;
  }
  
  async getAllQuotes(): Promise<Quote[]> {
    return [...this.quotes];
  }
  
  async getQuotesByUserId(userId: number): Promise<Quote[]> {
    return this.quotes.filter(q => q.userId === userId);
  }
  
  async getQuotesByCompanyId(companyId: number): Promise<Quote[]> {
    return this.quotes.filter(q => q.companyId === companyId);
  }
  
  // Training data operations
  async getTrainingData(id: number): Promise<TrainingData | undefined> {
    return this.trainingData.find(td => td.id === id);
  }
  
  async createTrainingData(insertData: InsertTrainingData): Promise<TrainingData> {
    const trainingEntry: TrainingData = {
      id: this.trainingDataIdCounter++,
      prompt: insertData.prompt,
      response: insertData.response,
      userId: insertData.userId || null,
      companyId: insertData.companyId || null,
      timestamp: insertData.timestamp || new Date(),
      tags: insertData.tags || null,
      category: insertData.category || null,
      quality: insertData.quality || null
    };
    this.trainingData.push(trainingEntry);
    return trainingEntry;
  }
  
  async getTrainingDataByUserId(userId: number): Promise<TrainingData[]> {
    return this.trainingData.filter(td => td.userId === userId);
  }
  
  async getTrainingDataByCompanyId(companyId: number): Promise<TrainingData[]> {
    return this.trainingData.filter(td => td.companyId === companyId);
  }
  
  async updateTrainingData(id: number, data: Partial<InsertTrainingData>): Promise<TrainingData | undefined> {
    const index = this.trainingData.findIndex(td => td.id === id);
    if (index === -1) return undefined;
    
    const currentData = this.trainingData[index];
    const updatedData: TrainingData = {
      ...currentData,
      prompt: data.prompt !== undefined ? data.prompt : currentData.prompt,
      response: data.response !== undefined ? data.response : currentData.response,
      userId: data.userId !== undefined ? data.userId : currentData.userId,
      companyId: data.companyId !== undefined ? data.companyId : currentData.companyId,
      timestamp: data.timestamp !== undefined ? data.timestamp : currentData.timestamp,
      tags: data.tags !== undefined ? data.tags : currentData.tags,
      category: data.category !== undefined ? data.category : currentData.category,
      quality: data.quality !== undefined ? data.quality : currentData.quality
    };
    
    this.trainingData[index] = updatedData;
    return updatedData;
  }
  
  async deleteTrainingData(id: number): Promise<boolean> {
    const index = this.trainingData.findIndex(td => td.id === id);
    if (index === -1) return false;
    
    this.trainingData.splice(index, 1);
    return true;
  }
  
  async getAllTrainingData(): Promise<TrainingData[]> {
    return [...this.trainingData];
  }
  
  async getTrainingDataByIds(ids: number[]): Promise<TrainingData[]> {
    return this.trainingData.filter(td => ids.includes(td.id));
  }
  
  async getTrainingDataByCategory(category: string): Promise<TrainingData[]> {
    return this.trainingData.filter(td => td.category === category);
  }
  
  async getTrainingDataByTags(tags: string[]): Promise<TrainingData[]> {
    return this.trainingData.filter(td => {
      if (!td.tags) return false;
      return tags.some(tag => td.tags?.includes(tag));
    });
  }
  
  // AI Model operations
  async getAIModel(id: number): Promise<AIModel | undefined> {
    return this.aiModels.find(m => m.id === id);
  }
  
  async getAIModelByName(name: string, companyId: number): Promise<AIModel | undefined> {
    return this.aiModels.find(m => m.name === name && m.companyId === companyId);
  }
  
  async createAIModel(model: InsertAIModel): Promise<AIModel> {
    const aiModel: AIModel = {
      id: this.aiModelIdCounter++,
      name: model.name,
      provider: model.provider,
      baseModel: model.baseModel,
      companyId: model.companyId || null,
      isActive: model.isActive !== undefined ? model.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      configuration: model.configuration || null,
      finetuneId: model.finetuneId || null,
      finetuneStatus: model.finetuneStatus || "not_started",
      trainingDataIds: model.trainingDataIds || null,
      metrics: model.metrics || null
    };
    this.aiModels.push(aiModel);
    return aiModel;
  }
  
  async updateAIModel(id: number, modelData: Partial<InsertAIModel>): Promise<AIModel | undefined> {
    const index = this.aiModels.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    const currentModel = this.aiModels[index];
    const updatedModel: AIModel = {
      ...currentModel,
      name: modelData.name !== undefined ? modelData.name : currentModel.name,
      provider: modelData.provider !== undefined ? modelData.provider : currentModel.provider,
      baseModel: modelData.baseModel !== undefined ? modelData.baseModel : currentModel.baseModel,
      companyId: modelData.companyId !== undefined ? modelData.companyId : currentModel.companyId,
      isActive: modelData.isActive !== undefined ? modelData.isActive : currentModel.isActive,
      updatedAt: new Date(),
      configuration: modelData.configuration !== undefined ? modelData.configuration : currentModel.configuration,
      finetuneId: modelData.finetuneId !== undefined ? modelData.finetuneId : currentModel.finetuneId,
      finetuneStatus: modelData.finetuneStatus !== undefined ? modelData.finetuneStatus : currentModel.finetuneStatus,
      trainingDataIds: modelData.trainingDataIds !== undefined ? modelData.trainingDataIds : currentModel.trainingDataIds,
      metrics: modelData.metrics !== undefined ? modelData.metrics : currentModel.metrics
    };
    
    this.aiModels[index] = updatedModel;
    return updatedModel;
  }
  
  async deleteAIModel(id: number): Promise<boolean> {
    const index = this.aiModels.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.aiModels.splice(index, 1);
    return true;
  }
  
  async getAllAIModels(): Promise<AIModel[]> {
    return [...this.aiModels];
  }
  
  async getAIModelsByCompanyId(companyId: number): Promise<AIModel[]> {
    return this.aiModels.filter(m => m.companyId === companyId);
  }
  
  async getAIModelsByProvider(provider: string): Promise<AIModel[]> {
    return this.aiModels.filter(m => m.provider === provider);
  }
  
  async getActiveAIModels(companyId: number): Promise<AIModel[]> {
    return this.aiModels.filter(m => m.companyId === companyId && m.isActive);
  }
  
  // Industry operations
  async getIndustry(id: number): Promise<Industry | undefined> {
    return this.industries.find(i => i.id === id);
  }

  async getIndustryByName(name: string): Promise<Industry | undefined> {
    return this.industries.find(i => i.name === name);
  }

  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const newIndustry: Industry = {
      id: this.industryIdCounter++,
      name: industry.name,
      description: industry.description || null,
      icon: industry.icon || null,
      isActive: industry.isActive !== undefined ? industry.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.industries.push(newIndustry);
    return newIndustry;
  }

  async updateIndustry(id: number, industryData: Partial<InsertIndustry>): Promise<Industry | undefined> {
    const index = this.industries.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    const current = this.industries[index];
    const updated: Industry = {
      ...current,
      name: industryData.name !== undefined ? industryData.name : current.name,
      description: industryData.description !== undefined ? industryData.description : current.description,
      icon: industryData.icon !== undefined ? industryData.icon : current.icon,
      isActive: industryData.isActive !== undefined ? industryData.isActive : current.isActive,
      updatedAt: new Date()
    };
    
    this.industries[index] = updated;
    return updated;
  }

  async deleteIndustry(id: number): Promise<boolean> {
    const index = this.industries.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    this.industries.splice(index, 1);
    return true;
  }

  async getAllIndustries(): Promise<Industry[]> {
    return [...this.industries];
  }
  
  // Password reset token operations
  async storePasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    // First, clean up any existing tokens for this user
    this.passwordResetTokens = this.passwordResetTokens.filter(t => t.userId !== userId);
    
    // Create a new token
    const passwordResetToken: PasswordResetToken = {
      id: this.passwordResetTokenIdCounter++,
      token,
      userId,
      expires,
      createdAt: new Date()
    };
    
    this.passwordResetTokens.push(passwordResetToken);
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.find(t => t.token === token);
  }
  
  async deletePasswordResetToken(token: string): Promise<void> {
    this.passwordResetTokens = this.passwordResetTokens.filter(t => t.token !== token);
  }
  
  // Fine-tuning operations
  async getFinetuningSession(id: number): Promise<FinetuningSession | undefined> {
    return this.finetuningSessions.find(s => s.id === id);
  }
  
  async createFinetuningSession(session: InsertFinetuningSession): Promise<FinetuningSession> {
    if (!session.modelId) {
      throw new Error("ModelId is required for finetuning session");
    }
    
    const finetuningSession: FinetuningSession = {
      id: this.finetuningSessionIdCounter++,
      modelId: session.modelId,
      companyId: session.companyId || null,
      userId: session.userId || null,
      status: session.status || "running",
      startedAt: new Date(),
      completedAt: null,
      datasetSize: session.datasetSize,
      trainingHyperparams: session.trainingHyperparams || null,
      resultMetrics: session.resultMetrics || null,
      error: session.error || null
    };
    this.finetuningSessions.push(finetuningSession);
    return finetuningSession;
  }
  
  async updateFinetuningSession(id: number, sessionData: Partial<InsertFinetuningSession>): Promise<FinetuningSession | undefined> {
    const index = this.finetuningSessions.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    const currentSession = this.finetuningSessions[index];
    const updatedSession: FinetuningSession = {
      ...currentSession,
      ...sessionData,
      completedAt: sessionData.status === "completed" ? new Date() : currentSession.completedAt,
    };
    
    this.finetuningSessions[index] = updatedSession;
    return updatedSession;
  }
  
  async deleteFinetuningSession(id: number): Promise<boolean> {
    const index = this.finetuningSessions.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.finetuningSessions.splice(index, 1);
    return true;
  }
  
  async getAllFinetuningSessionsByCompanyId(companyId: number): Promise<FinetuningSession[]> {
    return this.finetuningSessions.filter(s => s.companyId === companyId);
  }
  
  async getFinetuningSessionsByModelId(modelId: number): Promise<FinetuningSession[]> {
    return this.finetuningSessions.filter(s => s.modelId === modelId);
  }
  
  async getFinetuningSessionsByUserId(userId: number): Promise<FinetuningSession[]> {
    return this.finetuningSessions.filter(s => s.userId === userId);
  }
  
  async getFinetuningSessionsByStatus(status: string): Promise<FinetuningSession[]> {
    return this.finetuningSessions.filter(s => s.status === status);
  }
  
  // System Prompt operations
  private systemPrompts: SystemPrompt[] = [];
  private systemPromptIdCounter = 1;
  
  async getSystemPrompt(id: number): Promise<SystemPrompt | undefined> {
    return this.systemPrompts.find(p => p.id === id);
  }
  
  async getActiveSystemPrompt(companyId: number): Promise<SystemPrompt | undefined> {
    return this.systemPrompts.find(p => p.companyId === companyId && p.isActive);
  }
  
  async getCoreSystemPrompt(): Promise<SystemPrompt | undefined> {
    return this.systemPrompts.find(p => p.promptType === "core" && p.isActive);
  }
  
  async getIndustrySystemPrompt(industryId: number): Promise<SystemPrompt | undefined> {
    return this.systemPrompts.find(p => p.promptType === "industry" && p.industryId === industryId && p.isActive);
  }
  
  async getClientSystemPrompt(companyId: number): Promise<SystemPrompt | undefined> {
    return this.systemPrompts.find(p => p.promptType === "client" && p.companyId === companyId && p.isActive);
  }
  
  async getSystemPromptsByType(promptType: string): Promise<SystemPrompt[]> {
    return this.systemPrompts.filter(p => p.promptType === promptType);
  }
  
  async createSystemPrompt(insertPrompt: InsertSystemPrompt): Promise<SystemPrompt> {
    const now = new Date();
    const prompt: SystemPrompt = {
      id: this.systemPromptIdCounter++,
      name: insertPrompt.name,
      content: insertPrompt.content,
      isActive: insertPrompt.isActive !== undefined ? insertPrompt.isActive : false,
      createdBy: insertPrompt.createdBy || null,
      companyId: insertPrompt.companyId || null,
      createdAt: now,
      updatedAt: now
    };
    
    // If this prompt is set as active, deactivate all other prompts for this company
    if (prompt.isActive && prompt.companyId) {
      this.systemPrompts.forEach(p => {
        if (p.companyId === prompt.companyId && p.id !== prompt.id) {
          p.isActive = false;
        }
      });
    }
    
    this.systemPrompts.push(prompt);
    return prompt;
  }
  
  async updateSystemPrompt(id: number, promptData: Partial<InsertSystemPrompt>): Promise<SystemPrompt | undefined> {
    const index = this.systemPrompts.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    const currentPrompt = this.systemPrompts[index];
    const updatedPrompt: SystemPrompt = {
      ...currentPrompt,
      name: promptData.name !== undefined ? promptData.name : currentPrompt.name,
      content: promptData.content !== undefined ? promptData.content : currentPrompt.content,
      isActive: promptData.isActive !== undefined ? promptData.isActive : currentPrompt.isActive,
      createdBy: promptData.createdBy !== undefined ? promptData.createdBy : currentPrompt.createdBy,
      companyId: promptData.companyId !== undefined ? promptData.companyId : currentPrompt.companyId,
      updatedAt: new Date()
    };
    
    // If this prompt is set as active, deactivate all other prompts for this company
    if (updatedPrompt.isActive && updatedPrompt.companyId) {
      this.systemPrompts.forEach(p => {
        if (p.companyId === updatedPrompt.companyId && p.id !== updatedPrompt.id) {
          p.isActive = false;
        }
      });
    }
    
    this.systemPrompts[index] = updatedPrompt;
    return updatedPrompt;
  }
  
  async deleteSystemPrompt(id: number): Promise<boolean> {
    const index = this.systemPrompts.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.systemPrompts.splice(index, 1);
    return true;
  }
  
  async getAllSystemPrompts(): Promise<SystemPrompt[]> {
    return [...this.systemPrompts];
  }
  
  async getAllSystemPromptsByCompanyId(companyId: number): Promise<SystemPrompt[]> {
    return this.systemPrompts.filter(p => p.companyId === companyId);
  }

  // User Onboarding operations
  private userOnboardingData: UserOnboarding[] = [];
  private userOnboardingIdCounter = 1;

  async getUserOnboarding(userId: number): Promise<UserOnboarding | undefined> {
    return this.userOnboardingData.find(o => o.userId === userId);
  }

  async createUserOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding> {
    const userOnboarding: UserOnboarding = {
      id: this.userOnboardingIdCounter++,
      userId: onboarding.userId,
      tutorialCompleted: onboarding.tutorialCompleted !== undefined ? onboarding.tutorialCompleted : false,
      currentStep: onboarding.currentStep !== undefined ? onboarding.currentStep : 1,
      dashboardSeen: onboarding.dashboardSeen !== undefined ? onboarding.dashboardSeen : false,
      quotesSeen: onboarding.quotesSeen !== undefined ? onboarding.quotesSeen : false,
      trainingSeen: onboarding.trainingSeen !== undefined ? onboarding.trainingSeen : false,
      usersSeen: onboarding.usersSeen !== undefined ? onboarding.usersSeen : false,
      settingsSeen: onboarding.settingsSeen !== undefined ? onboarding.settingsSeen : false,
      adminSeen: onboarding.adminSeen !== undefined ? onboarding.adminSeen : false,
      lastActivity: new Date()
    };
    this.userOnboardingData.push(userOnboarding);
    return userOnboarding;
  }

  async updateUserOnboarding(userId: number, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding | undefined> {
    const index = this.userOnboardingData.findIndex(o => o.userId === userId);
    if (index === -1) return undefined;
    
    const currentData = this.userOnboardingData[index];
    const updatedData: UserOnboarding = {
      ...currentData,
      tutorialCompleted: data.tutorialCompleted !== undefined ? data.tutorialCompleted : currentData.tutorialCompleted,
      currentStep: data.currentStep !== undefined ? data.currentStep : currentData.currentStep,
      dashboardSeen: data.dashboardSeen !== undefined ? data.dashboardSeen : currentData.dashboardSeen,
      quotesSeen: data.quotesSeen !== undefined ? data.quotesSeen : currentData.quotesSeen,
      trainingSeen: data.trainingSeen !== undefined ? data.trainingSeen : currentData.trainingSeen,
      usersSeen: data.usersSeen !== undefined ? data.usersSeen : currentData.usersSeen,
      settingsSeen: data.settingsSeen !== undefined ? data.settingsSeen : currentData.settingsSeen,
      adminSeen: data.adminSeen !== undefined ? data.adminSeen : currentData.adminSeen,
      lastActivity: new Date()
    };
    
    this.userOnboardingData[index] = updatedData;
    return updatedData;
  }
  
  // User Preferences operations
  private userPreferencesData: UserPreferences[] = [];
  private userPreferencesIdCounter = 1;
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return this.userPreferencesData.find(p => p.userId === userId);
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const userPreferences: UserPreferences = {
      id: this.userPreferencesIdCounter++,
      userId: preferences.userId,
      theme: preferences.theme || {},
      notifications: preferences.notifications || {},
      displayPreferences: preferences.displayPreferences || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userPreferencesData.push(userPreferences);
    return userPreferences;
  }
  
  async updateUserPreferences(userId: number, data: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const index = this.userPreferencesData.findIndex(p => p.userId === userId);
    if (index === -1) return undefined;
    
    const currentPreferences = this.userPreferencesData[index];
    const updatedPreferences: UserPreferences = {
      ...currentPreferences,
      theme: data.theme !== undefined ? data.theme : currentPreferences.theme,
      notifications: data.notifications !== undefined ? data.notifications : currentPreferences.notifications,
      displayPreferences: data.displayPreferences !== undefined ? data.displayPreferences : currentPreferences.displayPreferences,
      updatedAt: new Date()
    };
    
    this.userPreferencesData[index] = updatedPreferences;
    return updatedPreferences;
  }
}

// Database storage implementation
class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  // Industry operations  
  async getIndustry(id: number): Promise<Industry | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(industries).where(eq(industries.id, id));
    return result[0];
  }
  
  async getIndustryByName(name: string): Promise<Industry | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(industries).where(eq(industries.name, name));
    return result[0];
  }
  
  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.insert(industries).values({
      name: industry.name,
      description: industry.description || null,
      icon: industry.icon || null,
      isActive: industry.isActive !== undefined ? industry.isActive : true,
    }).returning();
    return result[0];
  }
  
  async updateIndustry(id: number, industry: Partial<InsertIndustry>): Promise<Industry | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(industries)
      .set({
        name: industry.name,
        description: industry.description,
        icon: industry.icon,
        isActive: industry.isActive,
      })
      .where(eq(industries.id, id))
      .returning();
    return result[0];
  }
  
  async deleteIndustry(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    try {
      await db.delete(industries).where(eq(industries.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting industry:", error);
      return false;
    }
  }
  
  async getAllIndustries(): Promise<Industry[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(industries);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database connection not available");
    const lastLogin = new Date();
    const result = await db.insert(users).values({
      ...insertUser,
      lastLogin
    }).returning();
    return result[0];
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    if (!db) throw new Error("Database connection not available");
    try {
      const result = await db.select().from(clients).where(eq(clients.id, id));
      return result[0];
    } catch (error) {
      console.error("Failed to get client by ID:", error);
      return undefined;
    }
  }

  async getClientByCompanyName(companyName: string): Promise<Client | undefined> {
    if (!db) throw new Error("Database connection not available");
    try {
      // Make company name case-insensitive
      const lowercaseCompanyName = companyName.toLowerCase();
      const result = await db
        .select()
        .from(clients)
        .where(sql`LOWER(${clients.companyName}) = ${lowercaseCompanyName}`);
      return result[0];
    } catch (error) {
      console.error("Failed to get client by company name:", error);
      return undefined;
    }
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    if (!db) throw new Error("Database connection not available");
    try {
      // Make email case-insensitive
      const lowercaseEmail = email.toLowerCase();
      const result = await db
        .select()
        .from(clients)
        .where(sql`LOWER(${clients.email}) = ${lowercaseEmail}`);
      return result[0];
    } catch (error) {
      console.error("Failed to get client by email:", error);
      return undefined;
    }
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    if (!db) throw new Error("Database connection not available");
    try {
      const now = new Date();
      const result = await db.insert(clients).values({
        ...insertClient,
        createdAt: now,
        updatedAt: now
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Failed to create client:", error);
      throw new Error("Failed to create client: " + (error as Error).message);
    }
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    if (!db) throw new Error("Database connection not available");
    try {
      const result = await db
        .update(clients)
        .set({ ...clientData, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Failed to update client:", error);
      return undefined;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    try {
      await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete client:", error);
      return false;
    }
  }

  async getAllClients(): Promise<Client[]> {
    if (!db) throw new Error("Database connection not available");
    try {
      return await db.select().from(clients);
    } catch (error) {
      console.error("Failed to get all clients:", error);
      return [];
    }
  }

  async getClientsByUserId(userId: number): Promise<Client[]> {
    if (!db) throw new Error("Database connection not available");
    try {
      return await db.select().from(clients).where(eq(clients.userId, userId));
    } catch (error) {
      console.error("Failed to get clients by user ID:", error);
      return [];
    }
  }

  async getClientsByCompanyId(companyId: number): Promise<Client[]> {
    if (!db) throw new Error("Database connection not available");
    try {
      return await db.select().from(clients).where(eq(clients.companyId, companyId));
    } catch (error) {
      console.error("Failed to get clients by company ID:", error);
      return [];
    }
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(users);
  }
  
  async getUsersByCompanyId(companyId: number): Promise<User[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }
  
  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(companies).where(eq(companies.id, id));
    return result[0];
  }
  
  async getCompanyByName(name: string): Promise<Company | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(companies).where(eq(companies.name, name));
    return result[0];
  }
  
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.insert(companies).values(insertCompany).returning();
    return result[0];
  }
  
  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }
  
  async getAllCompanies(): Promise<Company[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(companies);
  }
  
  // Quote operations
  async getQuote(id: number): Promise<Quote | undefined> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Use a raw SQL query that only includes columns we know exist in the database
      const result = await db.execute(
        sql`SELECT id, quote_number, client_name, description, amount, date, status, 
            user_id, company_id, xero_quote_id, xero_quote_number, xero_quote_url
            FROM quotes WHERE id = ${id}`
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      return {
        id: row.id,
        quoteNumber: row.quote_number,
        clientName: row.client_name,
        description: row.description,
        amount: row.amount,
        date: new Date(row.date),
        status: row.status,
        userId: row.user_id,
        companyId: row.company_id,
        xeroQuoteId: row.xero_quote_id,
        xeroQuoteNumber: row.xero_quote_number,
        xeroQuoteUrl: row.xero_quote_url,
        clientId: null // Set to null since the column doesn't exist yet
      };
    } catch (error) {
      console.error("Error in getQuote:", error);
      return undefined;
    }
  }
  
  async getQuoteByNumber(quoteNumber: string): Promise<Quote | undefined> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Use a raw SQL query that only includes columns we know exist in the database
      const result = await db.execute(
        sql`SELECT id, quote_number, client_name, description, amount, date, status, 
            user_id, company_id, xero_quote_id, xero_quote_number, xero_quote_url
            FROM quotes WHERE quote_number = ${quoteNumber}`
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      
      return {
        id: row.id,
        quoteNumber: row.quote_number,
        clientName: row.client_name,
        description: row.description,
        amount: row.amount,
        date: new Date(row.date),
        status: row.status,
        userId: row.user_id,
        companyId: row.company_id,
        xeroQuoteId: row.xero_quote_id,
        xeroQuoteNumber: row.xero_quote_number,
        xeroQuoteUrl: row.xero_quote_url,
        clientId: null // Set to null since the column doesn't exist yet
      };
    } catch (error) {
      console.error("Error in getQuoteByNumber:", error);
      return undefined;
    }
  }
  
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Create a new quote object without clientId field to avoid database error
      // since the clientId column doesn't exist yet in the database
      const { clientId, ...quoteData } = insertQuote;
      
      console.log("Creating quote with data:", quoteData);
      
      const result = await db.insert(quotes).values(quoteData).returning();
      
      // Add clientId back to the returned object to match the expected schema
      return {
        ...result[0],
        clientId: null
      };
    } catch (error) {
      console.error("Error in createQuote:", error);
      throw error;
    }
  }
  
  async updateQuote(id: number, quoteData: Partial<InsertQuote>): Promise<Quote | undefined> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Remove clientId field from the update operation to avoid database error
      const { clientId, ...updateData } = quoteData;
      
      console.log("Updating quote with data:", updateData);
      
      const result = await db.update(quotes)
        .set(updateData)
        .where(eq(quotes.id, id))
        .returning();
        
      // Add clientId back to the returned object to match the expected schema
      if (result.length > 0) {
        return {
          ...result[0],
          clientId: null
        };
      }
      
      return undefined;
    } catch (error) {
      console.error("Error in updateQuote:", error);
      throw error;
    }
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.delete(quotes).where(eq(quotes.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllQuotes(): Promise<Quote[]> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Use a raw SQL query that only includes columns we know exist in the database
      const result = await db.execute(
        sql`SELECT id, quote_number, client_name, description, amount, date, status, 
            user_id, company_id, xero_quote_id, xero_quote_number, xero_quote_url
            FROM quotes`
      );
      
      return result.rows.map(row => ({
        id: row.id,
        quoteNumber: row.quote_number,
        clientName: row.client_name,
        description: row.description,
        amount: row.amount,
        date: new Date(row.date),
        status: row.status,
        userId: row.user_id,
        companyId: row.company_id,
        xeroQuoteId: row.xero_quote_id,
        xeroQuoteNumber: row.xero_quote_number,
        xeroQuoteUrl: row.xero_quote_url,
        clientId: null // Set to null since the column doesn't exist yet
      }));
    } catch (error) {
      console.error("Error in getAllQuotes:", error);
      return [];
    }
  }
  
  async getQuotesByUserId(userId: number): Promise<Quote[]> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Use a raw SQL query that only includes columns we know exist in the database
      // This avoids the "column does not exist" error
      const result = await db.execute(
        sql`SELECT id, quote_number, client_name, description, amount, date, status, 
            user_id, company_id, xero_quote_id, xero_quote_number, xero_quote_url
            FROM quotes WHERE user_id = ${userId}`
      );
      
      return result.rows.map(row => ({
        id: row.id,
        quoteNumber: row.quote_number,
        clientName: row.client_name,
        description: row.description,
        amount: row.amount,
        date: new Date(row.date),
        status: row.status,
        userId: row.user_id,
        companyId: row.company_id,
        xeroQuoteId: row.xero_quote_id,
        xeroQuoteNumber: row.xero_quote_number,
        xeroQuoteUrl: row.xero_quote_url,
        clientId: null // Set to null since the column doesn't exist yet
      }));
    } catch (error) {
      console.error("Error in getQuotesByUserId:", error);
      return [];
    }
  }
  
  async getQuotesByCompanyId(companyId: number): Promise<Quote[]> {
    if (!db) throw new Error("Database connection not available");
    
    try {
      // Use a raw SQL query that only includes columns we know exist in the database
      // This avoids the "column does not exist" error
      const result = await db.execute(
        sql`SELECT id, quote_number, client_name, description, amount, date, status, 
            user_id, company_id, xero_quote_id, xero_quote_number, xero_quote_url
            FROM quotes WHERE company_id = ${companyId}`
      );
      
      return result.rows.map(row => ({
        id: row.id,
        quoteNumber: row.quote_number,
        clientName: row.client_name,
        description: row.description,
        amount: row.amount,
        date: new Date(row.date),
        status: row.status,
        userId: row.user_id,
        companyId: row.company_id,
        xeroQuoteId: row.xero_quote_id,
        xeroQuoteNumber: row.xero_quote_number,
        xeroQuoteUrl: row.xero_quote_url,
        clientId: null // Set to null since the column doesn't exist yet
      }));
    } catch (error) {
      console.error("Error in getQuotesByCompanyId:", error);
      return [];
    }
  }
  
  // Training data operations
  async getTrainingData(id: number): Promise<TrainingData | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(trainingData).where(eq(trainingData.id, id));
    return result[0];
  }
  
  async createTrainingData(insertData: InsertTrainingData): Promise<TrainingData> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.insert(trainingData).values(insertData).returning();
    return result[0];
  }
  
  async getTrainingDataByUserId(userId: number): Promise<TrainingData[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(trainingData).where(eq(trainingData.userId, userId));
  }
  
  async getTrainingDataByCompanyId(companyId: number): Promise<TrainingData[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(trainingData).where(eq(trainingData.companyId, companyId));
  }
  
  async updateTrainingData(id: number, data: Partial<InsertTrainingData>): Promise<TrainingData | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(trainingData)
      .set(data)
      .where(eq(trainingData.id, id))
      .returning();
    return result[0];
  }
  
  async deleteTrainingData(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.delete(trainingData).where(eq(trainingData.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllTrainingData(): Promise<TrainingData[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(trainingData);
  }
  
  async getTrainingDataByIds(ids: number[]): Promise<TrainingData[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(trainingData).where(sql`${trainingData.id} IN ${ids}`);
  }
  
  async getTrainingDataByCategory(category: string): Promise<TrainingData[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(trainingData).where(eq(trainingData.category, category));
  }
  
  async getTrainingDataByTags(tags: string[]): Promise<TrainingData[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(trainingData).where(sql`${trainingData.tags} && ${tags}`);
  }
  
  // AI Model operations
  async getAIModel(id: number): Promise<AIModel | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return result[0];
  }
  
  async getAIModelByName(name: string, companyId: number): Promise<AIModel | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(aiModels)
      .where(and(eq(aiModels.name, name), eq(aiModels.companyId, companyId)));
    return result[0];
  }
  
  async createAIModel(model: InsertAIModel): Promise<AIModel> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.insert(aiModels).values(model).returning();
    return result[0];
  }
  
  async updateAIModel(id: number, model: Partial<InsertAIModel>): Promise<AIModel | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(aiModels)
      .set(model)
      .where(eq(aiModels.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAIModel(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.delete(aiModels).where(eq(aiModels.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllAIModels(): Promise<AIModel[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(aiModels);
  }
  
  async getAIModelsByCompanyId(companyId: number): Promise<AIModel[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(aiModels).where(eq(aiModels.companyId, companyId));
  }
  
  async getAIModelsByProvider(provider: string): Promise<AIModel[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(aiModels).where(eq(aiModels.provider, provider));
  }
  
  async getActiveAIModels(companyId: number): Promise<AIModel[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(aiModels)
      .where(and(eq(aiModels.companyId, companyId), eq(aiModels.isActive, true)));
  }
  
  // Fine-tuning operations
  async getFinetuningSession(id: number): Promise<FinetuningSession | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(finetuningSessions).where(eq(finetuningSessions.id, id));
    return result[0];
  }
  
  async createFinetuningSession(session: InsertFinetuningSession): Promise<FinetuningSession> {
    if (!db) throw new Error("Database connection not available");
    if (!session.modelId) {
      throw new Error("ModelId is required for finetuning session");
    }
    const result = await db.insert(finetuningSessions).values(session).returning();
    return result[0];
  }
  
  async updateFinetuningSession(id: number, session: Partial<InsertFinetuningSession>): Promise<FinetuningSession | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(finetuningSessions)
      .set(session)
      .where(eq(finetuningSessions.id, id))
      .returning();
    return result[0];
  }
  
  async deleteFinetuningSession(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.delete(finetuningSessions).where(eq(finetuningSessions.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllFinetuningSessionsByCompanyId(companyId: number): Promise<FinetuningSession[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(finetuningSessions).where(eq(finetuningSessions.companyId, companyId));
  }
  
  async getFinetuningSessionsByModelId(modelId: number): Promise<FinetuningSession[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(finetuningSessions).where(eq(finetuningSessions.modelId, modelId));
  }
  
  async getFinetuningSessionsByUserId(userId: number): Promise<FinetuningSession[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(finetuningSessions).where(eq(finetuningSessions.userId, userId));
  }
  
  async getFinetuningSessionsByStatus(status: string): Promise<FinetuningSession[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(finetuningSessions).where(eq(finetuningSessions.status, status));
  }
  
  // System Prompt operations
  async getSystemPrompt(id: number): Promise<SystemPrompt | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(systemPrompts).where(eq(systemPrompts.id, id));
    return result[0];
  }
  
  async getActiveSystemPrompt(companyId: number): Promise<SystemPrompt | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(systemPrompts)
      .where(and(eq(systemPrompts.companyId, companyId), eq(systemPrompts.isActive, true)));
    return result[0];
  }
  
  async getCoreSystemPrompt(): Promise<SystemPrompt | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(systemPrompts)
      .where(and(eq(systemPrompts.promptType, "core"), eq(systemPrompts.isActive, true)));
    return result[0];
  }
  
  async getIndustrySystemPrompt(industryId: number): Promise<SystemPrompt | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(systemPrompts)
      .where(and(
        eq(systemPrompts.promptType, "industry"),
        eq(systemPrompts.industryId, industryId),
        eq(systemPrompts.isActive, true)
      ));
    return result[0];
  }
  
  async getClientSystemPrompt(companyId: number): Promise<SystemPrompt | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(systemPrompts)
      .where(and(
        eq(systemPrompts.promptType, "client"),
        eq(systemPrompts.companyId, companyId),
        eq(systemPrompts.isActive, true)
      ));
    return result[0];
  }
  
  async getSystemPromptsByType(promptType: string): Promise<SystemPrompt[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(systemPrompts)
      .where(eq(systemPrompts.promptType, promptType));
  }
  
  async createSystemPrompt(prompt: InsertSystemPrompt): Promise<SystemPrompt> {
    if (!db) throw new Error("Database connection not available");
    
    // If this prompt is set as active, deactivate all other prompts for this company
    if (prompt.isActive && prompt.companyId) {
      await db.update(systemPrompts)
        .set({ isActive: false })
        .where(and(eq(systemPrompts.companyId, prompt.companyId), eq(systemPrompts.isActive, true)));
    }
    
    const result = await db.insert(systemPrompts).values(prompt).returning();
    return result[0];
  }
  
  async updateSystemPrompt(id: number, promptData: Partial<InsertSystemPrompt>): Promise<SystemPrompt | undefined> {
    if (!db) throw new Error("Database connection not available");
    
    // If this prompt is set as active, deactivate all other prompts for this company
    if (promptData.isActive && promptData.companyId) {
      await db.update(systemPrompts)
        .set({ isActive: false })
        .where(and(eq(systemPrompts.companyId, promptData.companyId), eq(systemPrompts.isActive, true)));
    } else if (promptData.isActive) {
      // If no companyId is provided, get the company from the current prompt
      const currentPrompt = await this.getSystemPrompt(id);
      if (currentPrompt && currentPrompt.companyId) {
        await db.update(systemPrompts)
          .set({ isActive: false })
          .where(and(
            eq(systemPrompts.companyId, currentPrompt.companyId), 
            eq(systemPrompts.isActive, true),
            sql`${systemPrompts.id} != ${id}`
          ));
      }
    }
    
    const result = await db.update(systemPrompts)
      .set(promptData)
      .where(eq(systemPrompts.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSystemPrompt(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.delete(systemPrompts).where(eq(systemPrompts.id, id)).returning();
    return result.length > 0;
  }
  
  async getAllSystemPrompts(): Promise<SystemPrompt[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(systemPrompts);
  }
  
  async getAllSystemPromptsByCompanyId(companyId: number): Promise<SystemPrompt[]> {
    if (!db) throw new Error("Database connection not available");
    return await db.select().from(systemPrompts).where(eq(systemPrompts.companyId, companyId));
  }

  // User Onboarding operations
  async getUserOnboarding(userId: number): Promise<UserOnboarding | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(userOnboarding).where(eq(userOnboarding.userId, userId));
    return result[0];
  }

  async createUserOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.insert(userOnboarding).values({
      ...onboarding,
      lastActivity: new Date()
    }).returning();
    return result[0];
  }
  
  // User Preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result[0];
  }
  
  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.insert(userPreferences).values({
      ...prefs,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateUserPreferences(userId: number, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(userPreferences)
      .set({
        ...prefs,
        updatedAt: new Date()
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return result[0];
  }

  async updateUserOnboarding(userId: number, data: Partial<InsertUserOnboarding>): Promise<UserOnboarding | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db.update(userOnboarding)
      .set({
        ...data,
        lastActivity: new Date()
      })
      .where(eq(userOnboarding.userId, userId))
      .returning();
    return result[0];
  }
  
  // Password reset token operations
  async storePasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    if (!db) throw new Error("Database connection not available");
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expires
    });
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    if (!db) throw new Error("Database connection not available");
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return result[0];
  }
  
  async deletePasswordResetToken(token: string): Promise<void> {
    if (!db) throw new Error("Database connection not available");
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }
  
  // Xero operations
  async saveXeroToken(tokenData: XeroTokenData): Promise<XeroTokenData> {
    if (!db) throw new Error("Database connection not available");
    
    // Check if token for this user already exists
    const existingToken = await this.getXeroTokenByUserId(tokenData.userId);
    
    if (existingToken) {
      // Update existing token
      return this.updateXeroToken(existingToken.id!, {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        tenantId: tokenData.tenantId,
        tenantName: tokenData.tenantName,
        updatedAt: new Date()
      });
    }
    
    // Create new token
    // Note: Since we don't have xeroTokens table defined in schema.ts yet,
    // we would normally use:
    // const result = await db.insert(xeroTokens).values({
    //   userId: tokenData.userId,
    //   accessToken: tokenData.accessToken,
    //   refreshToken: tokenData.refreshToken,
    //   expiresAt: tokenData.expiresAt,
    //   tenantId: tokenData.tenantId,
    //   tenantName: tokenData.tenantName,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // }).returning();
    // return result[0];
    
    // For now, we'll store it in the user record to avoid schema changes
    await db.update(users)
      .set({
        xeroTokenSet: JSON.stringify({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt
        }),
        xeroTenantId: tokenData.tenantId
      })
      .where(eq(users.id, tokenData.userId));
    
    // Return the token data as provided since we don't have a dedicated table yet
    return {
      ...tokenData,
      id: 1, // Placeholder ID
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async getXeroTokenByUserId(userId: number): Promise<XeroTokenData | undefined> {
    if (!db) throw new Error("Database connection not available");
    
    // Since we don't have xeroTokens table defined in schema.ts yet,
    // we would normally use:
    // const result = await db.select().from(xeroTokens).where(eq(xeroTokens.userId, userId));
    // return result[0];
    
    // For now, retrieve from user record
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.xeroTokenSet || !user.xeroTenantId) {
      return undefined;
    }
    
    try {
      const tokenSet = JSON.parse(user.xeroTokenSet);
      return {
        id: 1, // Placeholder ID
        userId,
        accessToken: tokenSet.accessToken,
        refreshToken: tokenSet.refreshToken,
        expiresAt: new Date(tokenSet.expiresAt),
        tenantId: user.xeroTenantId,
        tenantName: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("Error parsing Xero token data:", error);
      return undefined;
    }
  }
  
  async updateXeroToken(id: number, tokenData: Partial<XeroTokenData>): Promise<XeroTokenData | undefined> {
    if (!db) throw new Error("Database connection not available");
    
    // Since we don't have xeroTokens table defined in schema.ts yet,
    // we would normally use:
    // const result = await db.update(xeroTokens)
    //   .set({
    //     ...tokenData,
    //     updatedAt: new Date()
    //   })
    //   .where(eq(xeroTokens.id, id))
    //   .returning();
    // return result[0];
    
    // For now, update user record
    const existingToken = await this.getXeroTokenByUserId(tokenData.userId!);
    if (!existingToken) return undefined;
    
    await db.update(users)
      .set({
        xeroTokenSet: JSON.stringify({
          accessToken: tokenData.accessToken || existingToken.accessToken,
          refreshToken: tokenData.refreshToken || existingToken.refreshToken,
          expiresAt: tokenData.expiresAt || existingToken.expiresAt
        }),
        xeroTenantId: tokenData.tenantId || existingToken.tenantId
      })
      .where(eq(users.id, existingToken.userId));
    
    // Return the updated token
    return {
      ...existingToken,
      ...tokenData,
      updatedAt: new Date()
    };
  }
  
  async deleteXeroToken(id: number): Promise<boolean> {
    if (!db) throw new Error("Database connection not available");
    
    // Since we don't have xeroTokens table defined in schema.ts yet,
    // we would normally use:
    // const result = await db.delete(xeroTokens).where(eq(xeroTokens.id, id)).returning();
    // return result.length > 0;
    
    // For now, get the token first to find the user ID
    const token = await this.getXeroTokenByUserId(id); // Using id as userId in this case
    if (!token) return false;
    
    // Then clear Xero data from the user record
    await db.update(users)
      .set({
        xeroTokenSet: null,
        xeroTenantId: null
      })
      .where(eq(users.id, token.userId));
    
    return true;
  }
}

// Storage factory - creates the appropriate storage implementation
export class StorageFactory {
  private static databaseStorage: DatabaseStorage | null = null;
  private static memoryStorage: MemStorage | null = null;
  
  static getStorage(): IStorage {
    if (hasDatabaseConnection) {
      if (!this.databaseStorage) {
        console.log("Using database storage");
        this.databaseStorage = new DatabaseStorage();
      }
      return this.databaseStorage;
    } else {
      if (!this.memoryStorage) {
        console.log("Using memory storage");
        this.memoryStorage = new MemStorage();
      }
      return this.memoryStorage;
    }
  }
}

// Create a storage instance using the factory
export const storage = StorageFactory.getStorage();

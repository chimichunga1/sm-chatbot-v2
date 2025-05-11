import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles are now:
// - "admin" (system administrator)
// - "owner" (company account owner)
// - "member" (team member within a company)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull(),
  role: text("role").notNull().default("member"),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  companyId: integer("company_id").references(() => companies.id),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  xeroTokenSet: jsonb("xero_token_set"),
  xeroTenantId: text("xero_tenant_id"),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  industry: text("industry"), // Keep for backward compatibility
  industryId: integer("industry_id").references(() => industries.id),
  isActive: boolean("is_active").notNull().default(true),
});

// Client table to store company and contact information
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactFirstName: text("contact_first_name"), 
  contactLastName: text("contact_last_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  xeroContactId: text("xero_contact_id"),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  clientName: text("client_name").notNull(), // Keep for backward compatibility
  description: text("description"),
  amount: integer("amount").default(0), // Changed to default(0) instead of notNull()
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("draft"), // Changed from "pending" to "draft" 
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  xeroQuoteId: text("xero_quote_id"),
  xeroQuoteNumber: text("xero_quote_number"),
  xeroQuoteUrl: text("xero_quote_url"),
});

export const trainingData = pgTable("training_data", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  tags: text("tags").array(),
  category: text("category"),
  quality: integer("quality"),
});

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // 'openai', 'anthropic', etc.
  baseModel: text("base_model").notNull(), // gpt-4o, claude-3-7-sonnet, etc.
  companyId: integer("company_id").references(() => companies.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  configuration: jsonb("configuration"), // Fine-tuning params, system prompt, etc.
  finetuneId: text("finetune_id"), // ID of the fine-tuned model if applicable
  finetuneStatus: text("finetune_status").default("not_started"), // not_started, in_progress, completed, failed
  trainingDataIds: integer("training_data_ids").array(), // IDs of training data used
  metrics: jsonb("metrics"), // Performance metrics like accuracy, etc.
});

export const finetuningSessions = pgTable("finetuning_sessions", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => aiModels.id),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull().default("running"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  datasetSize: integer("dataset_size").notNull(),
  trainingHyperparams: jsonb("training_hyperparams"),
  resultMetrics: jsonb("result_metrics"),
  error: text("error"),
});

export const industries = pgTable("industries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const systemPrompts = pgTable("system_prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  // Three prompt types: "core" (system-wide), "industry" (for specific industries), "client" (for specific clients)
  promptType: text("prompt_type").notNull().default("client"),
  industryId: integer("industry_id").references(() => industries.id),
  isActive: boolean("is_active").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tutorialCompleted: boolean("tutorial_completed").notNull().default(false),
  currentStep: integer("current_step").notNull().default(1),
  dashboardSeen: boolean("dashboard_seen").notNull().default(false),
  quotesSeen: boolean("quotes_seen").notNull().default(false),
  trainingSeen: boolean("training_seen").notNull().default(false),
  usersSeen: boolean("users_seen").notNull().default(false),
  settingsSeen: boolean("settings_seen").notNull().default(false),
  adminSeen: boolean("admin_seen").notNull().default(false),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
});

// User preferences table for storing user-specific settings
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  theme: jsonb("theme").default({}), // JSON object to store theme preferences
  notifications: jsonb("notifications").default({}), // JSON object for notification settings
  displayPreferences: jsonb("display_preferences").default({}), // JSON for display settings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  role: true,
  googleId: true,
  avatarUrl: true,
  companyId: true,
  isActive: true,
  xeroTokenSet: true,
  xeroTenantId: true,
});

// Additional schemas for login
export const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  logo: true,
  industry: true,
  industryId: true,
  isActive: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  companyName: true,
  contactFirstName: true,
  contactLastName: true,
  email: true,
  phone: true,
  address: true,
  notes: true,
  userId: true,
  companyId: true,
  xeroContactId: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).pick({
  quoteNumber: true,
  clientId: true,
  clientName: true,
  description: true,
  amount: true,
  date: true,
  status: true,
  userId: true,
  companyId: true,
  xeroQuoteId: true,
  xeroQuoteNumber: true,
  xeroQuoteUrl: true,
});

export const insertTrainingDataSchema = createInsertSchema(trainingData).pick({
  prompt: true,
  response: true,
  userId: true,
  companyId: true,
  timestamp: true,
  tags: true,
  category: true,
  quality: true,
});

export const insertAiModelSchema = createInsertSchema(aiModels).pick({
  name: true,
  provider: true,
  baseModel: true,
  companyId: true,
  isActive: true,
  configuration: true,
  finetuneId: true,
  finetuneStatus: true,
  trainingDataIds: true,
  metrics: true,
});

export const insertFinetuningSessionSchema = createInsertSchema(finetuningSessions).pick({
  modelId: true,
  companyId: true,
  userId: true,
  status: true,
  datasetSize: true,
  trainingHyperparams: true,
  resultMetrics: true,
  error: true,
});

export const insertIndustrySchema = createInsertSchema(industries).pick({
  name: true,
  description: true,
  icon: true,
  isActive: true,
});

export const insertSystemPromptSchema = createInsertSchema(systemPrompts).pick({
  name: true,
  content: true,
  promptType: true,
  industryId: true,
  isActive: true,
  createdBy: true,
  companyId: true,
});

export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).pick({
  userId: true,
  tutorialCompleted: true,
  currentStep: true,
  dashboardSeen: true,
  quotesSeen: true,
  trainingSeen: true,
  usersSeen: true,
  settingsSeen: true,
  adminSeen: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  theme: true,
  notifications: true,
  displayPreferences: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export type InsertTrainingData = z.infer<typeof insertTrainingDataSchema>;
export type TrainingData = typeof trainingData.$inferSelect;

export type InsertAIModel = z.infer<typeof insertAiModelSchema>;
export type AIModel = typeof aiModels.$inferSelect;

export type InsertFinetuningSession = z.infer<typeof insertFinetuningSessionSchema>;
export type FinetuningSession = typeof finetuningSessions.$inferSelect;

export type InsertIndustry = z.infer<typeof insertIndustrySchema>;
export type Industry = typeof industries.$inferSelect;

export type InsertSystemPrompt = z.infer<typeof insertSystemPromptSchema>;
export type SystemPrompt = typeof systemPrompts.$inferSelect;

export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// New JWT refresh tokens table for authentication
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  token: uuid("token").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdByIp: text("created_by_ip"),
  revokedAt: timestamp("revoked_at"),
  revokedByIp: text("revoked_by_ip"),
  replacedByToken: uuid("replaced_by_token"),
  isExpired: boolean("is_expired").notNull().default(false),
  isRevoked: boolean("is_revoked").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true)
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({ 
  id: true,
  isExpired: true,
  isRevoked: true, 
  isActive: true 
});
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;

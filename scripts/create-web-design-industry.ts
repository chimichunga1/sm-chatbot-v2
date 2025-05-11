/**
 * Script to create a Web Design industry and associate it with all companies
 * Run with: npx tsx scripts/create-web-design-industry.ts
 */
import { storage } from "../server/storage";
import { db } from "../server/db";
import { Industry, InsertIndustry, InsertSystemPrompt, SystemPrompt } from "../shared/schema";

async function createWebDesignIndustry() {
  console.log("Starting Web Design industry creation...");

  try {
    // Check if the Web Design industry already exists
    const existingIndustry = await storage.getIndustryByName("Web Design");
    
    if (existingIndustry) {
      console.log("Web Design industry already exists with ID:", existingIndustry.id);
      
      // Use the existing industry
      return await updateCompaniesWithIndustry(existingIndustry);
    }
    
    // Create the new industry
    const industryData: InsertIndustry = {
      name: "Web Design",
      description: "Web design and development services",
      icon: "globe",
      isActive: true
    };
    
    console.log("Creating Web Design industry...");
    const webDesignIndustry = await storage.createIndustry(industryData);
    console.log("Web Design industry created with ID:", webDesignIndustry.id);
    
    // Create the industry prompt
    const promptData: InsertSystemPrompt = {
      name: "Web Design Industry Prompt",
      content: "You are a web design specialist.",
      promptType: "industry",
      industryId: webDesignIndustry.id,
      companyId: null,
      createdBy: null,
      isActive: true
    };
    
    console.log("Creating Web Design industry prompt...");
    const industryPrompt = await storage.createSystemPrompt(promptData);
    console.log("Industry prompt created with ID:", industryPrompt.id);
    
    // Update all companies to use this industry
    return await updateCompaniesWithIndustry(webDesignIndustry);
    
  } catch (error) {
    console.error("Error creating Web Design industry:", error);
    throw error;
  }
}

async function updateCompaniesWithIndustry(industry: Industry) {
  console.log(`Updating all companies to use industry: ${industry.name} (ID: ${industry.id})...`);
  
  try {
    // Get all companies
    const companies = await storage.getAllCompanies();
    console.log(`Found ${companies.length} companies to update.`);
    
    // Update each company to use the Web Design industry
    for (const company of companies) {
      console.log(`Updating company: ${company.name} (ID: ${company.id})...`);
      
      await storage.updateCompany(company.id, {
        industryId: industry.id
      });
    }
    
    console.log("All companies updated successfully!");
    return { success: true, companiesUpdated: companies.length };
    
  } catch (error) {
    console.error("Error updating companies:", error);
    throw error;
  }
}

// Run the function
createWebDesignIndustry()
  .then((result) => {
    console.log("Operation completed successfully:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to complete operation:", error);
    process.exit(1);
  });
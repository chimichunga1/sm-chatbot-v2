import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware for validating request body against a Zod schema
 * @param schema Zod schema to validate against
 */
export function validateRequest(schema: z.Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      const validatedData = schema.parse(req.body);
      
      // Replace request body with validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      
      return res.status(500).json({
        error: "Internal server error during validation"
      });
    }
  };
}
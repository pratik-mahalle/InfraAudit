import { Router, Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { BillingFileType, importBillingFile } from "../services/billing-import-service";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "..", "..", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `billing-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === "text/csv" || 
        file.originalname.toLowerCase().endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// Schema for file upload request
const fileUploadSchema = z.object({
  provider: z.enum(["aws", "gcp", "azure"]).default("aws"),
  fileType: z.enum([
    BillingFileType.AWS_COST_EXPLORER,
    BillingFileType.GCP_BILLING_EXPORT,
    BillingFileType.AZURE_COST_MANAGEMENT
  ]).default(BillingFileType.AWS_COST_EXPLORER)
});

/**
 * Upload and process a billing CSV file
 * POST /api/billing-import/upload
 */
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Parse request body
      const { provider, fileType } = fileUploadSchema.parse(req.body);

      // Use a default organization ID since we don't have auth yet
      const organizationId = 1;

      // Process the file
      const result = await importBillingFile(
        req.file.path,
        req.file.originalname,
        fileType,
        organizationId
      );

      // Return success response
      res.json({
        success: true,
        message: result.message,
        count: result.count,
        provider,
        fileType,
      });
    } catch (error: any) {
      console.error("Error processing billing file:", error);
      
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/**
 * Get status of billing data in the system
 * GET /api/billing-import/status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    // Use a default organization ID since we don't have auth yet
    const organizationId = 1;
    
    // Get count of billing records in the database
    const result = await db.select({
      count: sql`count(*)`,
      oldestDate: sql`min(date)`,
      newestDate: sql`max(date)`,
      providerCount: sql`count(distinct service_category)`,
    })
    .from(costHistory)
    .where(eq(costHistory.organizationId, organizationId));
    
    res.json({
      success: true,
      recordCount: parseInt(result[0].count?.toString() || "0"),
      dateRange: {
        oldest: result[0].oldestDate,
        newest: result[0].newestDate,
      },
      providerCount: parseInt(result[0].providerCount?.toString() || "0"),
    });
  } catch (error: any) {
    console.error("Error getting billing import status:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Need to add imports for database operations
import { db } from "../db";
import { costHistory } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export const billingImportRouter = router;
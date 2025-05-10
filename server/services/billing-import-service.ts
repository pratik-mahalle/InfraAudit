import { db } from "../db";
import { costHistory } from "@shared/schema";
import { format, parse, isValid } from "date-fns";
import * as fs from "fs";
import { createReadStream } from "fs";
import * as path from "path";
import { parse as csvParse } from "csv-parse";

export enum BillingFileType {
  AWS_COST_EXPLORER = "AWS_COST_EXPLORER",
  GCP_BILLING_EXPORT = "GCP_BILLING_EXPORT",
  AZURE_COST_MANAGEMENT = "AZURE_COST_MANAGEMENT"
}

interface ParsedBillingData {
  date: string;
  amount: number;
  serviceCategory: string;
  region?: string;
  usageType?: string;
  usageAmount?: number;
  usageUnit?: string;
  resourceId?: number;
}

/**
 * Parse a CSV file from AWS Cost Explorer
 * AWS Cost Explorer CSV format columns:
 * - "Time Period" (e.g., "2023-01-01")
 * - "Linked Account" (e.g., "123456789012")
 * - "Service" (e.g., "Amazon Elastic Compute Cloud - Compute")
 * - "Amount" (e.g., "123.45")
 * - "Unit" (e.g., "USD")
 * - "Resource" (optional, resource ID or ARN)
 * - "Region" (optional, e.g., "us-east-1")
 * @param filePath Path to the CSV file
 */
export async function parseAwsCostExplorerCsv(
  filePath: string,
  organizationId: number
): Promise<ParsedBillingData[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedBillingData[] = [];

    createReadStream(filePath)
      .pipe(
        csvParse({
          columns: true,
          trim: true,
          skip_empty_lines: true
        })
      )
      .on("data", (row: any) => {
        // Map CSV columns to our data model
        const timePeriod = row["Time Period"] || row["time_period"] || row["Date"];
        const service = row["Service"] || row["service"] || row["ServiceName"];
        const amount = parseFloat(row["Amount"] || row["amount"] || row["Cost"] || "0");
        const region = row["Region"] || row["region"] || row["Location"];
        const resource = row["Resource"] || row["resource"] || row["ResourceId"];

        // Skip rows with invalid dates or amounts
        if (!timePeriod || isNaN(amount)) return;

        // Parse date and ensure it's valid
        const dateObj = parse(timePeriod, "yyyy-MM-dd", new Date());
        if (!isValid(dateObj)) return;

        const formattedDate = format(dateObj, "yyyy-MM-dd");

        results.push({
          date: formattedDate,
          amount,
          serviceCategory: service || "Unknown",
          region: region || undefined,
          usageType: resource ? "Instance" : undefined,
          resourceId: undefined // We don't map external resource IDs directly
        });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Parse a CSV file from GCP Billing Export
 * GCP Billing Export CSV format columns:
 * - "Billing Account ID" (e.g., "ABCDEF-123456-789012")
 * - "Service Description" (e.g., "Compute Engine")
 * - "Start Time" (e.g., "2023-01-01 00:00:00")
 * - "Cost" (e.g., "123.45")
 * - "Currency" (e.g., "USD")
 * - "Project ID" (e.g., "my-project-123")
 * - "Resource name" (optional)
 * - "Location" (optional, e.g., "us-central1")
 * @param filePath Path to the CSV file
 */
export async function parseGcpBillingExportCsv(
  filePath: string,
  organizationId: number
): Promise<ParsedBillingData[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedBillingData[] = [];

    createReadStream(filePath)
      .pipe(
        csvParse({
          columns: true,
          trim: true,
          skip_empty_lines: true
        })
      )
      .on("data", (row: any) => {
        // Map CSV columns to our data model
        const startTime = row["Start Time"] || row["start_time"] || row["Usage Start Date"];
        const service = row["Service Description"] || row["service_description"] || row["Service"];
        const amount = parseFloat(row["Cost"] || row["cost"] || row["Amount"] || "0");
        const location = row["Location"] || row["location"] || row["Region"];
        const resourceName = row["Resource name"] || row["resource_name"] || row["Resource"];

        // Skip rows with invalid dates or amounts
        if (!startTime || isNaN(amount)) return;

        // Parse date and ensure it's valid
        let dateObj;
        // Try different date formats
        if (startTime.includes(" ")) {
          dateObj = parse(startTime.split(" ")[0], "yyyy-MM-dd", new Date());
        } else {
          dateObj = parse(startTime, "yyyy-MM-dd", new Date());
        }
        
        if (!isValid(dateObj)) return;

        const formattedDate = format(dateObj, "yyyy-MM-dd");

        results.push({
          date: formattedDate,
          amount,
          serviceCategory: service || "Unknown",
          region: location || undefined,
          usageType: resourceName ? "Instance" : undefined,
          resourceId: undefined // We don't map external resource IDs directly
        });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Parse a CSV file from Azure Cost Management
 * Azure Cost Management CSV format columns:
 * - "Date" (e.g., "1/1/2023")
 * - "ServiceName" (e.g., "Virtual Machines")
 * - "ResourceGroup" (e.g., "my-resource-group")
 * - "ResourceLocation" (e.g., "eastus")
 * - "ConsumedService" (e.g., "Microsoft.Compute")
 * - "PreTaxCost" (e.g., "123.45")
 * - "ResourceId" (optional)
 * @param filePath Path to the CSV file
 */
export async function parseAzureCostManagementCsv(
  filePath: string,
  organizationId: number
): Promise<ParsedBillingData[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedBillingData[] = [];

    createReadStream(filePath)
      .pipe(
        csvParse({
          columns: true,
          trim: true,
          skip_empty_lines: true
        })
      )
      .on("data", (row: any) => {
        // Map CSV columns to our data model
        const dateField = row["Date"] || row["date"] || row["UsageDate"];
        const service = row["ServiceName"] || row["serviceName"] || row["Service Name"];
        const amount = parseFloat(row["PreTaxCost"] || row["preTaxCost"] || row["Cost"] || "0");
        const location = row["ResourceLocation"] || row["resourceLocation"] || row["Location"];
        const resourceId = row["ResourceId"] || row["resourceId"] || row["Resource ID"];

        // Skip rows with invalid dates or amounts
        if (!dateField || isNaN(amount)) return;

        // Parse date and ensure it's valid
        let dateObj;
        // Try different date formats (Azure often uses MM/dd/yyyy)
        if (dateField.includes("/")) {
          const [month, day, year] = dateField.split("/");
          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          dateObj = parse(dateField, "yyyy-MM-dd", new Date());
        }
        
        if (!isValid(dateObj)) return;

        const formattedDate = format(dateObj, "yyyy-MM-dd");

        results.push({
          date: formattedDate,
          amount,
          serviceCategory: service || "Unknown",
          region: location || undefined,
          usageType: resourceId ? "Instance" : undefined,
          resourceId: undefined // We don't map external resource IDs directly
        });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Parse a billing CSV file and insert the data into the database
 * @param filePath Path to the CSV file
 * @param fileType Type of billing file (AWS, GCP, Azure)
 * @param organizationId Organization ID to associate with the data
 */
export async function parseBillingCsvAndImport(
  filePath: string,
  fileType: BillingFileType,
  organizationId: number
): Promise<{ count: number }> {
  try {
    let parsedData: ParsedBillingData[] = [];

    // Parse the CSV file based on file type
    switch (fileType) {
      case BillingFileType.AWS_COST_EXPLORER:
        parsedData = await parseAwsCostExplorerCsv(filePath, organizationId);
        break;
      case BillingFileType.GCP_BILLING_EXPORT:
        parsedData = await parseGcpBillingExportCsv(filePath, organizationId);
        break;
      case BillingFileType.AZURE_COST_MANAGEMENT:
        parsedData = await parseAzureCostManagementCsv(filePath, organizationId);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log(`Parsed ${parsedData.length} records from ${fileType} CSV`);

    // If no data was parsed, throw an error
    if (parsedData.length === 0) {
      throw new Error("No valid data found in CSV file");
    }

    // Insert the parsed data into the database
    let insertedCount = 0;
    for (const record of parsedData) {
      try {
        // Use SQL strings for numeric values
        const [inserted] = await db.insert(costHistory).values({
          organizationId: organizationId,
          date: record.date,
          amount: record.amount.toString(), // Convert to string for numeric field
          serviceCategory: record.serviceCategory,
          region: record.region,
          usageType: record.usageType,
          resourceId: record.resourceId // This will be null most of the time
        }).returning();
        
        insertedCount++;
      } catch (err) {
        console.error(`Error inserting record for date ${record.date}:`, err);
        // Continue with next record, don't fail the whole batch
      }
    }

    return { count: insertedCount };
  } catch (error) {
    console.error("Error parsing and importing billing data:", error);
    throw error;
  }
}

/**
 * Import cost data from a provided file
 * @param tempFilePath Path to the uploaded temporary file
 * @param originalFilename Original filename
 * @param fileType Type of billing file (AWS, GCP, Azure)
 * @param organizationId Organization ID to associate with the data
 */
export async function importBillingFile(
  tempFilePath: string,
  originalFilename: string,
  fileType: BillingFileType,
  organizationId: number
): Promise<{ count: number; message: string }> {
  try {
    // Parse the file and import the data
    const result = await parseBillingCsvAndImport(tempFilePath, fileType, organizationId);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    return {
      count: result.count,
      message: `Successfully imported ${result.count} records from ${originalFilename}`
    };
  } catch (error: any) {
    // Clean up the temporary file in case of error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    throw new Error(`Failed to import billing data: ${error.message}`);
  }
}
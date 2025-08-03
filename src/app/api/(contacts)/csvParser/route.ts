import { NextRequest, NextResponse } from "next/server";
import csv from "csv-parser";
import { Readable } from "stream";
import { ContactsModel, TagsModel } from "@/DB/MongoSchema";
import { MongoConnect } from "@/DB/MongoConnect";

interface CSVRow {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await MongoConnect();

    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !file.type.includes("csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const csvRows: CSVRow[] = [];
    const importResults = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: CSVRow; reason: string }>,
      duplicates: 0,
    };

    // Parse CSV first
    return new Promise<NextResponse>(async (resolve) => {
      const readable = Readable.from([text]);

      readable
        .pipe(csv())
        .on("data", (data: CSVRow) => {
          csvRows.push(data);
        })
        .on("end", async () => {
          try {
            // Process each row and save to database
            for (const row of csvRows) {
              try {
                const { name, email, phone, company, notes, tags } = row;

                // Validate required fields
                if (!name || !email) {
                  importResults.failed++;
                  importResults.errors.push({
                    row: row,
                    reason: "Missing required fields (name or email)",
                  });
                  continue;
                }

                // Validate email format
                if (!/\S+@\S+\.\S+/.test(email)) {
                  importResults.failed++;
                  importResults.errors.push({
                    row: row,
                    reason: "Invalid email format",
                  });
                  continue;
                }

                // Check for duplicate email
                const existingContact = await ContactsModel.findOne({
                  email: email.toLowerCase(),
                });
                if (existingContact) {
                  importResults.duplicates++;
                  importResults.errors.push({
                    row: row,
                    reason: "Contact with this email already exists",
                  });
                  continue;
                }

                // Process tags if provided
                const processedTags: string[] = [];
                if (tags && tags.trim()) {
                  const tagNames = tags
                    .split(";")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag);

                  // Create or find tags
                  for (const tagName of tagNames) {
                    let tag = await TagsModel.findOne({ tagName });
                    if (!tag) {
                      tag = new TagsModel({
                        tagName,
                        color: "#3B82F6", // Default blue color
                        usageCount: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      });
                      await tag.save();
                    } else {
                      // Increment usage count
                      tag.usageCount = (tag.usageCount || 0) + 1;
                      tag.updatedAt = new Date();
                      await tag.save();
                    }
                    processedTags.push(tag._id.toString());
                  }
                }

                // Create new contact
                const newContact = new ContactsModel({
                  name: name.trim(),
                  email: email.toLowerCase().trim(),
                  phone: phone?.trim() || "",
                  company: company?.trim() || "",
                  notes: notes?.trim() || "",
                  tags: processedTags,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  lastInteraction: new Date(),
                });

                await newContact.save();
                importResults.success++;
              } catch (contactError) {
                console.error("Error processing contact:", contactError);
                importResults.failed++;
                importResults.errors.push({
                  row: row,
                  reason: `Database error: ${
                    contactError instanceof Error
                      ? contactError.message
                      : "Unknown error"
                  }`,
                });
              }
            }

            resolve(
              NextResponse.json({
                success: true,
                message: "CSV import completed",
                results: {
                  totalRows: csvRows.length,
                  successful: importResults.success,
                  failed: importResults.failed,
                  duplicates: importResults.duplicates,
                  errors: importResults.errors,
                },
              })
            );
          } catch (processingError) {
            console.error("Error processing CSV data:", processingError);
            resolve(
              NextResponse.json(
                {
                  error: "Error processing CSV data",
                  details:
                    processingError instanceof Error
                      ? processingError.message
                      : "Unknown error",
                },
                { status: 500 }
              )
            );
          }
        })
        .on("error", (error) => {
          console.error("CSV parsing error:", error);
          resolve(
            NextResponse.json(
              { error: "Failed to parse CSV file", details: error.message },
              { status: 500 }
            )
          );
        });
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  try {
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
    const results: any[] = [];

    return new Promise((resolve) => {
      const readable = Readable.from([text]);

      readable
        .pipe(csv())
        .on("data", (data) => {
          results.push(data);
        })
        .on("end", () => {
          resolve(
            NextResponse.json({
              success: true,
              data: results,
              count: results.length,
            })
          );
        })
        .on("error", (error) => {
          resolve(
            NextResponse.json(
              { error: "Failed to parse CSV file", details: error.message },
              { status: 500 }
            )
          );
        });
    });
  } catch (error) {
    console.error("CSV parsing error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

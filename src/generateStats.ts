import { BigQuery } from "@google-cloud/bigquery";
import { writeFileSync } from "fs";

async function generateStats() {
  const bigquery = new BigQuery();

  // Query for total bytes
  const [tableResult] = await bigquery
    .dataset("jamulus")
    .table("clients")
    .getMetadata();
  const rowCount = Number(tableResult.numRows);
  const totalBytes = Number(tableResult.numBytes);
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2);

  // Generate STATS.md content
  const content = `# Jamulus Usage Dataset Statistics

Updated: ${new Date().toISOString().split("T")[0]}

## Dataset Size
- **Number of rows**: ${rowCount.toLocaleString()}
- **Total logical bytes**: ${totalMB} MB (${totalBytes.toLocaleString()} bytes)
`;

  // Write to STATS.md
  writeFileSync("STATS.md", content);
  console.log("STATS.md generated successfully");
}

generateStats().catch(console.error);

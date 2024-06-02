import { BigQuery } from "@google-cloud/bigquery";
import { $ } from "bun";
import { existsSync } from "fs";
const bigquery = new BigQuery();

const clientsTable = bigquery.dataset("jamulus").table("clients");

const date = process.argv[2];
const clientFilePath = `out.local/${date}.clients.ndjson`;

// Check if the table already contains data for this date
const [existResults] = await clientsTable.query({
  query: `SELECT EXISTS(SELECT 1 FROM \`jamulus.clients\` WHERE date = @date) AS \`exists\``,
  params: { date },
  useLegacySql: false,
});

if (existResults[0].exists) {
  console.error(`Data for ${date} already exists in BigQuery`);
  process.exit(0);
}

if (!existsSync(clientFilePath)) {
  await $`mkdir -p in.local`;
  await $`mkdir -p out.local`;
  const inputFilePath = `in.local/${date}.ndjson.br`;
  if (!existsSync(inputFilePath)) {
    const month = date.slice(0, 7);
    console.log(`>>> Downloading data for ${date}`);
    await $`wget https://jamulus-archive.ap-south-1.linodeobjects.com/main/daily/${month}/${date}.ndjson.br -O ${inputFilePath}`;
  }
  console.log(`>>> Generating data for ${date}`);
  await $`bun src/generate.ts ${date}`;
}

console.log(`>>> Loading data for ${date} into BigQuery`);
const result = await clientsTable.load(clientFilePath, {
  clustering: { fields: ["date"] },
  sourceFormat: "NEWLINE_DELIMITED_JSON",
});
console.log(result);

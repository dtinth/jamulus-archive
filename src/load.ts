import { BigQuery } from "@google-cloud/bigquery";
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

console.log(`Loading data for ${date} into BigQuery`);
const result = await clientsTable.load(clientFilePath, {
  clustering: { fields: ["date"] },
  sourceFormat: "NEWLINE_DELIMITED_JSON",
});
console.log(result);

import crypto from "crypto";
import fs from "fs";
import zlib from "zlib";
import { DataPoint } from "./InputData";
import { getOrCreate } from "./goc";

const date = process.argv[2];
const inputFilePath = `in.local/${date}.ndjson.br`;

const lines = zlib
  .brotliDecompressSync(fs.readFileSync(inputFilePath))
  .toString()
  .split("\n");

console.log("Number of lines:", lines.length);

interface ClientInfo {
  name: string;
  country: string;
  city: string;
  instrument: string;
  skill: string;
}
interface ServerInfo {
  name: string;
  country: string;
  city: string;
  ip: string;
  port: number;
  genre: string;
}
interface HourlyStatRow {
  count: number;
}
interface HourBucketRow extends HourlyStatRow {
  genre: string;
  date: string;
  hour: number;
}
interface ClientRow extends HourlyStatRow {
  clientInfo: ClientInfo;
  serverInfo: ServerInfo;
  hourBucket: HourBucketRow;
}
interface ServerRow extends HourlyStatRow {
  serverInfo: ServerInfo;
  hourBucket: HourBucketRow;
}

const hourBuckets = new Map<string, HourBucketRow>();
const clientRows = new Map<string, ClientRow>();
const serverRows = new Map<string, ServerRow>();
const clientKeySet = new Set<string>();
const serverKeySet = new Set<string>();
let dataPoints = 0;

for (const line of lines) {
  if (!line.trim()) continue;
  dataPoints++;
  const data: DataPoint = JSON.parse(line);
  const dateHour = data.time.slice(0, 13);
  if (!Array.isArray(data.list)) {
    console.warn("No list found in data for time", data.time);
    continue;
  }
  const hourBucketKey = [dateHour, data.genre].join(":");
  const hourBucket = getOrCreate(hourBuckets, hourBucketKey, () => ({
    count: 0,
    genre: data.genre,
    date: data.time.slice(0, 10),
    hour: parseInt(data.time.slice(11, 13), 10),
  }));
  hourBucket.count++;
  for (const server of data.list) {
    const serverKey = [server.ip, server.port].join(":");
    const serverInfo: ServerInfo = {
      name: server.name,
      country: server.country,
      city: server.city,
      ip: server.ip,
      port: server.port,
      genre: data.genre,
    };
    serverKeySet.add(serverKey);
    const serverRowKey = [hourBucketKey, serverKey].join(":");
    getOrCreate(serverRows, serverRowKey, () => ({
      count: 0,
      serverInfo,
      hourBucket,
    })).count++;
    for (const client of server.clients || []) {
      const clientName = client.name.trim();
      const clientKey = [
        clientName,
        client.city,
        client.country,
        client.instrument,
        client.skill,
      ].join(":");
      const clientHash = crypto
        .createHash("md5")
        .update(clientKey)
        .digest("hex");
      const clientInfo: ClientInfo = {
        name: clientName,
        country: client.country,
        city: client.city,
        instrument: client.instrument,
        skill: client.skill,
      };
      const clientRowKey = [hourBucketKey, serverKey, clientHash].join(":");
      const clientRow = getOrCreate(clientRows, clientRowKey, () => ({
        count: 0,
        clientInfo,
        serverInfo,
        hourBucket,
      }));
      clientRow.count++;
      clientKeySet.add(clientHash);
    }
  }
}

console.log("Number of data points scanned:", dataPoints);
console.log("Number of servers:", serverKeySet.size);
console.log("Number of server rows:", serverRows.size);
console.log("Number of clients:", clientKeySet.size);
console.log("Number of client rows:", clientRows.size);

const clientOutFilePath = `out.local/${date}.clients.ndjson`;
fs.writeFileSync(
  clientOutFilePath,
  Array.from(clientRows.values())
    .map((row) => {
      const total = row.hourBucket.count;
      const count = row.count;
      const seen = count / total;
      return (
        JSON.stringify({
          date: row.hourBucket.date,
          hour: row.hourBucket.hour,
          hours_seen: seen,
          client_name: row.clientInfo.name,
          client_country: row.clientInfo.country,
          client_city: row.clientInfo.city,
          client_instrument: row.clientInfo.instrument,
          client_skill: row.clientInfo.skill,
          server_name: row.serverInfo.name,
          server_country: row.serverInfo.country,
          server_city: row.serverInfo.city,
          server_ip: row.serverInfo.ip,
          server_port: row.serverInfo.port,
          server_directory_name: row.serverInfo.genre,
        }) + "\n"
      );
    })
    .join("")
);
console.log("Wrote client data to", clientOutFilePath);

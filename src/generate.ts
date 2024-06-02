import fs from "fs";
import zlib from "zlib";

const date = process.argv[2];
const inputFilePath = `data.local/${date}.ndjson.br`;

const lines = zlib
  .brotliDecompressSync(fs.readFileSync(inputFilePath))
  .toString()
  .split("\n");

console.log("Number of lines:", lines.length);

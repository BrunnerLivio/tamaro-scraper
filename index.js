// @ts-check
import axios from "axios";
import { createMarkdownArrayTable } from "parse-markdown-table";
import { Parser } from "@json2csv/plainjs";
import fs from "fs/promises";

const TAMARO_VERSION = process.argv[2] ? "@" + process.argv[2] : "";

// Get the README.md from the tamaro-core package
const data = await axios.get(
  `https://unpkg.com/@raisenow/tamaro-core${TAMARO_VERSION}/dist/README.md`
);

// Find the table in the README.md
const regex = /## Configuration options(\n|.)*?(\|(\n|.)*?)##/gm;
const res = regex.exec(data.data);

if (!res) {
  throw new Error("Could not find table");
}

// Parse the table and convert it to processable JSON array
const table = await createMarkdownArrayTable(res[2]);
const csvData = [];
for await (const row of table.rows) {
  const csvObj = {};
  const key = /\[(.*)\](.*)/g.exec(row[0]) || row[0];
  csvObj[table.headers[0]] = key[1];
  csvObj[table.headers[1]] = row[1].replace(/`/g, "");
  csvObj[table.headers[2]] = row[2];
  csvData.push(csvObj);
}

// Convert to CSV and write to file
try {
  const parser = new Parser({
    delimiter: "\t",
  });
  const csv = parser.parse(csvData);
  fs.writeFile("config.csv", csv.replace(/"/g, ""));
} catch (err) {
  console.error(err);
}

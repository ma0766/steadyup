import fs from "node:fs";
const stack = process.argv[2] ?? "SteadyUp";
const o = JSON.parse(fs.readFileSync("cdk-outputs.json", "utf8"))[stack];
fs.mkdirSync("config", { recursive: true });
fs.writeFileSync("config/endpoints.json", JSON.stringify({ wsUrl: o.WsUrl, webUrl: o.WebUrl, apiUrl: o.ApiUrl, tableName: o.TableName }, null, 2) + "\n");
console.log(`wrote config/endpoints.json from stack ${stack}`);

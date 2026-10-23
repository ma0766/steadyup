import fs from "node:fs";
const o = JSON.parse(fs.readFileSync("cdk-outputs.json", "utf8")).SteadyUp;
fs.mkdirSync("config", { recursive: true });
fs.writeFileSync("config/endpoints.json", JSON.stringify({ wsUrl: o.WsUrl, webUrl: o.WebUrl }, null, 2) + "\n");
console.log("wrote config/endpoints.json");

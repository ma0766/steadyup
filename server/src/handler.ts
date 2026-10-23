// WebSocket relay Lambda — one function handles $connect / $disconnect / $default.
import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { handle, randomCode, type Deps } from "./pairing";
import { cachedStore, dynamoStore } from "./store-dynamo";

const store = cachedStore(dynamoStore(process.env.TABLE ?? "steadyup"));

// One client per endpoint, reused across invocations: keep-alive sockets mean no DNS lookup per message.
// (A new client per call hammered the Lambda resolver and failed with getaddrinfo EBUSY under load.)
const clients = new Map<string, ApiGatewayManagementApiClient>();
const clientFor = (endpoint: string) => {
  let c = clients.get(endpoint);
  if (!c) clients.set(endpoint, (c = new ApiGatewayManagementApiClient({ endpoint, maxAttempts: 3 })));
  return c;
};

const TRANSIENT = new Set(["EBUSY", "EAI_AGAIN", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND"]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;
  const api = clientFor(`https://${domainName}/${stage}`);
  // WebSocket events carry the caller's address in requestContext.identity; wrong-number tries are counted per address
  const addr = (event.requestContext as unknown as { identity?: { sourceIp?: string } }).identity?.sourceIp ?? "unknown";
  const deps: Deps = {
    addr,
    store,
    now: Date.now,
    genCode: randomCode,
    send: async (id, text) => {
      for (let attempt = 0; ; attempt++) {
        try {
          await api.send(new PostToConnectionCommand({ ConnectionId: id, Data: Buffer.from(text) }));
          return true;
        } catch (e: any) {
          if (e.name === "GoneException" || e.$metadata?.httpStatusCode === 410) return false;
          if (attempt < 3 && TRANSIENT.has(e.code)) { await sleep(40 * (attempt + 1)); continue; }
          throw e;
        }
      }
    },
  };
  await handle(routeKey, connectionId, event.body, deps);
  return { statusCode: 200 };
};

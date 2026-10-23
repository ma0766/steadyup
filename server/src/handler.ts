// WebSocket relay Lambda — one function handles $connect / $disconnect / $default.
import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { handle, randomCode, type Deps } from "./pairing";
import { cachedStore, dynamoStore } from "./store-dynamo";

const store = cachedStore(dynamoStore(process.env.TABLE ?? "steadyup"));

export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;
  const api = new ApiGatewayManagementApiClient({ endpoint: `https://${domainName}/${stage}` });
  const deps: Deps = {
    store,
    now: Date.now,
    genCode: randomCode,
    send: async (id, text) => {
      try {
        await api.send(new PostToConnectionCommand({ ConnectionId: id, Data: Buffer.from(text) }));
        return true;
      } catch (e: any) {
        if (e.name === "GoneException" || e.$metadata?.httpStatusCode === 410) return false;
        throw e;
      }
    },
  };
  await handle(routeKey, connectionId, event.body, deps);
  return { statusCode: 200 };
};

// WebSocket relay Lambda — one function handles $connect / $disconnect / $default.
// S0: echo. Later slices add pairing + relay through the `type` field.
import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

export async function route(
  routeKey: string,
  body: string | undefined,
  reply: (text: string) => Promise<void>,
): Promise<{ statusCode: number }> {
  if (routeKey === "$default" && body !== undefined) {
    await reply(body); // echo: proves the deployed socket path end to end
  }
  return { statusCode: 200 };
}

export const handler = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2> => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;
  const api = new ApiGatewayManagementApiClient({ endpoint: `https://${domainName}/${stage}` });
  return route(routeKey, event.body, async (text) => {
    await api.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: Buffer.from(text) }));
  });
};

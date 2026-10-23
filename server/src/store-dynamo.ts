// DynamoDB-backed Store. Single table: pk = CODE#<code> | CONN#<id>, sk = "v". TTL attribute "ttl" (epoch s).
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { CodeRec, ConnRec, FailRec, RoomRec, Store } from "./pairing";
import type { SetRec } from "./summary";
import type { Plan } from "./plan";

export function dynamoStore(table: string, client = DynamoDBDocumentClient.from(new DynamoDBClient({}))): Store {
  const ttl = (secs: number) => Math.floor(Date.now() / 1000) + secs;
  return {
    async putCode(rec: CodeRec) {
      try {
        await client.send(new PutCommand({
          TableName: table, Item: { pk: `CODE#${rec.code}`, sk: "v", ...rec, ttl: ttl(1800) },
          ConditionExpression: "attribute_not_exists(pk)",
        }));
        return true;
      } catch (e: any) {
        if (e.name === "ConditionalCheckFailedException") return false;
        throw e;
      }
    },
    async getCode(code) {
      const r = await client.send(new GetCommand({ TableName: table, Key: { pk: `CODE#${code}`, sk: "v" }, ConsistentRead: true }));
      return r.Item as CodeRec | undefined;
    },
    async claimCode(code, phoneConn, now) {
      try {
        await client.send(new UpdateCommand({
          TableName: table, Key: { pk: `CODE#${code}`, sk: "v" },
          UpdateExpression: "SET used = :t, phoneConn = :p",
          ConditionExpression: "used = :f AND expiresAt > :now",
          ExpressionAttributeValues: { ":t": true, ":f": false, ":p": phoneConn, ":now": now },
        }));
        return true;
      } catch (e: any) {
        if (e.name === "ConditionalCheckFailedException") return false;
        throw e;
      }
    },
    async getConn(id) {
      const r = await client.send(new GetCommand({ TableName: table, Key: { pk: `CONN#${id}`, sk: "v" }, ConsistentRead: true }));
      return r.Item as ConnRec | undefined;
    },
    async putConn(rec) {
      await client.send(new PutCommand({ TableName: table, Item: { pk: `CONN#${rec.connId}`, sk: "v", ...rec, ttl: ttl(86400) } }));
    },
    async delConn(id) {
      await client.send(new DeleteCommand({ TableName: table, Key: { pk: `CONN#${id}`, sk: "v" } }));
    },
    // History: counts only. pk = HOME#<id>, sk = SET#<day>#<session>#<idx> so a day range is one key-range query.
    async putSet(home, r: SetRec) {
      await client.send(new PutCommand({
        TableName: table,
        Item: { pk: `HOME#${home}`, sk: `SET#${r.day}#${r.session}#${String(r.idx).padStart(3, "0")}`, ...r, ttl: ttl(90 * 86400) },
      }));
    },
    async getFail(addr) {
      const r = await client.send(new GetCommand({ TableName: table, Key: { pk: `FAIL#${addr}`, sk: "v" }, ConsistentRead: true }));
      return r.Item ? ({ count: r.Item.count, windowStart: r.Item.windowStart, blockedUntil: r.Item.blockedUntil } as FailRec) : undefined;
    },
    async putFail(addr, rec) {
      await client.send(new PutCommand({ TableName: table, Item: { pk: `FAIL#${addr}`, sk: "v", ...rec, ttl: ttl(600) } }));
    },
    async delRoom(code) {
      await client.send(new DeleteCommand({ TableName: table, Key: { pk: `ROOM#${code}`, sk: "v" } }));
    },
    async putRoom(rec: RoomRec) {
      try {
        await client.send(new PutCommand({ TableName: table, Item: { pk: `ROOM#${rec.code}`, sk: "v", ...rec, ttl: ttl(1800) }, ConditionExpression: "attribute_not_exists(pk)" }));
        return true;
      } catch (e: any) { if (e.name === "ConditionalCheckFailedException") return false; throw e; }
    },
    async getRoom(code) {
      const r = await client.send(new GetCommand({ TableName: table, Key: { pk: `ROOM#${code}`, sk: "v" }, ConsistentRead: true }));
      return r.Item as RoomRec | undefined;
    },
    async addGuest(code, conn) {
      await client.send(new UpdateCommand({
        TableName: table, Key: { pk: `ROOM#${code}`, sk: "v" },
        UpdateExpression: "SET guests = list_append(if_not_exists(guests, :e), :g)",
        ExpressionAttributeValues: { ":e": [], ":g": [conn] },
      }));
    },
    async getPlan(home) {
      const r = await client.send(new GetCommand({ TableName: table, Key: { pk: `HOME#${home}`, sk: "PLAN" }, ConsistentRead: true }));
      return r.Item ? ({ targets: r.Item.targets, changes: r.Item.changes, source: r.Item.source, updatedAt: r.Item.updatedAt } as Plan) : undefined;
    },
    async putPlan(home, plan) {
      await client.send(new PutCommand({ TableName: table, Item: { pk: `HOME#${home}`, sk: "PLAN", ...plan, ttl: ttl(90 * 86400) } }));
    },
    async listSets(home, from, to) {
      const r = await client.send(new QueryCommand({
        TableName: table, ConsistentRead: true,
        KeyConditionExpression: "pk = :p AND sk BETWEEN :a AND :b",
        ExpressionAttributeValues: { ":p": `HOME#${home}`, ":a": `SET#${from}`, ":b": `SET#${to}~` },
      }));
      return (r.Items ?? []).map(({ session, idx, move, side, target, done, cues, day, ts }) => ({ session, idx, move, side, target, done, cues, day, ts })) as SetRec[];
    },
  };
}

// Lambda containers are reused: cache peer lookups so relayed frames skip a DynamoDB read.
export function cachedStore(inner: Store): Store {
  const conns = new Map<string, ConnRec | undefined>();
  return {
    ...inner,
    async getConn(id) {
      if (conns.has(id)) return conns.get(id);
      const r = await inner.getConn(id);
      if (r?.peer) conns.set(id, r);
      return r;
    },
    async putConn(rec) { if (rec.peer) conns.set(rec.connId, rec); else conns.delete(rec.connId); await inner.putConn(rec); }, // only cache paired records: an unpaired one may be stale on another instance
    async delConn(id) { conns.delete(id); await inner.delConn(id); },
  };
}

// Phone-side pairing client: open socket, say join, report friendly status.
export type PairEvent =
  | { kind: "connected" }
  | { kind: "problem"; message: string }
  | { kind: "message"; data: any };

export const CONNECTION_PROBLEM = "We lost the connection. Please try again.";

export function joinTv(wsUrl: string, code: string, on: (e: PairEvent) => void): { send: (o: unknown) => void; close: () => void } {
  const ws = new WebSocket(wsUrl);
  let paired = false;
  ws.onopen = () => ws.send(JSON.stringify({ type: "join", code }));
  ws.onmessage = (ev) => {
    let m: any; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.type === "paired") { paired = true; on({ kind: "connected" }); }
    else if (m.type === "error") on({ kind: "problem", message: m.message });
    else if (m.type === "peer-left") on({ kind: "problem", message: "The TV went away. Open SteadyUp on the TV again." });
    else on({ kind: "message", data: m });
  };
  ws.onerror = () => on({ kind: "problem", message: CONNECTION_PROBLEM });
  ws.onclose = () => { if (!paired) on({ kind: "problem", message: CONNECTION_PROBLEM }); };
  return { send: (o) => ws.send(JSON.stringify(o)), close: () => ws.close() };
}

export async function loadConfig(): Promise<{ wsUrl: string }> {
  const r = await fetch("./config.json", { cache: "no-store" });
  return r.json();
}

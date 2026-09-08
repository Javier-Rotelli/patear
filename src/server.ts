import { createWsRelayServer } from "@trystero-p2p/ws-relay/server";

const host = process.env.SERVER_HOST || "0.0.0.0";
const port = Number(process.env.SERVER_PORT) || 8082;
const server = createWsRelayServer({ host: host, port: port });

server.ready.then(() => {
  console.log(`Websocket address is ${JSON.stringify(server.address())}`);
  console.log(`WebSocket relay server is running on ws://${host}:${port}`);

  server.wss.on("connection", () => {
    console.log("New WebSocket connection established");
    console.log(`Current subscriber count: ${server.getSubscriberCount()}`);
  });
});

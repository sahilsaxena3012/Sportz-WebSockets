import express from "express";
import { matchRouter } from "./routes/matches.js";
import http from "http";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./routes/arcjet.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Express server is running." });
});

app.use(securityMiddleware());

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
server.listen(PORT, HOST, () => {
  const baseurl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server Is Running At ${baseurl}`);
  console.log(
    `WebSocket Server is running on ${baseurl.replace("http", "ws")}/ws`,
  );
});

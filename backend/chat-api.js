const WebSocket = require('ws');
const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PYTHON_RAG_URL = 'ws://127.0.0.1:8000/chat';

wss.on('connection', (clientSocket) => {
  console.log("🔌 Frontend connected to Node WebSocket");

  const backendSocket = new WebSocket(PYTHON_RAG_URL);

  backendSocket.on('open', () => {
    console.log("⚡ Connected to Python RAG WebSocket");

    clientSocket.on('message', (message) => {
      console.log("⬅️ Client -> Node -> Python:", message.toString());
      backendSocket.send(message.toString());
    });

    backendSocket.on('message', (message) => {
      console.log("➡️ Python -> Node -> Client:", message.toString());
      clientSocket.send(message.toString());
    });
  });

  backendSocket.on('error', (err) => {
    console.error("❌ Backend WebSocket Error:", err.message);
  });

  clientSocket.on('error', (err) => {
    console.error("❌ Client WebSocket Error:", err.message);
  });

  backendSocket.on('close', () => clientSocket.close());
  clientSocket.on('close', () => backendSocket.close());
});

server.listen(4000, () => console.log("🟢 Node.js WebSocket bridge running on :4000"));

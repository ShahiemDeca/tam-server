import dotenv from 'dotenv';
import Database from "./core/Database";
import express, { Request, Response, NextFunction } from 'express';
import UserController from "./controllers/UserController";
import WebSocket from 'ws'; // Import WebSocket module
import http from 'http'; // Import WebSocket module

dotenv.config();

const database = Database.getInstance({ dbName: process.env.DB_NAME });
database.connect();

const app = express();

app.listen(process.env.APP_PORT, () => console.log(`Server is listening on port ${process.env.APP_PORT}`));
app.use(express.json());

// Handle invalid json format
app.use((error: SyntaxError, request: Request, response: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && 'status' in error && error.status === 400 && 'body' in error)
    return response.status(400).json({ message: 'Invalid JSON format' });

  next();
});

const userController = new UserController();

app.post('/register', userController.register);
app.post('/login', userController.login);
app.post('/forgot-password', userController.forgotPassword);
app.post('/reset-password', userController.resetPassword);
app.post('/logout', userController.logout);
app.post('/activate/:activationCode', userController.activateAccount);

app.get('/me', userController.verifyToken, userController.me);

// const server = app.listen(process.env.APP_PORT, () => console.log(`Server is listening on port ${process.env.APP_PORT}`));
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');


  ws.on('message', (message: WebSocket.Data) => {
    console.log(`Received: ${message}`);
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});


server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(3000, () => {
  console.log(`HTTP server listening on port 300`);
});

// // WebSocket connection handler
// wss.on('connection', function connection(ws) {
//   console.log('New WebSocket connection');

//   ws.on('message', function incoming(message) {
//     console.log('Received message:', message);
//     // Handle incoming messages here
//   });

//   ws.on('close', function close() {
//     console.log('WebSocket connection closed');
//     // Handle WebSocket connection close
//   });
// });

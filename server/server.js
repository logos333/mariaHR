import express from 'express'
import { WebSocketServer } from 'ws';
import msgCommands from '../shared/msgCommands.mjs'

const app = express();
app.use(express.json());

const messages = [];
const MAX_MESSAGES = 9;

const notifyClients = (wsServer, message) => {
    wsServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/messages', (req, res) => {
    const { text } = req.body;
    if (messages.length >= MAX_MESSAGES) {
        messages.shift();
    }
    const newMessage = { id: Date.now(), text };
    messages.push(newMessage);

    notifyClients(wss, { type: msgCommands.NEW_MESSAGE, payload: newMessage });
    res.status(201).json(newMessage);
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

const server = app.listen(3001, () => {
    console.log('HTTP server listening on port 3001');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: msgCommands.INIT, payload: messages }));
});

console.log('WebSocket server is running');

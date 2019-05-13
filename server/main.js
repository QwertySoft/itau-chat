const WebSocket = require('ws');
const faker = require('faker');

const port = process.env.PORT || 3000;
const WebSocketServer = WebSocket.Server;
const server = new WebSocketServer({ port: port });

const send = (client, payload) => client.send(JSON.stringify(payload));

const broadcast = payload => {
  server.clients.forEach(client => {
    send(client, payload);
  });
};

let channels = {};
let users = [];

const getChannel = ({ username }) => channels[username];

const compose = ({ body, to, from }) => {
  const channel = getChannel(to);
  const message = {
    type: 'NEW_MESSAGE',
    payload: { body, from, to, date: new Date() }
  };
  send(channel, message);
};

const connect = channel => {
  const name = faker.name.firstName();
  const username = faker.internet.userName(name);
  const user = {
    name,
    avatar: faker.internet.avatar(),
    username
  };

  channels[username] = channel;
  users = [...users, user];
  return user;
};

server.on('connection', ws => {
  const user = connect(ws);
  broadcast({ type: 'CONNECT', payload: { user } });
  send(ws, { type: 'REGISTER', payload: { users, user } });
  console.log(user);

  ws.on('message', payload => {
    const { body, to } = JSON.parse(payload);
    compose({ body, to, from: user });
  });

  ws.on('close', () => {
    broadcast({ type: 'DISCONNECT', payload: { user } });
    users = users.filter(u => u.username !== user.username);
  });
});

console.log('Server is running on port', 3000);

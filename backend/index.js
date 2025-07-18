import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
const PORT = 4000;
const USERS_FILE = './backend/users.json';

app.use(cors());
app.use(bodyParser.json());

// Utilitário para ler usuários
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return data ? JSON.parse(data) : [];
}

// Utilitário para salvar usuários
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Listar usuários
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// Cadastrar novo usuário
app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }
  const users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email já cadastrado.' });
  }
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password, // Em produção, nunca salve senha em texto puro!
    role,
    status: 'ativo',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  res.status(201).json(newUser);
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
}); 
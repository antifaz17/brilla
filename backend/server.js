import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// In-memory stores
const users = [];
const posts = [];

// ── Auth middleware ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autenticado.' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// ── Claude filter ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el filtro moral de "Brilla", una red social donde solo se permite contenido positivo y edificante.

APRUEBA mensajes que contengan:
- Alegría, celebración, entusiasmo genuino
- Gratitud y apreciación
- Logros personales o de otros
- Afirmaciones positivas ("Soy luz", "Hoy fue un gran día", "Lo logré")
- Inspiración, motivación sana
- Amor y conexión humana wholesome
- Humor limpio y amable

RECHAZA mensajes que contengan:
- Sexualización u objetificación de personas
- Vulgaridad, groserías o lenguaje obsceno
- Odio, discriminación o insultos
- Violencia o amenazas
- Noticias falsas o desinformación
- Negatividad, queja excesiva, pesimismo destructivo
- Contenido inapropiado aunque sea "en broma"

Responde ÚNICAMENTE con un JSON válido en este formato exacto, sin texto adicional:
{"valid": boolean, "reason": "explicación breve en español de máximo 15 palabras"}`;

async function validateWithClaude(text) {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Evalúa este mensaje: "${text}"` }],
  });
  const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(raw);
}

// ── Auth routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  if (username.length < 3) return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres.' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Ese usuario ya existe.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), username: username.trim(), password: hash };
  users.push(user);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, username: user.username });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

// ── Post routes ──────────────────────────────────────────────────────────────

app.get('/api/posts', (req, res) => res.json(posts));

app.post('/api/posts', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'El campo text es requerido.' });
  }
  try {
    const result = await validateWithClaude(text.trim());
    if (!result.valid) return res.status(422).json({ valid: false, reason: result.reason });
    const post = {
      id: Date.now(),
      text: text.trim(),
      author: req.user.username,
      createdAt: new Date().toISOString(),
    };
    posts.unshift(post);
    res.status(201).json({ valid: true, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al publicar.' });
  }
});

// ── Validate ─────────────────────────────────────────────────────────────────

app.post('/api/validate', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'El campo text es requerido.' });
  try {
    res.json(await validateWithClaude(text.trim()));
  } catch {
    res.status(500).json({ error: 'Error al validar.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Brilla backend corriendo en http://localhost:${PORT}`));

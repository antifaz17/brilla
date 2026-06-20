import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

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
- Sexualización u objetificación de personas (incluyendo referencias a partes del cuerpo en contexto sexual o degradante)
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

app.post('/api/validate', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'El campo text es requerido.' });
  }
  try {
    const result = await validateWithClaude(text.trim());
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al validar el mensaje.' });
  }
});

const posts = [];

app.post('/api/posts', async (req, res) => {
  const { text, author } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'El campo text es requerido.' });
  }
  try {
    const result = await validateWithClaude(text.trim());
    if (!result.valid) {
      return res.status(422).json({ valid: false, reason: result.reason });
    }
    const post = {
      id: Date.now(),
      text: text.trim(),
      author: (author || 'Anónimo').trim(),
      createdAt: new Date().toISOString(),
    };
    posts.unshift(post);
    res.status(201).json({ valid: true, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al publicar.' });
  }
});

app.get('/api/posts', (req, res) => {
  res.json(posts);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Brilla backend corriendo en http://localhost:${PORT}`));

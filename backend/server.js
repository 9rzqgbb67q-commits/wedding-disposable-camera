const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 🔹 ВРЕМЕННОЕ ХРАНИЛИЩЕ (потом заменим)
const tokens = {
  "demo123": {
    remaining: 5
  }
};

// 🔹 Проверка сервера
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 🔹 Получить лимит по токену
app.get('/limit', (req, res) => {
  const { token } = req.query;

  if (!token || !tokens[token]) {
    return res.status(404).json({ error: 'Invalid token' });
  }

  res.json({
    remaining: tokens[token].remaining
  });
});

// 🔹 "Сделать фото" (уменьшить лимит)
app.post('/shoot', (req, res) => {
  const { token } = req.body;

  if (!token || !tokens[token]) {
    return res.status(404).json({ error: 'Invalid token' });
  }

  if (tokens[token].remaining <= 0) {
    return res.status(400).json({ error: 'Film is over' });
  }

  tokens[token].remaining -= 1;

  res.json({
    remaining: tokens[token].remaining
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});


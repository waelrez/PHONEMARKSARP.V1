const express = require("express");

const app = express();
app.use(express.json({ limit: "10kb" }));

const WEBHOOK = process.env.POLICE_WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

// Remplace par l'origine exacte de ton site GitHub Pages.
const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "";

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    if (origin !== ALLOWED_ORIGIN) {
      return res.sendStatus(403);
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    );

    return res.sendStatus(204);
  }

  next();
});

// Limite simple par adresse IP (démo).
const lastReport = new Map();

app.post("/api/police-report", async (req, res) => {
  const username = req.body?.username;
  const message = req.body?.message;

  if (
    typeof username !== "string" ||
    typeof message !== "string" ||
    !username.trim() ||
    !message.trim() ||
    username.length > 50 ||
    message.length > 1000
  ) {
    return res.status(400).json({
      error: "Signalement invalide"
    });
  }

  const ip = req.ip;
  const now = Date.now();

  if (now - (lastReport.get(ip) || 0) < 60000) {
    return res.status(429).json({
      error: "Veuillez patienter une minute."
    });
  }

  if (!WEBHOOK) {
    return res.status(503).json({
      error: "Webhook non configuré"
    });
  }

  lastReport.set(ip, now);

  try {
    const response = await fetch(WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "DISCORD PHONE | POLICE",
        allowed_mentions: {
          parse: []
        },
        embeds: [{
          title: "🚨 NOUVEAU SIGNALEMENT 911",
          color: 15158332,
          fields: [
            {
              name: "Citoyen",
              value: username
            },
            {
              name: "Signalement",
              value: message
            }
          ],
          footer: {
            text: "Discord Phone RP"
          },
          timestamp: new Date().toISOString()
        }]
      })
    });

    if (!response.ok) {
      throw new Error("Discord HTTP " + response.status);
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Discord error:", error.message);

    res.status(502).json({
      error: "Impossible d'envoyer le signalement."
    });
  }
});

app.listen(PORT, () => {
  console.log("Discord Phone API sur port " + PORT);
});

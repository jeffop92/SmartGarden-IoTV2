require("dotenv").config();

const { default: TelegramBot } = require("node-telegram-bot-api");
const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./firebase-service-account.json");

// --------------------------------------------------
// Firebase
// --------------------------------------------------

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-garden-60bf2-default-rtdb.firebaseio.com",
});

const db = getDatabase();

// --------------------------------------------------
// Telegram
// --------------------------------------------------

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN no está configurado.");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("======================================");
console.log(" SmartGarden - Telegram Bot");
console.log("======================================");
console.log("Bot iniciado correctamente.");
console.log("Esperando mensajes...");

// --------------------------------------------------
// /start
// --------------------------------------------------

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const message =
    "🌱 *SmartGarden IoT*\n\n" +
    "Bienvenido al sistema de monitoreo.\n\n" +
    "Puedes utilizar los siguientes comandos:\n\n" +
    "📊 /estado - Ver estado actual\n" +
    "❓ /ayuda - Ver comandos disponibles";

  await bot.sendMessage(chatId, message, {
    parse_mode: "Markdown",
  });
});

// --------------------------------------------------
// /ayuda
// --------------------------------------------------

bot.onText(/\/ayuda/, async (msg) => {
  const chatId = msg.chat.id;

  const message =
    "🌱 *SmartGarden IoT*\n\n" +
    "*Comandos disponibles:*\n\n" +
    "📊 /estado\n" +
    "Consulta las mediciones actuales.\n\n" +
    "❓ /ayuda\n" +
    "Muestra esta ayuda.";

  await bot.sendMessage(chatId, message, {
    parse_mode: "Markdown",
  });
});

// --------------------------------------------------
// /estado
// --------------------------------------------------

bot.onText(/\/estado/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const snapshot = await db
      .ref("/smartgarden/sensors/current")
      .once("value");

    if (!snapshot.exists()) {
      await bot.sendMessage(
        chatId,
        "⚠️ No hay datos disponibles en Firebase."
      );
      return;
    }

    const data = snapshot.val();

    const humidity = data.humidity ?? "N/D";
    const soilMoisture = data.soilMoisture ?? "N/D";
    const temperature = data.temperature ?? "N/D";
    const ph = data.ph ?? "N/D";
    const pumpIsOn = data.pumpIsOn === true;

    const message =
      "🌱 *SmartGarden IoT*\n\n" +
      "📊 *Estado actual*\n\n" +
      `💧 Humedad del suelo: *${soilMoisture}*\n` +
      `🌡️ Temperatura: *${temperature} °C*\n` +
      `💦 Humedad del aire: *${humidity} %*\n` +
      `🧪 pH: *${ph}*\n` +
      `🚰 Bomba: *${pumpIsOn ? "ENCENDIDA" : "APAGADA"}*`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error consultando Firebase:", error);

    await bot.sendMessage(
      chatId,
      "❌ No fue posible consultar los datos de SmartGarden."
    );
  }
});
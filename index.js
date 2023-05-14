require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const mySecret = process.env["TOKEN"];
const keepAlive = require("./server");
const Database = require("@replit/database");
const dbURL = process.env.REPLIT_DB_URL;

const db = new Database(dbURL);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const sadWords = [
  "sad",
  "depressed",
  "depressing",
  "frustrated",
  "unhappy",
  "angry",
  "anxious",
  "lonely",
];

const starterEncouragements = [
  "Cheer up!",
  "Hang in there.",
  "Darkness cannot overcome the light.",
  "You can do it!",
  "I believe in you!",
  "Don't give up!",
];

db.get("encouragements").then((encouragements) => {
  if (!encouragements || encouragements.length < 1) {
    db.set("encouragements", starterEncouragements);
  }
});

db.get("responding").then((value) => {
  if (value == null) {
    db.set("responding", true);
  }
});

const myUrl = "https://zenquotes.io/api/random";

async function getQuote() {
  const res = await fetch(myUrl);
  const data = await res.json();
  return data[0]["q"] + " -" + data[0]["a"];
}

function updateEncouragements(encouragingMessage) {
  db.get("encouragements").then((encouragements) => {
    encouragements.push(encouragingMessage);
    db.set("encouragements", encouragements);
  });
}

async function deleteEncouragements(index) {
  return await db.get("encouragements").then((encouragements) => {
    let deletedMsg;
    if (encouragements.length > index) {
      deletedMsg = encouragements.splice(index, 1);
      db.set("encouragements", encouragements);
    }
    return deletedMsg;
  });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "$inspire") {
    getQuote().then((quote) => message.channel.send(quote));
  }

  db.get("responding").then((responding) => {
    console.log("responding:", responding);
    if (!responding) {
      db.set("responding", true);
    }
    if (responding && sadWords.some((word) => message.content.includes(word))) {
      console.log("message contains sad word:", message.content);
      db.get("encouragements").then((encouragements) => {
        console.log("encouragements:", encouragements);
        const encouragement =
          encouragements[Math.floor(Math.random() * encouragements.length)];
        console.log("encouragement:", encouragement);
        message.reply({
          content: `${encouragement}`,
        });
      });
    }
  });

  if (message.content.startsWith("$new")) {
    encouragingMessage = message.content.split("$new ")[1];
    updateEncouragements(encouragingMessage);
    message.channel.send("New encouraging message added.");
  }

  if (message.content.startsWith("$del")) {
    index = parseInt(message.content.split("$del ")[1]);
    const deletedMessage = await deleteEncouragements(index);
    message.channel.send(`Encouraging message deleted: \n "${deletedMessage}"`);
  }

  if (message.content.startsWith("$list")) {
    db.get("encouragements").then((encouragements) => {
      if (encouragements && encouragements.length > 0) {
        const messageText = encouragements.join("\n");
        message.channel.send(`List of encouragements:\n${messageText}`);
      } else {
        message.channel.send("No encouragements found.");
      }
    });
  }

  if (message.content.startsWith("$help")) {
    message.channel.send(
      `\n$inspire - Get a random inspirational quote
\n$new - Add a new encouraging message
\n$del - Delete an encouraging message
\n$list - List all the encouraging messages
\n$responding - Toggle responding to sad words
\n$help - Show this message`
    );
  }

  if (message.content.startsWith("$responding")) {
    value = message.content.split("$responding ")[1];
    if (value && value.toLowerCase() === "true") {
      db.set("responding", true);
      message.channel.send("Responding is On");
    } else {
      db.set("responding", false);
      message.channel.send("Responding is Off");
    }
  }
});

keepAlive();

client.login(mySecret);

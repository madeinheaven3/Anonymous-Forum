const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const app = express();

let posts = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function generateCaptcha() {
  const a = Math.floor(Math.random() * 5 + 1);
  const b = Math.floor(Math.random() * 5 + 1);
  return { a, b, result: a + b };
}

let captchaCache = generateCaptcha(); // bleibt konstant

// Startseite
app.get("/", (req, res) => {
  const { a, b, result } = captchaCache;
  res.send(`
    <!DOCTYPE html><html><head>
    <link rel="stylesheet" href="/style.css">
    <title>Anonymous Forum</title></head><body>
    <h1>Anonymous Forum</h1>
    <p>Enter your username (max 12 characters) and solve the math challenge.</p>
    <form method="POST" action="/forum">
      <input type="text" name="username" maxlength="12" placeholder="Username" required><br><br>
      <label>What is <b>${a} + ${b}</b>?</label><br>
      <input type="text" name="captchaInput" placeholder="Just the number" required><br>
      <input type="hidden" name="captchaExpected" value="${result}">
      <br><button>Enter Forum</button>
    </form>
    </body></html>
  `);
});

// Forum-Ansicht
app.post("/forum", (req, res) => {
  const username = req.body.username?.substring(0, 12).replace(/</g, "&lt;");
  const captchaInput = parseInt(req.body.captchaInput);
  const captchaExpected = parseInt(req.body.captchaExpected);

  if (captchaInput !== captchaExpected) return res.redirect("/");

  renderForum(res, username);
});

// Beitrag posten
app.post("/post", (req, res) => {
  const text = req.body.text?.trim().replace(/</g, "&lt;");
  const username = req.body.username?.substring(0, 12).replace(/</g, "&lt;");
  const replyTo = req.body.replyTo?.trim();
  const timestamp = new Date().toLocaleString("en-GB");

  if (text && username) {
    posts.unshift({ id: uuidv4(), username, text, timestamp, replyTo });
  }

  renderForum(res, username);
});

// Beitrag löschen
app.post("/delete", (req, res) => {
  const id = req.body.id;
  const username = req.body.username;
  posts = posts.filter(p => p.id !== id);
  renderForum(res, username);
});

// HTML rendern
function renderForum(res, username) {
  let html = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/style.css">
  <title>Forum – ${username}</title></head><body>
  <h2>Welcome, ${username}</h2>
  <form method="POST" action="/post">
    <input type="hidden" name="username" value="${username}">
    <textarea name="text" rows="5" placeholder="Your message..."></textarea><br>
    <button>Post</button>
  </form><hr>`;

  posts.forEach(p => {
    html += `
    <div class="post">
      <b>${p.username}</b> <span class="timestamp">[${p.timestamp}]</span><br>
      ${p.replyTo ? `<i>Replying to: ${p.replyTo}</i><br>` : ""}
      ${p.text}
      <form method="POST" action="/delete" style="display:inline;">
        <input type="hidden" name="id" value="${p.id}">
        <input type="hidden" name="username" value="${username}">
        <button class="delete-button">Delete</button>
      </form>
      <form method="POST" action="/post" style="display:inline; margin-left: 10px;">
        <input type="hidden" name="username" value="${username}">
        <input type="hidden" name="replyTo" value="${p.username}">
        <input type="text" name="text" placeholder="Reply to ${p.username}" required>
        <button>Reply</button>
      </form>
    </div>`;
  });

  html += `</body></html>`;
  res.send(html);
}

app.listen(3000, () => console.log("Forum is running"));

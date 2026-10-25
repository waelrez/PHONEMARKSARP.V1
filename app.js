let currentUser = null;
let userData = null;

function getKey() {
  return "discord_phone_" + currentUser;
}

function saveData() {
  if (!currentUser) return;
  localStorage.setItem(getKey(), JSON.stringify(userData));
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (window.DEMO_USERS[username] !== password ||
      !Object.hasOwn(window.DEMO_USERS, username)) {
    document.getElementById("loginError").textContent =
      "Identifiants incorrects.";
    return;
  }

  currentUser = username;

  try {
    userData = JSON.parse(localStorage.getItem(getKey()));
  } catch {
    userData = null;
  }

  if (!userData || typeof userData !== "object") {
    userData = {
      activated: false,
      phoneName: "",
      tweets: [],
      installedApps: []
    };
  }

  sessionStorage.setItem("phone_user", username);

  if (userData.activated) {
    loadHome();
  } else {
    showScreen("activation");
  }
}

function activate() {
  const name = document.getElementById("phoneName").value.trim();

  userData.phoneName = name || "Mon iPhone";
  userData.activated = true;

  saveData();
  loadHome();
}

function loadHome() {
  document.getElementById("welcome").textContent =
    userData.phoneName || "Mon iPhone";

  document.getElementById("settingsName").value =
    userData.phoneName || "";

  document.getElementById("accountInfo").textContent =
    "Utilisateur : " + currentUser;

  renderTweets();
  showScreen("home");
}

function openApp(app) {
  if (!currentUser) {
    showScreen("login");
    return;
  }

  showScreen(app);
}

function goHome() {
  if (currentUser && userData?.activated) {
    loadHome();
  } else {
    showScreen("login");
  }
}

function logout() {
  currentUser = null;
  userData = null;
  sessionStorage.removeItem("phone_user");
  document.getElementById("password").value = "";
  showScreen("login");
}

function callNumber() {
  const number = document.getElementById("dialNumber").value.trim();

  if (number === "911") {
    openApp("police");
    return;
  }

  document.getElementById("callResult").textContent =
    number
      ? "Appel RP vers " + number + " (simulation)"
      : "Entrez un numéro.";
}

function publishTweet() {
  const input = document.getElementById("tweetText");
  const message = input.value.trim();

  if (!message) return;

  if (!Array.isArray(userData.tweets)) {
    userData.tweets = [];
  }

  userData.tweets.unshift({
    message: message,
    date: new Date().toLocaleString("fr-FR")
  });

  saveData();
  input.value = "";
  renderTweets();
}

function renderTweets() {
  const container = document.getElementById("tweets");
  container.replaceChildren();

  for (const tweet of (userData?.tweets || [])) {
    const article = document.createElement("div");
    article.className = "tweet";

    const title = document.createElement("strong");
    title.textContent = "@" + currentUser;

    const body = document.createElement("p");
    body.textContent = tweet.message;

    const date = document.createElement("small");
    date.textContent = tweet.date;

    article.append(title, body, date);
    container.appendChild(article);
  }
}

function installApp(name) {
  if (!Array.isArray(userData.installedApps)) {
    userData.installedApps = [];
  }

  if (!userData.installedApps.includes(name)) {
    userData.installedApps.push(name);
    saveData();
  }

  document.getElementById("storeStatus").textContent =
    name + " ajouté à votre liste d'applications.";
}

function saveSettings() {
  userData.phoneName =
    document.getElementById("settingsName").value.trim() ||
    "Mon iPhone";

  saveData();
  loadHome();
}

async function sendPoliceReport() {
  const message = document.getElementById("policeReport").value.trim();
  const status = document.getElementById("reportStatus");

  if (!message) {
    status.textContent = "Veuillez écrire un signalement.";
    return;
  }

  status.textContent = "Envoi en cours...";

  try {
    const response = await fetch(
      window.PHONE_CONFIG.API_URL + "/api/police-report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: currentUser,
          message: message
        })
      }
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    status.textContent = "Signalement envoyé à la police RP.";
    document.getElementById("policeReport").value = "";

  } catch (error) {
    status.textContent =
      "Échec de l'envoi. Vérifiez la connexion au serveur.";
  }
}

setInterval(() => {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
}, 1000);

document.getElementById("clock").textContent =
  new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

const previousUser = sessionStorage.getItem("phone_user");

if (previousUser && Object.hasOwn(window.DEMO_USERS, previousUser)) {
  currentUser = previousUser;

  try {
    userData = JSON.parse(localStorage.getItem(getKey()));
  } catch {
    userData = null;
  }

  if (userData?.activated) {
    loadHome();
  } else {
    showScreen("login");
  }
}

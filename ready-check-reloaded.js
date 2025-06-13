import { registerSettings } from "./scripts/settings.js";
import { ReadyCheckApp } from "./scripts/ReadyCheckApp.js";

Hooks.once("init", () => {
  registerSettings();
  createSocketHandler();
});

Hooks.once("ready", async() => {
  // If there's an active ready check, display it
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  await game.user.setFlag('ready-check-reloaded','isReady', false);
  const isReady = game.user.flags['ready-check-reloaded'].isReady;
  if(checkIsActive){
    openReadyCheckApp();
    const socketData = {
      user: game.user,
      action: "UPDATE_STATUS",
      isReady: isReady
    };
    game.socket.emit('module.ready-check-reloaded', socketData);
  }
})

Hooks.on('renderPlayers', async function(){
  // Create controls div
  let controlsDiv = document.createElement("div");
  controlsDiv.id = "ready-check-reloaded-controls";

  // Add start check button
  if(game.user.isGM){  
    let startCheckBtn = document.createElement("button");
    startCheckBtn.id = "ready-check-reloaded-start";
    startCheckBtn.classList = ["ui-control"];
    startCheckBtn.setAttribute("data-tooltip","Start Ready Check");
    startCheckBtn.ariaLabel = "Start Ready Check";
    startCheckBtn.innerHTML = `<i class="fas fa-check-to-slot"></i>`;
    controlsDiv.appendChild(startCheckBtn);
  }

  // Add status toggle button
  let toggleStatusBtn = document.createElement("button");
  toggleStatusBtn.id = "ready-check-reloaded-toggle";
  toggleStatusBtn.classList = ["ui-control"];
  toggleStatusBtn.setAttribute("data-tooltip","Toggle Ready Status");
  toggleStatusBtn.ariaLabel = "Toggle Ready Status";
  toggleStatusBtn.innerHTML = `<i class="fas fa-hourglass-half"></i>`;
  controlsDiv.appendChild(toggleStatusBtn);

  // Add controls div to players panel
  const playersPanel = document.querySelector("#players");
  playersPanel.appendChild(controlsDiv);

  // Add status indicators to player window
  game.users.contents.forEach(u => {
    const isReady = u.getFlag("ready-check-reloaded", "isReady");
    const userId = u._id;
    const playersWindowRow = document.querySelector(`#players #players-active .players-list li[data-user-id="${userId}"]`);
    
    if(playersWindowRow){
      let readyIcon = document.createElement("i");
      readyIcon.classList.add("fas", "fa-check","ready-check-reloaded-status", "ready")
      readyIcon.title = "Ready";
  
      let notReadyIcon = document.createElement("i");
      notReadyIcon.classList.add("fas", "fa-times","ready-check-reloaded-status", "not-ready")
      notReadyIcon.title = "Not Ready";
  
      playersWindowRow.append(isReady ? readyIcon : notReadyIcon);
    }
  });

  // Activate controls listeners
  activateListeners();
});

function createSocketHandler(){
  game.socket.on('module.ready-check-reloaded', async (data) => {
    /*
      data: {
        fromUser: string
        action: "START_CHECK" "END_CHECK" or "UPDATE_STATUS"
        isReady: true or false
      }
    */
    if(data.action === 'START_CHECK'){
      recieveReadyCheck();
    }
    else if (data.action === 'END_CHECK'){
      closeReadyCheckApp();
    }
    else if (data.action === 'UPDATE_STATUS'){
      recieveStatusUpdate(data);
    } else {
      console.warn(`Ready Set Go: Reloaded | Instruction type {${action}} not recognized.`)
    }
  });
}

function activateListeners(){
  const startBtn = document.querySelector('#ready-check-reloaded-start');
  if(startBtn){
    startBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      startReadyCheck();
    });
  }

  const toggleBtn = document.querySelector('#ready-check-reloaded-toggle');
  if(toggleBtn){
    toggleBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      toggleReadyStatus();
    });
  }
};

async function startReadyCheck(){
  if(!game.user.isGM) return;
  await game.user.setFlag('ready-check-reloaded','isReady', false);
  await game.users.contents.filter(u => !u.active).forEach(async u => { await u.setFlag('ready-check-reloaded','isReady', false)});
  await game.settings.set('ready-check-reloaded','checkIsActive', true);
  
  openReadyCheckApp();
  playReadyCheckAlert();
  const socketData = {
    user: game.user,
    action: "START_CHECK"
  };
  game.socket.emit('module.ready-check-reloaded', socketData);
}

async function recieveReadyCheck(){
  await game.user.setFlag('ready-check-reloaded','isReady', false);
  openReadyCheckApp();
  const socketData = {
    user: game.user,
    action: "UPDATE_STATUS",
    isReady: false
  };
  game.socket.emit('module.ready-check-reloaded', socketData);
  ui.players.render();
}

export async function toggleReadyStatus(){
  const isReady = !game.user.flags['ready-check-reloaded'].isReady;
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  await game.user.setFlag('ready-check-reloaded','isReady', isReady);
  if(checkIsActive){
    const alertSound = game.settings.get('ready-check-reloaded','responseAlertSoundPath');
    playResponseAlert(alertSound, isReady);
    openReadyCheckApp();
  } else {
    sendChatMessage(game.user, isReady);
  }
  const socketData = {
    user: game.user,
    action: "UPDATE_STATUS",
    isReady: isReady
  };
  game.socket.emit('module.ready-check-reloaded', socketData);
  ui.players.render();
}

function recieveStatusUpdate(data){
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  if(checkIsActive){
    openReadyCheckApp();
  }
  ui.players.render();
}

function openReadyCheckApp(){
  const rca = new ReadyCheckApp;
  rca.render(true)
}

async function closeReadyCheckApp(){
  const rca = foundry.applications.instances.get("ready-check-reloaded-app");
  await rca.close();
}

function sendChatMessage(user, isReady){
  const sendMessage = game.settings.get("ready-check-reloaded", "showChatMessagesForUserUpdates");
  if(!sendMessage) return;
  const status = isReady ? "ready" : "not ready";
  const content = `${user.name} is ${status}.`;
  ChatMessage.create({speaker:{alias: "Ready Set Go: Reloaded"}, content: content});
}

function playReadyCheckAlert(){
  const playAlert = game.settings.get("ready-check-reloaded", "playAlertForCheck");
  if (!playAlert) return;
  const alertSound = game.settings.get("ready-check-reloaded", "checkAlertSoundPath");
  if(!alertSound){
    foundry.audio.AudioHelper.play({src: "modules/ready-check-reloaded/sounds/notification.mp3", volume: 1, autoplay: true, loop: false}, true);
  } else{
    foundry.audio.AudioHelper.play({src: alertSound, volume: 1, autoplay: true, loop: false}, true);
  }
}

function playResponseAlert(alertSound, isReady){
  const playAlert = game.settings.get("ready-check-reloaded", "playAlertForResponse");
  if (!playAlert || !isReady) return;
  if(!alertSound){
    foundry.audio.AudioHelper.play({src: "modules/ready-check-reloaded/sounds/notification-2.mp3", volume: 1, autoplay: true, loop: false}, true);
  } else{
    foundry.audio.AudioHelper.play({src: alertSound, volume: 1, autoplay: true, loop: false}, true);
  }
}
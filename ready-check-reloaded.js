import { registerSettings } from "./scripts/settings.js";
import ReadyCheckApp from "./scripts/ReadyCheckApp.js";

let rca = new ReadyCheckApp();

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

Hooks.on('renderPlayerList', async function(){
  // Add controls to player window
  const controls = `
    <div id="ready-check-reloaded-controls">
      <button type="button" id="ready-check-reloaded-toggle" title="Toggle Ready Status" aria-label="Toggle Ready Status"><i class="fas fa-hourglass-half"></i></button>
    </div>`;
  $("#players").append(controls);

  if(game.user.isGM){
    const startButton = `<button type="button" id="ready-check-reloaded-start" title="Start Ready Check" aria-label="Start Ready Check"><i class="fas fa-check-to-slot"></i></button>`;
    $("#ready-check-reloaded-controls").prepend(startButton);
  }

  // Add status indicators to player window
  game.users.contents.forEach(u => {
    const isReady = u.getFlag("ready-check-reloaded", "isReady");
    const userId = u._id;
    if(isReady){
      $(`[data-user-id="${userId}"]`).append(`<i class="fas fa-check ready-check-reloaded-status ready" title="Ready"></i>`);
    } else {
      $(`[data-user-id="${userId}"]`).append(`<i class="fas fa-times ready-check-reloaded-status not-ready" title="Not Ready"></i>`);
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
        alertSound: a string, path to a sound to play
      }
    */
    if(data.action === 'START_CHECK'){
      recieveReadyCheck();
    }
    else if (data.action === 'END_CHECK'){
      closeReadyCheckApp()
    }
    else if (data.action === 'UPDATE_STATUS'){
      recieveStatusUpdate(data);
    } else {
      console.warn(`Ready Set Go: Reloaded | Instruction type {${action}} not recognized.`)
    }
  });
}

function activateListeners(){
  $('#ready-check-reloaded-start').click(async (event) => {
    event.preventDefault();
    startReadyCheck();
  });
  $('#ready-check-reloaded-toggle').click(async (event) => {
    event.preventDefault();
    toggleReadyStatus();
  });
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
  playReadyCheckAlert();
  openReadyCheckApp();
  const socketData = {
    user: game.user,
    action: "UPDATE_STATUS",
    isReady: false
  };
  game.socket.emit('module.ready-check-reloaded', socketData);
}

export async function toggleReadyStatus(){
  const isReady = !game.user.flags['ready-check-reloaded'].isReady;
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  await game.user.setFlag('ready-check-reloaded','isReady', isReady);
  if(checkIsActive){
    const alertSound = game.settings.get('ready-check-reloaded','responseAlertSoundPath');
    playResponseAlert(alertSound, isReady);
    openReadyCheckApp();
    const socketData = {
      user: game.user,
      action: "UPDATE_STATUS",
      isReady: isReady,
      alertSound: alertSound
    };
    game.socket.emit('module.ready-check-reloaded', socketData);
  } else {
    sendChatMessage(game.user, isReady);
  }
}

function recieveStatusUpdate(data){
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  if(checkIsActive){
    playResponseAlert(data.alertSound, data.isReady);
    openReadyCheckApp();
  }
}

function openReadyCheckApp(){
  if(rca == null ){
    rca = new ReadyCheckApp().render(true);
  } else {
    rca.render(true);
  }
}

async function closeReadyCheckApp(){
  if(rca != null && rca.rendered){
    await rca.close();
  }
  rca = null;
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
    AudioHelper.play({src: "modules/ready-check-reloaded/sounds/notification.mp3", volume: 1, autoplay: true, loop: false}, true);
  } else{
    AudioHelper.play({src: alertSound, volume: 1, autoplay: true, loop: false}, true);
  }
}

function playResponseAlert(alertSound, isReady){
  const playAlert = game.settings.get("ready-check-reloaded", "playAlertForResponse");
  if (!playAlert || !isReady) return;
  if(!alertSound){
    AudioHelper.play({src: "modules/ready-check-reloaded/sounds/notification-2.mp3", volume: 1, autoplay: true, loop: false}, true);
  } else{
    AudioHelper.play({src: alertSound, volume: 1, autoplay: true, loop: false}, true);
  }
}
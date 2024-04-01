import { registerSettings } from "./scripts/settings.js";
import ReadyCheckApp from "./scripts/ReadyCheckApp.js";

const rca = new ReadyCheckApp();

Hooks.once("init", () => {
  registerSettings();
  createSocketHandler();
});

Hooks.once("ready", () => {
  // If there's an active ready check, display it
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  if(checkIsActive){
    openReadyCheckApp();
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
        status: true or false
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
  game.users.contents.forEach(async u => { await u.setFlag('ready-check-reloaded','isReady', false)});
  await game.settings.set('ready-check-reloaded','checkIsActive', true);
  
  openReadyCheckApp();

  const socketData = {
    user: game.user,
    action: "START_CHECK"
  };
  game.socket.emit('module.ready-check-reloaded', socketData);
}

function recieveReadyCheck(){
  openReadyCheckApp();
}

async function toggleReadyStatus(){
  const isReady = !game.user.flags['ready-check-reloaded'].isReady;
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  await game.user.setFlag('ready-check-reloaded','isReady', isReady);
  if(checkIsActive){
    openReadyCheckApp();
    const socketData = {
      user: game.user,
      action: "UPDATE_STATUS",
      isReady: isReady
    };
    game.socket.emit('module.ready-check-reloaded', socketData);
  }
}

function recieveStatusUpdate(data){
  const checkIsActive = game.settings.get('ready-check-reloaded','checkIsActive');
  if(checkIsActive){
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


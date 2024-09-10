import { toggleReadyStatus } from "../ready-check-reloaded.js";

export default class ReadyCheckApp extends Application {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "modules/ready-check-reloaded/templates/ready-check-app.hbs",
            title: "Ready Check",
            resizable: false,
            height: 356,
            width: "auto",
            id: "readycheck-app"
        });
    }

    async getData(options = {}) {
        let data = super.getData();
        data.isGm = game.user.isGM;
        data.isReady = game.user.flags['ready-check-reloaded'].isReady;
        data.users = game.users.map(u => {
            const info = {
                id: u._id,
                name: u.name,
                img: u.character?.img || u.avatar,
                isReady: u.flags['ready-check-reloaded'].isReady,
                isOffline: !u.active
            }
            return info;
        }).sort((a,b) => a.isOffline - b.isOffline);
        data.readyUsers = data.users.filter(u => u.isReady).length;
        data.onlineUsers = data.users.filter(u => !u.isOffline).length;
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on("click", ".toggle-btn", async ev => {
            toggleReadyStatus();
            this.render(true);
        });

        html.on("click", ".end-btn", async ev => {
            await game.settings.set('ready-check-reloaded','checkIsActive', false);
            const socketData = {
                user: game.user,
                action: "END_CHECK"
            };
            game.socket.emit('module.ready-check-reloaded', socketData);
            this.close(true);
        });
    }

    async close(){
        if(game.user.isGM){
            let reallyClose = false;

            reallyClose = await foundry.applications.api.DialogV2.prompt({
                window: {title: "Are you sure?", icon: "fa-solid fa-warning"},
                rejectClose: false,
                modal: true,
                content: "Closing this window will end the ready check.",
                ok: {label: "End Ready Check", callback: () => reallyClose = true },
            });
 
            if(reallyClose){
                await game.settings.set('ready-check-reloaded','checkIsActive', false);
                const socketData = {
                    user: game.user,
                    action: "END_CHECK"
                };
                game.socket.emit('module.ready-check-reloaded', socketData);
                playReadyCheckEndAlert();
                super.close();
            }
        }  else {
            super.close();  
        }
    }

}

function playReadyCheckEndAlert(){
    const playAlert = game.settings.get("ready-check-reloaded", "playAlertForCheckEnd");
    if (!playAlert) return;
    const alertSound = game.settings.get("ready-check-reloaded", "checkAlertEndSoundPath");
    if(!alertSound){
      AudioHelper.play({src: "modules/ready-check-reloaded/sounds/notification.mp3", volume: 1, autoplay: true, loop: false}, true);
    } else{
      AudioHelper.play({src: alertSound, volume: 1, autoplay: true, loop: false}, true);
    }
  }
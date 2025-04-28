import { toggleReadyStatus } from "../ready-check-reloaded.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class ReadyCheckApp extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "ready-check-reloaded-app",
        tag: "div",
        window: {
            title: "Ready Check",
        },
        classes: ["ready-check-reloaded"],
        position: {
            height:356,
            width:"auto"
        },
        actions: {
            respond: ReadyCheckApp.respondToReadyCheck,
            end: ReadyCheckApp.endReadyCheck
        }
    };

    static PARTS = {
        main: {
            template: "modules/ready-check-reloaded/templates/ready-check-app.hbs"
        }
    }

    async _prepareContext(options) {

        const users = game.users.map(u => {
            const info = {
                id: u._id,
                name: u.name,
                img: u.character?.img || u.avatar,
                isReady: u.flags['ready-check-reloaded'].isReady,
                isOffline: !u.active
            }
            return info;
        }).sort((a,b) => a.isOffline - b.isOffline);

        const context = {
            isGm: game.user.isGM,
            isReady: game.user.flags['ready-check-reloaded'].isReady,
            users: users,
            readyUsers: users.filter(u => u.isReady).length,
            onlineUsers: users.filter(u => !u.isOffline).length
        }

        return context;        
    }

    // A flag to keep track of whether we need to display the close confirmation dialog
    // when closing the sheet
    forceClose = false;

    /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
    static respondToReadyCheck(event, target) {
        toggleReadyStatus();
        this.render(true);
    }

    /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   */
    static async endReadyCheck(event, target) {
        await game.settings.set('ready-check-reloaded','checkIsActive', false);
        const socketData = {
            user: game.user,
            action: "END_CHECK"
        };
        game.socket.emit('module.ready-check-reloaded', socketData);
        this.forceClose = true;
        this.close(true);
    }    

    /** @override */
    async close(){
        if(game.user.isGM){
            // let reallyClose = false;
            let reallyClose = this.forceClose;

            if(!reallyClose) reallyClose = await foundry.applications.api.DialogV2.prompt({
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
    if(!alertSound) {
        foundry.audio.AudioHelper.play({src: "modules/ready-check-reloaded/sounds/notification.mp3", volume: 1, autoplay: true, loop: false}, true);
    } else {
        foundry.audio.AudioHelper.play({src: alertSound, volume: 1, autoplay: true, loop: false}, true);
    }
}
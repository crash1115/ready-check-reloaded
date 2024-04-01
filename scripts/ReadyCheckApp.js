export default class ReadyCheckApp extends Application {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "modules/ready-check-reloaded/templates/ready-check-app.hbs",
            title: "Ready Check",
            resizable: false,
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
                isReady: u.flags['ready-check-reloaded'].isReady
            }
            return info;
        });
        return data;
    }

    activateListeners(html) {
    super.activateListeners(html);

        html.on("click", ".toggle-btn", async ev => {
            const isReady = !game.user.flags['ready-check-reloaded'].isReady;
            await game.user.setFlag('ready-check-reloaded','isReady', isReady);
            const socketData = {
                user: game.user,
                action: "UPDATE_STATUS",
                isReady: isReady
            };
            game.socket.emit('module.ready-check-reloaded', socketData);
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

    

}
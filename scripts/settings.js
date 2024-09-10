export function registerSettings() {
    game.settings.register("ready-check-reloaded", "showChatMessagesForUserUpdates", {
        name: "Show Chat Messages",
        hint: "Display chat messages when players change their ready status while no ready check is active.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("ready-check-reloaded", "playAlertForCheck", {
        name: "Play Alerts when Ready Check Starts",
        hint: "Play a sound when a ready check is started. The alert sound is set by the GM.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("ready-check-reloaded", "checkAlertSoundPath", {
        name: "Ready Check Alert Sound",
        hint: "The sound that plays when a ready check is started.",
        scope: "world",
        config: true,
        default: 'modules/ready-check-reloaded/sounds/notification.mp3',
        filePicker: true,
        type: String
    });

    game.settings.register("ready-check-reloaded", "playAlertForCheckEnd", {
        name: "Play Alerts when Ready Check Ends",
        hint: "Play a sound when a ready check is completed. The alert sound is set by the GM.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("ready-check-reloaded", "checkAlertEndSoundPath", {
        name: "Ready Check End Sound",
        hint: "The sound that plays when a ready check is completed.",
        scope: "world",
        config: true,
        default: 'modules/ready-check-reloaded/sounds/notification.mp3',
        filePicker: true,
        type: String
    });

    game.settings.register("ready-check-reloaded", "playAlertForResponse", {
        name: "Play Alerts on Responses",
        hint: "Play each user's sound when they respond to ready checks.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("ready-check-reloaded", "responseAlertSoundPath", {
        name: `Response Alert Sound`,
        hint: "The sound that plays for other users when you respond to a ready check.",
        scope: "client",
        config: true,
        default: 'modules/ready-check-reloaded/sounds/notification-2.mp3',
        filePicker: true,
        type: String
    });

    // A non-editable setting that keeps tract of ready check state
    game.settings.register("ready-check-reloaded", "checkIsActive", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });
};
# About
A system agnostic module for Foundry VTT that implements ready checks.

This is an updated version of my original ready check module, [Ready Set Go!](https://github.com/crash1115/ready-check), rewritten from scratch as a way to learn some new skills. I have no intention of supporting this beyond what's needed for my home games. There's a few other modules out there that are actually supported, if you need something more reliable for your games.

Features include:
- Ready/not ready indicators for all players and GMs in the Players window
- An enhanced UI for ready checks that displays ready check status in more detail for all users
- Customizable alert sounds for ready check start, and for individual user responses

## Toggling Ready Status
As a player or GM user, click the button at the bottom of the Players UI to toggle your status to Ready/Not Ready. If the module is configured to do so, this will post a message to chat notifying everyone of your status change.

## Starting a Ready Check
As a GM user, click the button at the bottom left of the Players UI to start a ready check. Doing so will set all users to not ready, then display the ready check UI for all users. If the module is configured to do so, this will play an alert sound to all users, notifying them that a ready check has been started.

## Responding to a Ready Check
When a ready check has been started by the GM, you can toggle your ready status using either the button at the bottom of the Players UI, or the button on the ready check UI. When changing your status with either of these two methods while a ready check is active, status update chat messages are suppressed. Any user with the setting to play ready check response alerts will hear whatever sound you have configured to play when you respond to a check.

## Customizing Alert Sounds
The module settings menu allows you to configure two types of alert sounds. GM users can set the sound that plays when ready checks are started. All users can set a sound that plays when they respond to an active ready check. The module includes a default sound for each of these, but you can use sounds from your Foundry user data folders, or a URL.

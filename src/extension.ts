'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Player from './Player';
import Config from './Config';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const config = new Config();
    const player = new Player();

    const commandPlay = vscode.commands.registerCommand('itunes.play', () => {
        player.play();
        player.forceUpdate();
    });

    const commandPause = vscode.commands.registerCommand('itunes.pause', () => {
        player.pause();
        player.forceUpdate();
    });

    const commandNextTrack = vscode.commands.registerCommand("itunes.nextTrack", () => {
        player.nextTrack();
        player.forceUpdate();
    });

    const commandPreviousTrack = vscode.commands.registerCommand("itunes.previousTrack", () => {
        player.previousTrack();
        player.forceUpdate();
    });

    const commandOpen = vscode.commands.registerCommand("itunes.open", () => {
        player.open();
        player.forceUpdate();
    });

    const commandVolume = vscode.commands.registerCommand("itunes.volume", () => {
        player.volume();
        player.forceUpdate();
    });

    const commandRepeatOne = vscode.commands.registerCommand("itunes.repeat.set.one", () => {
        player.setRepeat("One");
        player.forceUpdate();
    });

    const commandRepeatOff = vscode.commands.registerCommand("itunes.repeat.set.off", () => {
        player.setRepeat("Off");
        player.forceUpdate();
    });

    const commandRepeatAll = vscode.commands.registerCommand("itunes.repeat.set.all", () => {
        player.setRepeat("All");
        player.forceUpdate();
    });

    const commandShuffleOn = vscode.commands.registerCommand("itunes.shuffle.on", () => {
        player.shuffleOn();
        player.forceUpdate();
    });

    const commandShuffleOff = vscode.commands.registerCommand("itunes.shuffle.off", () => {
        player.shuffleOff();
        player.forceUpdate();
    });

    const likeTrack = vscode.commands.registerCommand("itunes.likeTrack", () => {
        player.likeTrack();
        player.forceUpdate();
    });

    const dislikeTrack = vscode.commands.registerCommand("itunes.dislikeTrack", () => {
        player.dislikeTrack();
        player.forceUpdate();
    });

    const addTrack = vscode.commands.registerCommand("itunes.addTrack", () => {
        player.addTrack();
        player.forceUpdate();
    });

    context.subscriptions.push( player );
    context.subscriptions.push( commandPlay );
    context.subscriptions.push( commandPause );
    context.subscriptions.push( commandNextTrack );
    context.subscriptions.push( commandPreviousTrack );
    context.subscriptions.push( commandOpen );
    context.subscriptions.push( commandRepeatOne );
    context.subscriptions.push( commandRepeatOff );
    context.subscriptions.push( commandRepeatAll );
    context.subscriptions.push( commandVolume );
    context.subscriptions.push( commandShuffleOn );
    context.subscriptions.push( commandShuffleOff );
    context.subscriptions.push( likeTrack );
    context.subscriptions.push( dislikeTrack );
    context.subscriptions.push( addTrack );
}

// this method is called when your extension is deactivated
export function deactivate() {
    Player.Instance.dispose();
}

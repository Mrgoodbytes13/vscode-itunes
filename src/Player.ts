import { window, StatusBarAlignment, StatusBarItem, workspace, MarkdownString, } from "vscode";
import iTunes from "./iTunes";
import ITrack, { MediaType } from "./ITrack";
import Config from "./Config";
import TrackFactory from "./Factories/TrackFactory";
import { print } from "util";
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { config } from "process";

export default class Player {
    public static Instance: Player;

    private iTunes: iTunes;
    private titleBarItem: StatusBarItem = null;
    private playerButton: StatusBarItem = null;
    private previousTrackButton: StatusBarItem = null;
    private nextTrackButton: StatusBarItem = null;
    private stateButton: StatusBarItem = null;
    private updateInterval: NodeJS.Timer;
    private repeatButton: StatusBarItem = null;
    private shuffleButton: StatusBarItem = null;
    private likeButton: StatusBarItem = null;
    private dislikeButton: StatusBarItem = null;
    private addToLibrayButton: StatusBarItem = null;

    private lastSongName: string = "";
    private artworkPath:  string = "";
    private artworkSaved: boolean = false;
    private defaultArtwork: string = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxzdHlsZT4uY2xzLTF7ZmlsbDojZmZmO30uY2xzLTJ7ZmlsbDp1cmwoI2EpO308L3N0eWxlPgo8bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIxMC4xIiB4Mj0iNTguNjciIHkxPSI0Ny4wNyIgeTI9IjEzLjY1IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiNkZTVkNzQiIG9mZnNldD0iMCIvPgo8c3RvcCBzdG9wLWNvbG9yPSIjN2UzMWYzIiBvZmZzZXQ9Ii41Ii8+CjxzdG9wIHN0b3AtY29sb3I9IiMxMmUyZWEiIG9mZnNldD0iMSIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IGNsYXNzPSJjbHMtMSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iNiIvPgo8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zMiwyLjUzQTI5LjQ3LDI5LjQ3LDAsMSwwLDYxLjQ3LDMyLDI5LjQ2LDI5LjQ2LDAsMCwwLDMyLDIuNTNabTAsMzcuMjVBNy43OCw3Ljc4LDAsMSwxLDM5Ljc4LDMyLDcuNzgsNy43OCwwLDAsMSwzMiwzOS43OFoiLz4KPC9zdmc+";

    private statusBarPositionOffset: number = 10;

    private spacer = "<img src=\"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=\" width=\"350\" height=\"0\">";

    private richTooltipTemplateH: string = "[<img src=\"$artwork\" width=\"64\" align=\"left\"/>](command:itunes.open \"Open iTunes\")<span><b>&nbsp;&nbsp;$name</b></span></br><span>&nbsp;&nbsp;$(organization)&nbsp;$artist</span></br><span>&nbsp;&nbsp;$(list-flat)&nbsp;$album</span></br>";
    private richTooltipControls: string  = "<h1>[$(thumbsup)](command:itunes.likeTrack \"Like track\")[$(thumbsdown)](command:itunes.dislikeTrack \"Dislike track\")&nbsp;&nbsp;&nbsp;&nbsp;[$(plus)](command:itunes.addTrack \"Add to library\")&nbsp;&nbsp;&nbsp;&nbsp;[$($shuffleIcon)](command:itunes.shuffle.$shuffleCmd)&nbsp;[$(chevron-left)](command:itunes.previousTrack \"Previous\")[$($playIcon)](command:itunes.$playCmd \"Play / Pause\")[$(chevron-right)](command:itunes.nextTrack \"Next\")&nbsp;[$($repeatIcon)](command:itunes.repeat.set.$repeatCmd)&nbsp;&nbsp;&nbsp;&nbsp;[$(mute)](command:itunes.volume \"Mute\")</h1>";

    private richTooltipTemplateV: string = "[<img src=\"$artwork\" width=\"320\"/>](command:itunes.open \"Open iTunes\")</br><h3>$name</h3><span>$(organization)&nbsp;$artist</span></br><span>$(list-flat)&nbsp;$album</span></br>";


    constructor() {
        Player.Instance = this;

        this.onUpdate = this.onUpdate.bind( this );

        this.iTunes = new iTunes();

        this.createStatusBarItem();
        this.updateInterval = setInterval( this.onUpdate, Config.Instance.getStatusCheckInterval() );
        this.updateStatusBarItem();

        // Reset on settings change
        workspace.onDidChangeConfiguration(e => {
            Config.Instance = new Config()
            this.updateInterval = setInterval( this.onUpdate, Config.Instance.getStatusCheckInterval() );
            this.hideMediaControls();
            this.showMediaControls();
        });
    }

    private onUpdate(){
        this.updateStatusBarItem();
    }

    private createStatusBarItem(){
        this.previousTrackButton = window.createStatusBarItem( StatusBarAlignment.Left, 14 + this.statusBarPositionOffset );
        this.previousTrackButton.text = "$(chevron-left)";
        this.previousTrackButton.command = "itunes.previousTrack";
        this.previousTrackButton.tooltip = "Play Previous Track";

        this.playerButton = window.createStatusBarItem( StatusBarAlignment.Left, 13 + this.statusBarPositionOffset );

        this.nextTrackButton = window.createStatusBarItem( StatusBarAlignment.Left, 12 + this.statusBarPositionOffset );
        this.nextTrackButton.text = "$(chevron-right)";
        this.nextTrackButton.command = "itunes.nextTrack";
        this.nextTrackButton.tooltip = "Play Next Track";

        this.addToLibrayButton = window.createStatusBarItem( StatusBarAlignment.Left, 11 + this.statusBarPositionOffset );
        this.addToLibrayButton.text = "$(plus)";
        this.addToLibrayButton.command = "itunes.addTrack";
        this.addToLibrayButton.tooltip = "Add current playing to track to your iTunes/Apple Music master library."

        this.titleBarItem = window.createStatusBarItem( StatusBarAlignment.Left, 10 + this.statusBarPositionOffset );
        this.titleBarItem.command = "itunes.open";
        this.titleBarItem.tooltip = "Show iTunes";
        this.titleBarItem.show();

        this.repeatButton = window.createStatusBarItem( StatusBarAlignment.Left, 9 + this.statusBarPositionOffset );
        this.shuffleButton = window.createStatusBarItem( StatusBarAlignment.Left, 8 + this.statusBarPositionOffset );

        this.stateButton = window.createStatusBarItem( StatusBarAlignment.Left, 7 + this.statusBarPositionOffset );
        this.stateButton.text = "$(mute)";
        this.stateButton.command = "itunes.volume";

        this.likeButton = window.createStatusBarItem( StatusBarAlignment.Left, 6 + this.statusBarPositionOffset );
        this.likeButton.text = "$(thumbsup)";
        this.likeButton.command = "itunes.likeTrack";

        this.dislikeButton = window.createStatusBarItem( StatusBarAlignment.Left, 5 + this.statusBarPositionOffset );
        this.dislikeButton.text = "$(thumbsdown)";
        this.dislikeButton.command = "itunes.dislikeTrack";
    }

    private updateStatusBarItem(){
        this.iTunes.getAppState()
            .then( ( app: any ) => {
                if( app.appState === "running" ){
                    this.iTunes.getCurrentTrack()
                        .then( ( track: any ) => {
                            const currentTrack: ITrack = TrackFactory.create( track );

                            if (currentTrack.artist != null && currentTrack.name != null) {
                                // Save new artwork if song has changed
                                if (this.lastSongName != currentTrack.name) {
                                    this.lastSongName = currentTrack.name;
                                    this.artworkSaved = false;
                                    
                                    this.iTunes.saveArt()
                                        .then( ( bin: any ) => {
                                            const path = tmpdir() + "/vscode-itunes-artwork-" + currentTrack.name + ".jpg";

                                            if (this.artworkPath != "") {
                                                unlinkSync(this.artworkPath);
                                                this.artworkPath = "";
                                            }

                                            writeFileSync(path, bin, { flag: 'w', });

                                            this.artworkPath = path;
                                            this.artworkSaved = true;

                                            this.forceUpdate();
                                        })
                                        .catch( ( err ) => {
                                            console.log( err );
                                        });
                                }

                                this.updateStatusText( currentTrack.artist, currentTrack.name, currentTrack.album, currentTrack.kind, currentTrack.state === "playing", currentTrack.repeat_song, currentTrack.shuffle === "true");

                                this.titleBarItem.show();

                                if (Config.Instance.getShowMute())
                                    this.stateButton.show();
                            }

                            if( currentTrack.volume >= 1 ){
                                this.stateButton.text = "$(unmute)";
                                this.stateButton.tooltip = "Mute Volume";
                            }else{
                                this.stateButton.text = "$(mute)";
                                this.stateButton.tooltip = "Unmute Volume";
                            }

                            switch( currentTrack.state ){
                                case "playing" :
                                    this.playerButton.text = "$(primitive-square)";
                                    this.playerButton.command = "itunes.pause";
                                    this.playerButton.tooltip = "Pause Track";
                                    break;

                                case "paused" :
                                case "stopped" :
                                    this.playerButton.text = "$(play)";
                                    this.playerButton.command = "itunes.play";
                                    this.playerButton.tooltip = "Play Track";
                                    break;
                            }

                            switch( currentTrack.repeat_song ){
                                case "all":
                                    this.repeatButton.text = "$(sync) All";
                                    this.repeatButton.command = "itunes.repeat.set.one";
                                    break;

                                case "one":
                                    this.repeatButton.text = "$(sync) One";
                                    this.repeatButton.command = "itunes.repeat.set.off";
                                    break;

                                case "off":
                                    this.repeatButton.text = "$(sync) Off";
                                    this.repeatButton.command = "itunes.repeat.set.all";
                                    break;
                            }

                            if( currentTrack.shuffle === "true" ) {
                                this.shuffleButton.text = "$(git-compare) On";
                                this.shuffleButton.command = "itunes.shuffle.off";
                                this.shuffleButton.tooltip = "Turn Shuffle Off";
                            } else {
                                this.shuffleButton.text = "$(git-compare) Off";
                                this.shuffleButton.command = "itunes.shuffle.on";
                                this.shuffleButton.tooltip = "Turn Shuffle On";
                            }

                            if( currentTrack.loved === true ) {
                                this.likeButton.text = "$(thumbsup) $(check)";
                            } else {
                                this.likeButton.text = "$(thumbsup)";
                            }

                            if( currentTrack.disliked === true ) {
                                this.dislikeButton.text = "$(thumbsdown) $(check)";
                            } else {
                                this.dislikeButton.text = "$(thumbsdown)";
                            }

                            this.showMediaControls();
                        })
                        .catch( ( err ) => {
                            console.log( err );
                        });
                }else{
                    this.hideMediaControls();
                }
            });
    }

    private updateStatusText( artist: string, name: string, album: string, kind: MediaType, playing: boolean, repeat: string, shuffle: boolean) {
        const useVertLayout = Config.Instance.getVerticalLayout();
        const titleStringLimit = Config.Instance.getTitleStringLimit();
        const title = Config.Instance.getTrackFormat().replace("{name}", name)
                                                      .replace("{artist}", artist)
                                                      .replace("{album}", album);

        let displayedTitle = title;

        if( titleStringLimit > 0 ) {
            displayedTitle = title.substring(0, titleStringLimit);
            if( displayedTitle.length < title.length ) {
                displayedTitle += "…";
            }
        }

        let artwork = this.defaultArtwork;
        if (this.artworkSaved) {
            artwork = this.artworkPath;
        }

        /*
        let scrubAlbum = album;
        let scrubArtist = artist.substring(0, name.length);

        if (album.length + 6 > name.length)
            scrubAlbum = album.substring(0, name.length - 6) + "…";

        if (artist.length + 6 > name.length)
            scrubArtist = artist.substring(0, name.length - 6) + "…";
*/

        let template = useVertLayout ? this.richTooltipTemplateV : this.richTooltipTemplateH;

        let richTooltip = new MarkdownString(template.replace("$name",    name)
                                                     .replace("$artist",  artist)
                                                     .replace("$album",   album)
                                                     .replace("$artwork", artwork), true);

        richTooltip.isTrusted   = true;
        richTooltip.supportHtml = true;

        let repeatCmd  = "";
        let repeatIcon = "";
        switch (repeat) {
            case "all":
                repeatCmd = "one \"Repeat: All\"";
                repeatIcon = "debug-restart-frame"
                break;

            case "one":
                repeatCmd = "off \"Repeat: One\"";
                repeatIcon = "debug-restart"
                break;

            case "off":
                repeatCmd = "all \"Repeat: Off\"";
                repeatIcon = "sync-ignored"
                break;
        }

        richTooltip.appendMarkdown(this.richTooltipControls.replace("$playCmd",     playing ? "pause" : "play")
                                                           .replace("$playIcon",    playing ? "debug-pause" : "play")
                                                           .replace("$repeatCmd",   repeatCmd)
                                                           .replace("$repeatIcon",  repeatIcon)
                                                           .replace("$shuffleCmd",  shuffle ? "off \"Turn shuffle off\"" : "on \"Turn shuffle on\"")
                                                           .replace("$shuffleIcon", shuffle ? "git-compare" : "checklist"));

        this.titleBarItem.text    = displayedTitle;
        this.titleBarItem.tooltip = richTooltip;
        this.titleBarItem.show();
    }

    public open(): void {
        this.iTunes.open();
    }

    public play(): void {
        this.iTunes.play();
    }

    public pause(): void {
        this.iTunes.pause();
    }

    public nextTrack(): void {
        this.iTunes.nextTrack();
    }

    public previousTrack(): void {
        this.iTunes.previousTrack();
    }

    public shuffleOn(): void {
        this.iTunes.shuffle( true );
    }

    public shuffleOff(): void {
        this.iTunes.shuffle( false );
    }

    public addTrack(): void {
        this.iTunes.addTrack();
    }

    public setRepeat( repeat: string ): void {
        this.iTunes.setRepeat( repeat );
    }

    public dispose(): void {
        this.titleBarItem.dispose();
        clearInterval( this.updateInterval );
    }

    private showMediaControls(): void {
        if (Config.Instance.getShowMediaControls()) {
            this.previousTrackButton.show();
            this.playerButton.show();
            this.nextTrackButton.show();
        }
        if (Config.Instance.getShowLoopShuffle()) {
            this.repeatButton.show();
            this.shuffleButton.show();
        }
        if (Config.Instance.getShowTrack()) {
            this.titleBarItem.show();
        }
        if (Config.Instance.getShowMute()) {
            this.stateButton.show();
        }
        if (Config.Instance.getShowLikeDislike()) {
            this.likeButton.show();
            this.dislikeButton.show();
        }
        if (Config.Instance.getShowAdd()) {
            this.addToLibrayButton.show();
        }
    }

    private hideMediaControls(): void {
        this.previousTrackButton.hide();
        this.playerButton.hide();
        this.nextTrackButton.hide();
        this.repeatButton.hide();
        this.titleBarItem.hide();
        this.stateButton.hide();
        this.shuffleButton.hide();
        this.likeButton.hide();
        this.dislikeButton.hide();
        this.addToLibrayButton.hide();
    }

    public volume(): void {
        if( this.stateButton.text === "$(mute)"){
            this.iTunes.unmute();
        }else{
            this.iTunes.mute();
        }
    }

    public likeTrack(): void {
        this.iTunes.like();
    }

    public dislikeTrack(): void {
        if( Config.Instance.getSkipTrackDislike() === true ) {
            this.iTunes.dislikeTrackAndSkip();
        } else {
            this.iTunes.dislikeTrack();
        }
    }

    public forceUpdate(): void {
        this.onUpdate();
    }
}

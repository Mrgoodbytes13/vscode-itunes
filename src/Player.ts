import { window, StatusBarAlignment, StatusBarItem } from "vscode";
import iTunes from "./iTunes";
import ITrack from "./ITrack";
import Config from "./Config";

export default class Player {

    public static Instance: Player;

    private iTunes: iTunes;
    private statusBarItem: StatusBarItem = null;
    private playerButton: StatusBarItem = null;
    private previousTrackButton: StatusBarItem = null;
    private nextTrackButton: StatusBarItem = null;
    private stateButton: StatusBarItem = null;
    private updateInterval: NodeJS.Timer;
    private repeatButton: StatusBarItem = null;
    private shuffleButton: StatusBarItem = null;

    private displayedError: boolean = false;
    
    constructor() {
        Player.Instance = this;

        this.iTunes = new iTunes();

        this.createStatusBarItem();

        this.onUpdate = this.onUpdate.bind( this );
        this.updateInterval = setInterval( this.onUpdate, Config.Instance.getStatusCheckInterval() );

        this.updateStatusBarItem();
    }

    private onUpdate(){
        this.updateStatusBarItem();
    }

    private createStatusBarItem(){
        this.shuffleButton = window.createStatusBarItem( StatusBarAlignment.Left, 0 );
        this.repeatButton = window.createStatusBarItem( StatusBarAlignment.Left, 0 );

        this.statusBarItem = window.createStatusBarItem( StatusBarAlignment.Left, 2 );
        this.statusBarItem.command = "itunes.open";
        this.statusBarItem.tooltip = "Show iTunes";
        this.statusBarItem.show();

        this.previousTrackButton = window.createStatusBarItem( StatusBarAlignment.Left, 3 );
        this.previousTrackButton.text = "$(chevron-left)";
        this.previousTrackButton.command = "itunes.previousTrack";
        this.previousTrackButton.tooltip = "Play Previous Track";

        this.playerButton = window.createStatusBarItem( StatusBarAlignment.Left, 3 );

        this.nextTrackButton = window.createStatusBarItem( StatusBarAlignment.Left, 3 );
        this.nextTrackButton.text = "$(chevron-right)";
        this.nextTrackButton.command = "itunes.nextTrack";
        this.nextTrackButton.tooltip = "Play Next Track";

        this.stateButton = window.createStatusBarItem( StatusBarAlignment.Left, 1 );
        this.stateButton.text = "$(mute)";
        this.stateButton.command = "itunes.volume";
        this.stateButton.show();
    }

    private updateStatusBarItem(){
        this.iTunes.getAppState()
            .then( ( app: any ) => {
                if( app.appState === "running" ){
                    this.iTunes.getCurrentTrack()
                        .then( ( track: ITrack ) => {
                            if( track.artist != null && track.name != null ){
                                const status = `${ track.name } - ${ track.artist }`;
                                this.statusBarItem.text = status;

                                this.statusBarItem.show();
                                this.stateButton.show();
                            }

                            if( track.volume >= 1 ){
                                this.stateButton.text = "$(unmute)";
                                this.stateButton.tooltip = "Mute Volume";
                            }else{
                                this.stateButton.text = "$(mute)";
                                this.stateButton.tooltip = "Unmute Volume";
                            }
                            
                            switch( track.state ){
                                case "playing" :
                                    this.playerButton.text = "$(primitive-square)";
                                    this.playerButton.command = "itunes.pause";
                                    this.playerButton.tooltip = "Pause Track";
                                    break;
                                
                                case "paused" :
                                case "stopped" :
                                    this.playerButton.text = "$(triangle-right)";
                                    this.playerButton.command = "itunes.play";
                                    this.playerButton.tooltip = "Play Track";
                                    break;
                            }

                            switch( track.repeat ){
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

                            if( track.shuffle === "true" ) {
                                this.shuffleButton.text = "$(git-compare) On";
                                this.shuffleButton.command = "itunes.shuffle.off";
                                this.shuffleButton.tooltip = "Turn Shuffle Off";
                            } else {
                                this.shuffleButton.text = "$(git-compare) Off";
                                this.shuffleButton.command = "itunes.shuffle.on";
                                this.shuffleButton.tooltip = "Turn Shuffle On";
                            }

                            this.showMediaControls();
                        })
                        .catch( ( err ) => {
                        });
                }else{
                    this.hideMediaControls();
                }
            });
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

    public setRepeat( repeat: string ): void {
        this.iTunes.setRepeat( repeat );
    }

    public dispose(): void {
        this.statusBarItem.dispose();
        clearInterval( this.updateInterval );
    }

    private showMediaControls(): void {
        this.previousTrackButton.show();
        this.playerButton.show();
        this.nextTrackButton.show();
        this.repeatButton.show();
        this.statusBarItem.show();
        this.stateButton.show();
        this.shuffleButton.show();
    }

    private hideMediaControls(): void {
        this.previousTrackButton.hide();
        this.playerButton.hide();
        this.nextTrackButton.hide();
        this.repeatButton.hide();
        this.statusBarItem.hide();
        this.stateButton.hide();
        this.shuffleButton.hide();
    }

    public volume(): void {
        if( this.stateButton.text === "$(mute)"){
            this.iTunes.unmute();
        }else{
            this.iTunes.mute();
        }
    }
}

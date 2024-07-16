import { Game, Scene } from 'phaser';
import * as Vue from "vue"
import DialogerUI from "./DialogerUI"

export default class Dialoger {
    game : Game
    scene : Scene
    dialogerUI : null | Object

    dialogs : Object

    constructor(config) {
        this.game = config.scene.game
        this.scene = config.scene

        this.dialogs = null

        this.init()
    }
    async startDialog(characterLabel : string){
        let response = await fetch("/data/dialogs.json"),
            json = await response.json(),
            dialog = json[characterLabel]

        this.dialogerUI.start(dialog)
    }
    init(){
        this.dialogerUI = Vue.createApp(DialogerUI).mount('#dialogerContainer')

        // Listen for the event.
        document.addEventListener("StartDialog",(event) => {
            this.startDialog(event.detail)
        });
    }
}
import { Game, Scene } from 'phaser';
import * as Vue from "vue";
import TraderUI from "../components/TraderUI";

export default class Trader {
    game : Game
    scene : Scene
    traderUI : null | Object

    constructor(config) {
        this.game = config.scene.game
        this.scene = config.scene

        this.init()
    }
    init(){
        this.traderUI = Vue.createApp(TraderUI).mount('#traderContainer')

        // Listen for the event.
        document.addEventListener("StartTrade",(event) => {
            this.traderUI.start(
                this.scene.player.inventory,
                this.scene.player.money
                )
        });
    }
}
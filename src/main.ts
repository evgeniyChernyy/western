import { Main } from './scenes/Main';
import { Preloader } from './scenes/Preloader';

import { Game, Types } from "phaser";

import {BASIC_GAME_WIDTH} from "./constants";

window.l = console.log.bind(console)

let width = window.innerWidth,
    height = window.innerHeight,
    ratio = width / height,
    gameHeight = BASIC_GAME_WIDTH / ratio

const config: Types.Core.GameConfig = {
    gameVersion:"1.0.0",
    powerPreference:"high-performance",
    disablePreFX:true,
    disablePostFX:true,
    type: Phaser.WEBGL,
    width: BASIC_GAME_WIDTH,
    height: gameHeight,
    canvas: document.querySelector("#canvas"),
    backgroundColor: '#f0e3b1',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scale:{
        width:BASIC_GAME_WIDTH,
        height: gameHeight,
        zoom:1,
        parent:document.querySelector(".phaser-container")
    },
    scene: [
        Preloader,
        Main,
    ]
};

const game = window.game = new Game(config);

game.custom = {
    gameCenterX:BASIC_GAME_WIDTH / 2,
    gameCenterY:gameHeight / 2,
    vw:window.innerWidth / 100,
    vh:window.innerHeight / 100,
    ratio,
}

// this = context = game
function resize (scene)
{
    // portrait prevent
    if( window.matchMedia("(orientation: portrait)").matches) return;

    let newAspectRatio = window.innerWidth / window.innerHeight,
        newGameHeight = BASIC_GAME_WIDTH / newAspectRatio,
        oldGameHeight = this.config.canvas.height

    scene.cameras.resize(BASIC_GAME_WIDTH, newGameHeight);
    this.scale.resize(BASIC_GAME_WIDTH, newGameHeight)

    this.custom.ratio = newAspectRatio
    this.custom.gameCenterY = newGameHeight / 2
    this.custom.vw = window.innerWidth / 100
    this.custom.vh = window.innerHeight / 100

    let scenes = this.scene.getScenes(false)
    scenes.forEach((sc)=>{
        if( (this.scene.isActive(sc) || this.scene.isPaused(sc)) &&
            sc.resizeInterface) sc.resizeInterface(newAspectRatio,newGameHeight,oldGameHeight)
    })
}

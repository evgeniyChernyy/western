import { Physics, Input } from 'phaser';
import {PLAYER_DEPTH, PLAYER_SPEED} from "../constants"

export class Player extends Physics.Matter.Sprite{

    moveKeys : object

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"player",null,{
            shape:{ type: 'circle', radius:65 },
            render: { sprite: { yOffset: 0.1 } },
            frictionAir:0
        })

        this.setScale(.5,.5).setAngle(90).setDepth(PLAYER_DEPTH)

        config.scene.add.existing(this)

        this.initControls(config.scene)
    }
    initControls(scene){
        // Creates object for input with WASD kets
        this.moveKeys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Enables movement of player with WASD keys
        scene.input.keyboard.on('keydown', event => {
            if (this.moveKeys['up'].isDown && !this.moveKeys['down'].isDown) { this.setVelocityY(-PLAYER_SPEED); }
            if (this.moveKeys['down'].isDown && !this.moveKeys['up'].isDown) { this.setVelocityY(PLAYER_SPEED); }
            if (this.moveKeys['left'].isDown && !this.moveKeys['right'].isDown) { this.setVelocityX(-PLAYER_SPEED); }
            if (this.moveKeys['right'].isDown && !this.moveKeys['left'].isDown) { this.setVelocityX(PLAYER_SPEED); }
        });
        scene.input.keyboard.on('keyup', event => {
            if (this.moveKeys['up'].isUp && this.moveKeys['down'].isUp) { this.setVelocityY(0); }
            if (this.moveKeys['down'].isUp && this.moveKeys['up'].isUp) { this.setVelocityY(0); }
            if (this.moveKeys['left'].isUp && this.moveKeys['right'].isUp) { this.setVelocityX(0); }
            if (this.moveKeys['right'].isUp && this.moveKeys['left'].isUp) { this.setVelocityX(0); }
        });
    }
}
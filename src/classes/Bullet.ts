import {Physics} from "phaser";
import {BULLET_SPEED} from "../constants"

export class Bullet extends Physics.Matter.Image{
    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"bulletLine",null,{
            frictionAir:0
        })

        this.setRotation(config.rotation)
        this.setVelocity(BULLET_SPEED * Math.cos(config.rotation),BULLET_SPEED * Math.sin(config.rotation));
        this.setName("bullet")

        config.scene.add.existing(this)
    }
}
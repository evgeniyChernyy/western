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
    fire(x,y,rotation){
        this.setAngularVelocity(0)
        this.setPosition(x, y);

        // show bullet
        this.world.add(this.body);
        this.setActive(true);
        this.setVisible(true);

        this.setRotation(rotation)
        this.setVelocity(BULLET_SPEED * Math.cos(rotation),BULLET_SPEED * Math.sin(rotation));
    }
    deactivate(){
        this.setActive(false);
        this.setVisible(false);
        this.world.remove(this.body, true);
    }
}
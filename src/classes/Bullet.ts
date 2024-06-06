import {Physics, Time} from "phaser";

export class Bullet extends Physics.Matter.Image{

    lifespanEvent : Time.TimerEvent

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"bulletLine",null,{
            frictionAir:0,
            label:"bullet"
        })

        this.setRotation(config.rotation)
        this.setVelocity(config.speed * Math.cos(config.rotation),config.speed * Math.sin(config.rotation));
        this.setName("bullet")
        this.setCollisionGroup(this.scene.bulletsGroup)

        config.scene.add.existing(this)

        this.startLifespan(config.lifespan)
    }
    fire(x,y,rotation,lifespan,speed){
        this.setAngularVelocity(0)
        this.setPosition(x, y);

        // show bullet
        this.world.add(this.body);
        this.setActive(true);
        this.setVisible(true);

        this.setRotation(rotation)
        this.setVelocity(speed * Math.cos(rotation),speed * Math.sin(rotation));

        this.startLifespan(lifespan)
    }
    startLifespan(lifespan : number) : void{
        this.lifespanEvent = this.scene.time.addEvent({
            delay:lifespan,
            callback:this.deactivate,
            callbackScope:this
        })
    }
    deactivate(){
        this.setActive(false);
        this.setVisible(false);
        this.world.remove(this.body, true);

        this.scene.time.removeEvent(this.lifespanEvent)
    }
}
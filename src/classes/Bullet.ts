import {Physics, Time} from "phaser";

export class Bullet extends Physics.Matter.Image{

    lifespanEvent : Time.TimerEvent

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"bulletLine",null,{
            frictionAir:0,
            label:"bullet",
            isSensor:true,
        })

        this.setRotation(config.rotation)
        this.setVelocity(config.speed * Math.cos(config.rotation),config.speed * Math.sin(config.rotation));
        this.setName("bullet")
        this.setCollisionGroup(this.scene.bulletsGroup)
        this.setData("owner",config.owner)
        this.setData("damage",config.damage)

        config.scene.add.existing(this)

        this.startLifespan(config.lifespan)
    }
    fire(config){
        this.setData("owner",config.owner)
        this.setData("damage",config.damage)

        this.setAngularVelocity(0)
        this.setPosition(config.x, config.y);

        // show bullet
        this.world.add(this.body);
        this.setActive(true);
        this.setVisible(true);

        this.setRotation(config.rotation)
        this.setVelocity(config.speed * Math.cos(config.rotation),config.speed * Math.sin(config.rotation));

        this.startLifespan(config.lifespan)
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
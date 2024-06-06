import {Physics, Time} from "phaser";

export class Grenade extends Physics.Matter.Sprite{

    explodeEvent : Time.TimerEvent
    throwAngularVelocity : number = .5
    initialScale : number = .35

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,config.label,null,{
            frictionAir:.05,
            label:config.label
        })

        this.setScale(this.initialScale,this.initialScale)
        this.setAngularVelocity(this.throwAngularVelocity)
        this.setRotation(config.rotation)
        this.setVelocity(config.speed * Math.cos(config.rotation),config.speed * Math.sin(config.rotation));
        this.setName(config.label)
        this.setCollisionGroup(this.scene.bulletsGroup)

        config.scene.add.existing(this)

        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation)=>{
            if(animation.key === "explosion"){
                this.deactivate()
            }
        }, this)

        this.startExplodeDelay(config.explosionDelay)
    }
    fire(x,y,rotation,explosionDelay,speed){
        this.setSensor(false)
        this.setTexture(this.name)
        this.setAngularVelocity(this.throwAngularVelocity)
        this.setScale(this.initialScale,this.initialScale)
        this.setPosition(x, y)

        // show dynamite
        this.world.add(this.body);
        this.setActive(true);
        this.setVisible(true);

        this.setRotation(rotation)
        this.setVelocity(speed * Math.cos(rotation),speed * Math.sin(rotation));

        this.startExplodeDelay(explosionDelay)
    }
    startExplodeDelay(explosionDelay : number){
        this.explodeEvent = this.scene.time.addEvent({
            delay:explosionDelay,
            callback:this.explode,
            callbackScope:this
        })
    }
    explode(){
        this.setSensor(true)
        this.setScale(2,2)
        this.play("explosion")
    }
    deactivate(){
        this.setActive(false);
        this.setVisible(false);
        this.world.remove(this.body, true);
    }
}
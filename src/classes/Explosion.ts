import {Physics} from "phaser";
import {PLAYER_DEPTH} from "../constants"

export class Explosion extends Physics.Matter.Sprite{

    startCallback : Function

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"explosion",null,{
            label:"explosion",
            shape:{
              type:"circle",
              radius:55,
            },
            isSensor:true
        })

        this.startCallback = config.startCallback

        this.setDepth(PLAYER_DEPTH + 1)
        this.setScale(.1)

        config.scene.add.existing(this)

        this.init()
    }
    init(){
        let callbackStarted = false
        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation)=>{
            if(animation.key === "explosion"){
                this.deactivate()
            }
        }, this)
        this.scene.tweens.add({
            targets:this,
            scale:2.2,
            duration:300,
            ease:Phaser.Math.Easing.Expo.In,
            onUpdate:(tween)=>{
                if (tween.progress >= .4 && !callbackStarted){
                    callbackStarted = true

                    this.startCallback()
                }
            },
        })

        this.play("explosion")
    }
    deactivate(){
        this.setActive(false);
        this.setVisible(false);
        this.destroy()
    }
}
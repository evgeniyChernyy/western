import { Physics, GameObjects, Tweens } from 'phaser';
import {PLAYER_DEPTH, HUMAN_SPEED_WALK, IDLE_DURATION, GO_TO_COMPLETE_DISTANCE} from "../constants";
import {weapons} from "../data/weapons"
import {Bullet} from "./Bullet";

export class AI extends Physics.Matter.Sprite{

    name : string
    state : string
    stamina : number
    data : Array<Object>
    speed : number

    muzzleFire : GameObjects.Image

    bullets : Array<Bullet>
    canShoot : boolean
    ammo : object
    currentWeapon : object

    rotationTween : Tweens.Tween
    globalTasks : Array<Object>
    currentGlobalTask : Object | null
    currentGlobalTaskIndex : number | null
    patrolPoints : Array<Object>

    localTasks : Array<Object>
    currentLocalTaskIndex : null | number
    currentLocalTask : null | Object

    feet : GameObjects.Sprite

    constructor(config) {
        super(config.scene.matter.world, config.x, config.y, "bandit", 0, {
            shape: {type: 'circle', radius: 65},
            render: {sprite: {xOffset: -0.15}},
            frictionAir: 0,
        })

        this.setScale(.5,.5).setDepth(PLAYER_DEPTH)

        // config, inventory, state
        this.name = "bandit"
        this.state = "idle"
        this.stamina = 100
        this.data = config.data
        this.speed = HUMAN_SPEED_WALK
        this.bullets = []
        this.canShoot = true
        this.ammo = {
            ".44":80,
        }
        this.currentWeapon = weapons[0]

        // technical data
        this.patrolPoints = []
        this.globalTasks = config.globalTasks || this.getGlobalTaskFromObject() || []
        this.currentGlobalTaskIndex = null
        this.currentGlobalTask = null

        this.localTasks = []
        this.currentLocalTaskIndex = null
        this.currentLocalTask = null

        // foot
        this.feet = config.scene.add.sprite(this.x,this.y,"feet")
            .setScale(.35,.35).setDepth(PLAYER_DEPTH - 1).setFrame(6)

        // muzzle fire and aim
        this.muzzleFire = config.scene.add.image(0,0,"muzzle_fire").setVisible(false).setScale(.4,.4).setOrigin(0,.5)

        config.scene.add.existing(this)

        this.initAnimations()
        this.startNextGlobalTask()
    }
    // task state - stopped paused inProgress canceled
    getGlobalTaskFromObject(){
        if(this.data.find((el) => { return el.name === 'patrolX' })){
            this.getPatrolPoints()

            return [{
                name:"patrol",
                state:"stopped"
            }]
        } else {
            return [{
                name:"idle",
                state:"stopped"
            }]
        }
    }
    initAnimations(){
        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation)=>{
            if(animation.key === this.currentWeapon.label + "ReloadTransition" + "_" + this.name){
                if(this.state === "reload"){
                    this.play(this.currentWeapon.label + "Reload" + "_" + this.name)
                }
                if(this.state === "idle"){
                    this.setFrame(this.currentWeapon.spriteIndex)
                }
            }
        }, this)
    }
    getPatrolPoints(){
        let patrolPoint = {}
        this.data.forEach((el)=>{
            if(el.name === "patrolX") patrolPoint["x"] = this.x + el.value
            if(el.name === "patrolY") patrolPoint["y"] = this.y + el.value
        })
        this.patrolPoints.push(patrolPoint,{
            x:this.x,
            y:this.y
        })
    }
    startNextGlobalTask(){
        if(this.currentGlobalTaskIndex === null){
            this.currentGlobalTaskIndex = 0
            this.currentGlobalTask = this.globalTasks[this.currentGlobalTaskIndex]
            this.currentGlobalTask.state = "inProgress"
        }

        this.generateLocalTasks()
    }
    startNextLocalTask(){
        this.currentLocalTask.state = "stopped"

        this.currentLocalTaskIndex++

        if(this.currentLocalTaskIndex >= this.localTasks.length){
            this.currentLocalTaskIndex = 0
        }

        this.currentLocalTask = this.localTasks[this.currentLocalTaskIndex]
    }
    generateLocalTasks(){
        if(this.currentGlobalTask.name === "patrol"){
            this.localTasks.push({
                name:"goTo",
                target:this.patrolPoints[0],
                state:"stopped"
            },{
                name:"idle",
                duration:IDLE_DURATION,
                state:"stopped"
            },{
                name:"goTo",
                target:this.patrolPoints[1],
                state:"stopped"
            },{
                name:"idle",
                duration:IDLE_DURATION,
                state:"stopped"
            })

            this.currentLocalTaskIndex = 0
            this.currentLocalTask = this.localTasks[this.currentLocalTaskIndex]
        }
    }
    reload(){
        if(this.ammo[this.currentWeapon.ammoType] === 0 ) return

        this.state = "reload"
        this.canShoot = false

        this.play(this.currentWeapon.label + "ReloadTransition" + "_" + this.name)
        this.scene.time.addEvent({
            delay:this.currentWeapon.reloadTime,
            callback:()=>{
                this.state = "idle"
                this.canShoot = true

                let requiredAmmo = this.currentWeapon.holderQuantity - this.currentWeapon.holder1,
                    ammoQuantity = this.ammo[this.currentWeapon.ammoType] >= requiredAmmo ? requiredAmmo : this.ammo[this.currentWeapon.ammoType]

                this.ammo[this.currentWeapon.ammoType] -= ammoQuantity
                this.currentWeapon.holder1 += ammoQuantity

                this.stop()
                this.play(this.currentWeapon.label + "ReloadTransition"  + "_" + this.name)
            },
        })
    }
    shoot(){
        // update state and ui
        this.canShoot = false
        this.currentWeapon["holder1"]--

        let muzzleX = this.currentWeapon["offsetX1"] * Math.cos(this.rotation) - this.currentWeapon["offsetY1"] * Math.sin(this.rotation),
            muzzleY = this.currentWeapon["offsetX1"] * Math.sin(this.rotation) + this.currentWeapon["offsetY1"] * Math.cos(this.rotation)
        this.applyMuzzleEffect(muzzleX,muzzleY)

        let bullet = this.bullets.find(bullet => !bullet.active)
        if (bullet)
        {
            bullet.fire(
                this.x + muzzleX,
                this.y + muzzleY,
                this.rotation,
                this.currentWeapon.bulletLifespan,
                this.currentWeapon.bulletSpeed
            );
        } else {
            this.bullets.push(new Bullet({
                scene:this.scene,
                x:this.x + muzzleX,
                y:this.y + muzzleY,
                rotation:this.rotation,
                lifespan:this.currentWeapon.bulletLifespan,
                speed:this.currentWeapon.bulletSpeed
            }))
        }

        this.scene.time.addEvent({
            delay:this.currentWeapon.shootDelay,
            callback:()=>{
                this.canShoot = true
            },
        })
    }
    applyMuzzleEffect(muzzleX : number, muzzleY : number){
        this.muzzleFire.setPosition(this.x + muzzleX,this.y + muzzleY)
        this.muzzleFire.rotation = this.rotation
        this.muzzleFire.setVisible(true)

        this.scene.time.addEvent({
            delay:25,
            callback:()=>{
                this.muzzleFire.setVisible(false)
            },
        })
    }
    velocityToTarget(from, to, speed = 1){
        let direction = Math.atan((to.x - from.x) / (to.y - from.y));

            speed = to.y >= from.y ? speed : -speed;

        return { x: speed * Math.sin(direction), y: speed * Math.cos(direction) };
    }
    handleLocalTask(){
        if(this.currentLocalTask.name === "goTo"){
            if(this.currentLocalTask.state === "stopped"){
                this.currentLocalTask.state = "inProgress"
                this.feet.play("walk")

                let velocityToTarget = this.velocityToTarget(this,this.currentLocalTask.target,HUMAN_SPEED_WALK),
                    rotation = Phaser.Math.Angle.Between(
                        this.x,
                        this.y,
                        this.currentLocalTask.target.x,
                        this.currentLocalTask.target.y
                    )

                this.rotationTween = this.scene.tweens.add({
                    targets:this,
                    rotation,
                    duration:300
                })

                this.setVelocity(velocityToTarget.x,velocityToTarget.y)
            }

            if(this.currentLocalTask.state === "inProgress"){
                if(Phaser.Math.Distance.BetweenPoints(this,this.currentLocalTask.target) <= GO_TO_COMPLETE_DISTANCE){
                    this.setVelocity(0,0)
                    this.feet.stop()

                    this.startNextLocalTask()
                }
            }
        }

        if(this.currentLocalTask.name === "idle"){
            if(this.currentLocalTask.state === "stopped"){
                this.currentLocalTask.state = "inProgress"

                this.scene.time.addEvent({
                    delay:this.currentLocalTask.duration,
                    callback:()=>{
                        this.startNextLocalTask()
                    },
                })
            }
        }
    }
    update(){
        if(this.currentLocalTask){
            this.handleLocalTask()
        }

        // feet and rotation
        this.feet.x = this.x
        this.feet.y = this.y
        this.feet.rotation = this.rotation
    }
}
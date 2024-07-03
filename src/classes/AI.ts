import { Physics, GameObjects, Tweens, Time } from 'phaser';
import {PLAYER_DEPTH, HUMAN_SPEED_WALK, IDLE_DURATION, GO_TO_COMPLETE_DISTANCE,
    NPC_AGGRESSION_LEVEL,NPC_DETECTION_DISTANCE,NPC_BASIC_PLAYER_RELATION,
    NPC_DETECTION_INTERVAL,NPC_HIT_RELATION_DECREASE,NPC_ATTACK_TARGET_RADIUS_POINT,
    NPC_MOVING_DIRECTION_CHECK_TIMEOUT} from "../constants";
import {weapons} from "../data/weapons"
import {Bullet} from "./Bullet";
import utils from "../utils";

export class AI extends Physics.Matter.Sprite{

    category : string

    // state and data
    name : string
    state : string
    stamina : number
    data : Array<Object>
    speed : number
    playerDetected : boolean = false
    playerRelation: number
    detectionDistance: number
    detectionInterval: number

    // components
    feet : GameObjects.Sprite

    // shooting
    muzzleFire : GameObjects.Image
    bullets : Array<Bullet>
    canShoot : boolean
    readyToShoot : boolean
    isMoving : boolean
    ammo : object
    weapons : Array<Object>
    currentWeapon : object

    // world role and factions
    factions : Array<string>

    // tasks, player detection and helpful
    detectionEvent : Time.TimerEvent
    rotationTween : Tweens.Tween

    patrolPoints : Array<Object>
    globalTasks : Array<Object>
    currentGlobalTask : Object | null
    currentGlobalTaskIndex : number | null

    localTasks : Array<Object>
    currentLocalTaskIndex : null | number
    currentLocalTask : null | Object
    movingDirectionCheckTimeout : number

    constructor(config) {
        super(config.scene.matter.world, config.x, config.y, "bandit", 0, {
            shape: {type: 'circle', radius: 65},
            render: {sprite: {xOffset: -0.15}},
            frictionAir: 0,
        })

        this.setScale(.5,.5).setDepth(PLAYER_DEPTH)

        // technical
        this.category = "character"

        // config, inventory, state
        this.name = "bandit"
        this.state = "idle"
        this.stamina = 100
        this.data = config.data
        this.speed = HUMAN_SPEED_WALK
        this.playerRelation = this.getDataByLabel("playerRelation") || NPC_BASIC_PLAYER_RELATION
        this.detectionDistance = this.getDataByLabel("detectionDistance") || NPC_DETECTION_DISTANCE
        this.detectionInterval = this.getDataByLabel("detectionInterval") || NPC_DETECTION_INTERVAL
        this.bullets = []
        this.canShoot = true
        this.readyToShoot = false
        this.isMoving = false
        this.ammo = {
            ".44":80,
        }
        this.weapons = utils.deepCopy(weapons)
        this.currentWeapon = this.weapons[0]

        this.factions = ["bastards"]

        // technical data
        this.patrolPoints = []
        this.globalTasks = config.globalTasks || this.getGlobalTaskFromObject() || []
        this.currentGlobalTaskIndex = null
        this.currentGlobalTask = null

        this.localTasks = []
        this.currentLocalTaskIndex = null
        this.currentLocalTask = null
        this.movingDirectionCheckTimeout = 0

        // foot
        this.feet = config.scene.add.sprite(this.x,this.y,"feet")
            .setScale(.35,.35).setDepth(PLAYER_DEPTH - 1).setFrame(6)

        // muzzle fire and aim
        this.muzzleFire = config.scene.add.image(0,0,"muzzle_fire").setVisible(false).setScale(.4,.4).setOrigin(0,.5)

        config.scene.add.existing(this)

        this.initAnimations()
        this.startNextGlobalTask()
        this.initEvents()
    }
    initEvents(){
        this.detectionEvent = this.scene.time.addEvent({
            delay: this.detectionInterval,
            callback:this.checkPlayerDetection,
            callbackScope:this,
            repeat: -1
        })
    }
    checkPlayerDetection(){
        if(Phaser.Math.Distance.BetweenPoints(this.scene.player,this) <= this.detectionDistance){
            this.detectPlayer()
        } else {
            this.losePlayer()
        }
    }
    detectPlayer(){
        if(this.playerDetected) return

        this.playerDetected = true

        if(this.playerRelation <= NPC_AGGRESSION_LEVEL){
            // add task to shoot
            this.addAndStartGlobalTask({
                name:"attack",
                target:this.scene.player,
                state:"inProgress",
                canEnd:true
            })
        }
    }
    losePlayer(){
        this.playerDetected = false

        l("lost sight of player")
    }
    getDataByLabel(label : string) : undefined | number | string {
        return this.data.find((el) => el.name === label )?.value
    }
    // task state - stopped paused inProgress canceled
    getGlobalTaskFromObject(){
        if(this.data.find((el) => { return el.name.includes("patrol") })){
            this.getPatrolPoints()

            return [{
                name:"patrol",
                state:"stopped",
                canEnd:false
            }]
        } else {
            return [{
                name:"idle",
                state:"stopped",
                canEnd:false
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
        } else {
            this.currentGlobalTask.state = "stopped"

            this.currentGlobalTaskIndex++

            if(this.currentGlobalTaskIndex >= this.globalTasks.length){
                this.currentGlobalTask = 0
            }

            this.currentGlobalTask = this.globalTasks[this.currentGlobalTaskIndex]
            this.currentGlobalTask.state = "inProgress"
        }

        this.generateLocalTasks()
    }
    addAndStartGlobalTask(task){
        this.globalTasks.push(task)

        this.currentGlobalTask.state = "stopped"
        this.currentLocalTaskIndex = this.globalTasks.length - 1
        this.currentGlobalTask = task

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
        this.localTasks = []

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
        }

        if(this.currentGlobalTask.name === "attack"){
            this.localTasks.push({
                name:"attack",
                target:this.currentGlobalTask.target,
                moveTarget:null,
                state:"stopped"
            })
        }

        this.currentLocalTaskIndex = 0
        this.currentLocalTask = this.localTasks[this.currentLocalTaskIndex]
    }
    reload(){
        if(this.ammo[this.currentWeapon.ammoType] === 0 || this.state === "reload") return

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
    shoot(weaponIndex = 1){
        // no ammo
        if(this.currentWeapon["holder" + weaponIndex] === 0){
            this.reload()
            return
        }

        // update state and ui
        this.canShoot = false
        this.currentWeapon["holder1"]--

        let muzzleX = this.currentWeapon["offsetX1"] * Math.cos(this.rotation) - this.currentWeapon["offsetY1"] * Math.sin(this.rotation),
            muzzleY = this.currentWeapon["offsetX1"] * Math.sin(this.rotation) + this.currentWeapon["offsetY1"] * Math.cos(this.rotation)
        this.applyMuzzleEffect(muzzleX,muzzleY)

        let bullet = this.bullets.find(bullet => !bullet.active),
            bulletConfig = {
                owner:this,
                damage:this.currentWeapon.damage,
                scene:this.scene,
                x:this.x + muzzleX,
                y:this.y + muzzleY,
                rotation:this.rotation + this.getShootInaccuracyAngle(),
                lifespan:this.currentWeapon.bulletLifespan,
                speed:this.currentWeapon.bulletSpeed
            }
        if (bullet)
        {
            bullet.fire(bulletConfig);
        } else {
            this.bullets.push(new Bullet(bulletConfig))
        }

        this.scene.time.addEvent({
            delay:this.currentWeapon.shootDelay,
            callback:()=>{
                this.canShoot = true
            },
        })
    }
    getShootInaccuracyAngle() : number {
        return Phaser.Math.FloatBetween(-.1,.1)
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
    velocityToTarget(from, to, speed = 1) : object {
        let direction = Math.atan((to.x - from.x) / (to.y - from.y));

            speed = to.y >= from.y ? speed : -speed;

        return { x: speed * Math.sin(direction), y: speed * Math.cos(direction) };
    }
    getCorrectTweenRotationToTarget(target : GameObjects.GameObject) : number{
        let angleBetween = Phaser.Math.Angle.Between(
                this.x,
                this.y,
                target.x,
                target.y
            ),
            diff = angleBetween - this.rotation

        if(diff < -Math.PI){
            diff += 2 * Math.PI
        } else if (diff > Math.PI){
            diff -= 2 * Math.PI
        }

        return this.rotation + diff
    }
    generateLocalAttackMoveTarget() : void{
        let circle = new Phaser.Geom.Circle(
            this.currentLocalTask.target.x,
            this.currentLocalTask.target.y,
            NPC_ATTACK_TARGET_RADIUS_POINT
        )

        this.currentLocalTask.moveTarget = circle.getRandomPoint()
        let targetCircle = this.scene.add.circle(
            this.currentLocalTask.moveTarget.x,
            this.currentLocalTask.moveTarget.y,
            15,
            0xFF0000
            )

        // in world bounds
        if(
            this.currentLocalTask.moveTarget.x < 100 ||
            this.currentLocalTask.moveTarget.x > this.scene.map.widthInPixels - 100 ||
            this.currentLocalTask.moveTarget.y < 100 ||
            this.currentLocalTask.moveTarget.y > this.scene.map.heightInPixels - 100
        ) {
            targetCircle.destroy()
            this.generateLocalAttackMoveTarget()
            return
        }

        // straight line collision with static bodies
        let intersects = this.scene.matter.intersectRay(
            this.x,
            this.y,
            this.currentLocalTask.moveTarget.x,
            this.currentLocalTask.moveTarget.y,
        )
        if(intersects.length > 1){
            targetCircle.destroy()
            this.generateLocalAttackMoveTarget()
            return
        }

        // collision with static bodies
        let obstacles = this.scene.matter.world.getAllBodies().filter((body) => body.category === "obstacle" ),
            pointMatterObject = this.scene.matter.add.image(
                this.currentLocalTask.moveTarget.x,
                this.currentLocalTask.moveTarget.y,
                'aim_cursor',
                null,
                {
                shape:{
                    type: 'circle',
                    radius: 30
                },
                isSensor:true,
            }).setVisible(false)

        if(this.scene.matter.intersectBody(pointMatterObject.body,obstacles).length){
            targetCircle.destroy()
            this.generateLocalAttackMoveTarget()
        }

        pointMatterObject.destroy()
    }
    moveTo(target) : void {
        this.isMoving = true

        let velocity = this.velocityToTarget(this,target,HUMAN_SPEED_WALK)

        this.setVelocity(velocity.x,velocity.y)
        this.feet.play("walk")
    }
    handleLocalTask(){
        if(this.currentLocalTask.name === "attack"){
            if(this.currentLocalTask.state === "stopped"){
                this.currentLocalTask.state = "inProgress"

                let rotation = this.getCorrectTweenRotationToTarget(this.currentLocalTask.target)

                this.rotationTween = this.scene.tweens.add({
                    targets:this,
                    rotation,
                    duration:300,
                    onComplete:()=>{
                        this.readyToShoot = true

                        this.generateLocalAttackMoveTarget()
                        this.moveTo(this.currentLocalTask.moveTarget)
                    }
                })
            }

            if(this.currentLocalTask.state === "inProgress"){
                this.movingDirectionCheckTimeout++
                if(this.movingDirectionCheckTimeout > NPC_MOVING_DIRECTION_CHECK_TIMEOUT){
                    this.movingDirectionCheckTimeout = 0

                    this.moveTo(this.currentLocalTask.moveTarget)
                    return
                }

                if(this.readyToShoot){
                    this.rotation = Phaser.Math.Angle.Between(
                        this.x,
                        this.y,
                        this.currentLocalTask.target.x,
                        this.currentLocalTask.target.y
                    )
                }

                if(this.isMoving && this.currentLocalTask.moveTarget &&
                    Phaser.Math.Distance.BetweenPoints(this,this.currentLocalTask.moveTarget) <= GO_TO_COMPLETE_DISTANCE){
                    this.generateLocalAttackMoveTarget()
                    this.moveTo(this.currentLocalTask.moveTarget)
                }

                if(this.readyToShoot && this.canShoot){
                    this.shoot()
                }
            }
        }

        if(this.currentLocalTask.name === "goTo"){
            if(this.currentLocalTask.state === "stopped"){
                this.currentLocalTask.state = "inProgress"

                let rotation = this.getCorrectTweenRotationToTarget(this.currentLocalTask.target)

                this.rotationTween = this.scene.tweens.add({
                    targets:this,
                    rotation,
                    duration:300
                })

                this.moveTo(this.currentLocalTask.target)
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
                this.isMoving = false

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
    hasCommonFactions(character : object) : boolean {
        let hasCommonFactions = false
        for(let i = 0; i < this.factions; i++){
            if(character.factions.includes(this.factions[i])){
                hasCommonFactions = true
                break
            }
        }
        return hasCommonFactions
    }
    getHitByBullet(bullet){
        if(bullet.getData("owner") === this.scene.player && !this.hasCommonFactions(this.scene.player)){
            this.playerRelation -= NPC_HIT_RELATION_DECREASE

            this.detectPlayer()
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
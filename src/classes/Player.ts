import { Physics, GameObjects, Input, Time } from 'phaser';
import {
    PLAYER_DEPTH, HEALTH_RECOVERY_TIMEOUT, HUMAN_SPEED_WALK, HUMAN_SPEED_RUN, UI_COLOR_RED_CSS, UI_DEPTH,
    UI_COLOR_RED, UI_COLOR_SILVER, UI_MARGIN, STAMINA_SPENDING, STAMINA_RECOVERY
} from "../constants"
import {Bullet} from "../classes/Bullet";
import {Grenade} from "../classes/Grenade";
import {weapons,ammo} from "../data/weapons"
import {BloodDrop} from "./BloodDrop";

export class Player extends Physics.Matter.Sprite{

    controllable : boolean
    category : string

    state : string
    health : number
    stamina : number
    speed : number

    muzzleFire : GameObjects.Image
    aim : GameObjects.Image

    bullets : Array<Bullet>
    grenades : Array<Grenade>
    controlKeys : object
    canShoot : boolean
    ammo : object
    weapons : Array<object>
    currentWeapon : object

    // player world status and missions etc
    factions : Array<string>

    // technical events etc
    healthRecoveryEvent : Time.TimerEvent
    reloadEvent : Time.TimerEvent
    shootDelayEvent : Time.TimerEvent

    feet : GameObjects.Sprite

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"player",0,{
            shape:{ type: 'circle', radius:65 },
            render: { sprite: { xOffset: -0.15 } },
            frictionAir:0,
        })

        this.setScale(.5,.5).setDepth(PLAYER_DEPTH)

        // technical
        this.controllable = true
        this.category = "character"

        // config, inventory, state
        this.state = "idle"
        this.health = config.health || 100
        this.stamina = config.stamina || 100
        this.speed = HUMAN_SPEED_WALK
        this.bullets = []
        this.grenades = []
        this.canShoot = true

        this.ammo = Phaser.Utils.Objects.Clone(ammo)
        this.weapons = JSON.parse(JSON.stringify(weapons))
        this.currentWeapon = this.weapons[0]

        // player world status and missions etc
        this.factions = []

        // foot
        this.feet = config.scene.add.sprite(this.x,this.y,"feet")
            .setScale(.35,.35).setDepth(PLAYER_DEPTH - 1).setFrame(6)

        // muzzle fire and aim
        this.muzzleFire = config.scene.add.image(0,0,"muzzle_fire").setVisible(false).setScale(.4,.4).setOrigin(0,.5)
        this.aim = config.scene.add.image(this.x + 100,this.y,"aim_cursor").setScale(.75,.75).setDepth(UI_DEPTH)

        config.scene.add.existing(this)

        this.createAnimations()
        this.initControls(config.scene)
        this.initWeaponsSelect()
        this.initAdditionalEvents()
    }
    initAdditionalEvents(){
        this.healthRecoveryEvent = this.scene.time.addEvent({
            delay: HEALTH_RECOVERY_TIMEOUT,
            callback:this.recoverHealth,
            callbackScope:this,
            repeat: -1
        })
    }
    createAnimations(){
        this.anims.create({
            key: 'singlePistolReloadTransition',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 3 ] }),
            frameRate: 8,
        })
        this.anims.create({
            key: 'pistolsReloadTransition',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 4 ] }),
            frameRate: 8,
        })
        this.anims.create({
            key: 'rifleReloadTransition',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 5 ] }),
            frameRate: 8,
        })
        this.anims.create({
            key: 'singlePistolReload',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 6, 7 ] }),
            frameRate: 4,
            repeat:-1
        })
        this.anims.create({
            key: 'pistolsReload',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 8, 9 ] }),
            frameRate: 4,
            repeat:-1
        })
        this.anims.create({
            key: 'rifleReload',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 10, 11 ] }),
            frameRate: 4,
            repeat:-1
        })
        this.anims.create({
            key: 'dynamiteThrow',
            frames: this.anims.generateFrameNumbers('player', { frames: [ 13, 14 ] }),
            frameRate: 8,
        })

        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation)=>{
            if(animation.key === this.currentWeapon.label + "ReloadTransition"){
                if(this.state === "reload"){
                    this.play(this.currentWeapon.label + "Reload")
                }
                if(this.state === "idle"){
                    this.setFrame(this.currentWeapon.spriteIndex)
                }
            }
            if(animation.key === this.currentWeapon.label + "Throw"){
                this.releaseThrowGrenade()
                this.setFrame(this.currentWeapon.spriteIndex)
            }
        }, this)
    }
    initControls(scene){
        this.controlKeys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload:Phaser.Input.Keyboard.KeyCodes.R,
            shift:Phaser.Input.Keyboard.KeyCodes.SHIFT
        })

        // Enables movement of player with WASD keys
        scene.input.keyboard.on('keydown', event => {
            if(!this.controllable) return

            // run
            if(event.key === "Shift"){
                this.speed = HUMAN_SPEED_RUN
            }

            this.updateSpeed()
            if (this.controlKeys['reload'].isDown && this.state !== "reload") { this.reload() }

            // change weapon
            if("12345".includes(event.key) && this.state !== "reload"){
                this.toggleWeapon(Number(event.key) - 1)
            }
        });
        scene.input.keyboard.on('keyup', event => {
            if(!this.controllable) return

            // run
            if(event.key === "Shift"){
                this.speed = HUMAN_SPEED_WALK

                this.updateSpeed()
            }

            if (this.controlKeys['up'].isUp && this.controlKeys['down'].isUp) { this.setVelocityY(0); }
            if (this.controlKeys['down'].isUp && this.controlKeys['up'].isUp) { this.setVelocityY(0); }
            if (this.controlKeys['left'].isUp && this.controlKeys['right'].isUp) { this.setVelocityX(0); }
            if (this.controlKeys['right'].isUp && this.controlKeys['left'].isUp) { this.setVelocityX(0); }

            let playerVelocity = this.getVelocity()
            if(playerVelocity.x === 0 && playerVelocity.y === 0){
                this.feet.stop()
                this.feet.setFrame(6)
            }
        });

        // Move reticle upon locked pointer move
        scene.input.on('pointermove', pointer =>
        {
            if (scene.input.mouse.locked) {
                this.aim.x += pointer.movementX;
                this.aim.y += pointer.movementY;
            }
        });
    }
    updateSpeed(){
        if(!this.controllable) return

        if (this.controlKeys['up'].isDown && !this.controlKeys['down'].isDown) { this.setVelocityY(-this.speed); }
        if (this.controlKeys['down'].isDown && !this.controlKeys['up'].isDown) { this.setVelocityY(this.speed); }
        if (this.controlKeys['left'].isDown && !this.controlKeys['right'].isDown) { this.setVelocityX(-this.speed); }
        if (this.controlKeys['right'].isDown && !this.controlKeys['left'].isDown) { this.setVelocityX(this.speed); }
    }
    initWeaponsSelect(){
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) =>
        {
            if(this.state !== "reload" && this.controllable){
                this.selectWeapon(deltaY > 0)
            }
        });
    }
    selectWeapon(next : boolean = true){
        let currentWeaponIndex = this.weapons.findIndex((el) => el === this.currentWeapon),
            newCurrentWeaponIndex = null

        if(next){
            newCurrentWeaponIndex = currentWeaponIndex + 1
        } else {
            newCurrentWeaponIndex = currentWeaponIndex - 1
        }

        if(newCurrentWeaponIndex >= this.weapons.length) newCurrentWeaponIndex = 0
        if(newCurrentWeaponIndex < 0) newCurrentWeaponIndex = this.weapons.length - 1

        this.currentWeapon = this.weapons[newCurrentWeaponIndex]

        this.scene.game.events.emit("updatePlayerWeaponUI")
        this.setFrame(this.currentWeapon.spriteIndex)
    }
    toggleWeapon(index : number){
        if(this.weapons[index]){
            this.currentWeapon = this.weapons[index]
            this.scene.game.events.emit("updatePlayerWeaponUI")
            this.setFrame(this.currentWeapon.spriteIndex)
        }
    }
    reload(){
        if(this.currentWeapon.type === "grenade" || this.ammo[this.currentWeapon.ammoType] === 0
            || this.state === "reload"
            || this.currentWeapon.holder1 === this.currentWeapon.holderQuantity) return

        this.state = "reload"
        this.canShoot = false

        this.play(this.currentWeapon.label + "ReloadTransition")
        this.reloadEvent = this.scene.time.addEvent({
            delay:this.currentWeapon.reloadTime,
            callback:()=>{
                this.state = "idle"
                this.canShoot = true

                let ammoQuantityIndex = this.currentWeapon.double ? 2 : 1,
                    requiredAmmo = (this.currentWeapon.holderQuantity - this.currentWeapon.holder1) * ammoQuantityIndex,
                    ammoQuantity = this.ammo[this.currentWeapon.ammoType] >= requiredAmmo ? requiredAmmo : this.ammo[this.currentWeapon.ammoType]

                this.ammo[this.currentWeapon.ammoType] -= ammoQuantity

                if(this.currentWeapon.double){
                    if(ammoQuantity % 2 === 0){
                        this.currentWeapon.holder1 += ammoQuantity / 2
                        this.currentWeapon.holder2 += ammoQuantity / 2
                    } else {
                        this.currentWeapon.holder1 += Math.ceil(ammoQuantity / 2)
                        this.currentWeapon.holder2 += ammoQuantity - this.currentWeapon.holder1
                    }
                } else {
                    this.currentWeapon.holder1 += ammoQuantity
                }

                this.stop()
                this.play(this.currentWeapon.label + "ReloadTransition")
                this.scene.game.events.emit("updatePlayerWeaponUI")
            },
        })
    }
    shoot(weaponIndex = 1){
        // no ammo
        if(this.currentWeapon["holder" + weaponIndex] === 0){
            return
        }

        // update state and ui
        this.canShoot = false
        this.currentWeapon["holder" + weaponIndex]--
        this.scene.game.events.emit("updatePlayerWeaponUI")

        // shoot effect
        this.scene.cameras.main.shake(this.currentWeapon.shakeDuration,this.currentWeapon.shakeIntensity,true);

        let muzzleX = this.currentWeapon["offsetX" + weaponIndex] * Math.cos(this.rotation) - this.currentWeapon["offsetY" + weaponIndex] * Math.sin(this.rotation),
            muzzleY = this.currentWeapon["offsetX" + weaponIndex] * Math.sin(this.rotation) + this.currentWeapon["offsetY" + weaponIndex] * Math.cos(this.rotation)
        this.applyMuzzleEffect(muzzleX,muzzleY,weaponIndex)

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

        let weapon = this.currentWeapon
        this.shootDelayEvent = this.scene.time.addEvent({
            delay:this.currentWeapon.shootDelay,
            callback:()=>{
                this.canShoot = true

                if(this.currentWeapon.double && weaponIndex === 1 && weapon === this.currentWeapon){
                    this.shoot(2)
                }
            },
        })
    }
    throwGrenade(){
        // no grenade
        if(this.ammo[this.currentWeapon.ammoType] === 0){
            return
        }

        // update state and ui
        this.canShoot = false
        this.ammo[this.currentWeapon.ammoType]--
        this.scene.game.events.emit("updatePlayerWeaponUI")

        this.play(this.currentWeapon.label + "Throw")
    }
    releaseThrowGrenade(){
        let startX = this.currentWeapon["offsetX"] * Math.cos(this.rotation) - this.currentWeapon["offsetY"] * Math.sin(this.rotation),
            startY = this.currentWeapon["offsetX"] * Math.sin(this.rotation) + this.currentWeapon["offsetY"] * Math.cos(this.rotation)

        let grenade = this.grenades.find(grenade => !grenade.active && grenade.name === this.currentWeapon.label)
        if (grenade)
        {
            grenade.fire(
                this.x + startX,
                this.y + startY,
                this.rotation,
                this.currentWeapon.explosionDelay,
                this.currentWeapon.throwSpeed
            );
        } else {
            this.grenades.push(new Grenade({
                scene:this.scene,
                x:this.x + startX,
                y:this.y + startY,
                label:this.currentWeapon.label,
                rotation:this.rotation,
                explosionDelay:this.currentWeapon.explosionDelay,
                speed:this.currentWeapon.throwSpeed
            }))
        }

        this.shootDelayEvent = this.scene.time.addEvent({
            delay:this.currentWeapon.throwDelay,
            callback:()=>{
                this.canShoot = true
            },
        })
    }
    getShootInaccuracyAngle() : number {
        return Phaser.Math.FloatBetween(-this.currentWeapon.inaccuracyAngle,this.currentWeapon.inaccuracyAngle)
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
    getHitByBullet(bullet){
        this.health -= bullet.getData("damage")

        this.emitBlood(bullet)

        if(this.health <= 0){
            this.health = 0
            this.die()
        }

        this.scene.game.events.emit("updatePlayerStat",{
            statName:"health",
            statValue:this.health
        })
    }
    emitBlood(bullet : Bullet) : void {
        let bloodLength = Phaser.Math.Between(6,10),
            bulletVelocity = bullet.getVelocity()
        for(let i = 0; i < bloodLength; i++){
            let speedX = bulletVelocity.x + Phaser.Math.Between(-50,50),
                speedY = bulletVelocity.y + Phaser.Math.Between(-50,50)

            new BloodDrop(this,{
                speedX,
                speedY
            })
        }
    }
    recoverHealth(value: number = 5){
        if(this.health === 100) return

        this.health += value

        if(this.health > 100) this.health = 100

        this.scene.game.events.emit("updatePlayerStat",{
            statName:"health",
            statValue:this.health
        })
    }
    die(){
        this.state = "died"
        this.controllable = false

        this.setFrame(15)

        this.stop()
        this.feet.stop()
        this.feet.setVisible(false)
        this.setSensor(true)
        this.setVelocity(0,0)
        this.setAngularVelocity(0)

        this.scene.time.removeEvent(this.healthRecoveryEvent)
        this.scene.time.removeEvent(this.reloadEvent)
        this.scene.time.removeEvent(this.shootDelayEvent)
    }
    update(){
        if(!this.controllable) return

        if(this.controlKeys.shift.isDown){
            if(this.stamina > 0){
                this.stamina -= STAMINA_SPENDING
            } else {
                this.stamina = 0

                this.speed = HUMAN_SPEED_WALK

                this.updateSpeed()
            }
        } else if(this.stamina < 100) {
            this.stamina += STAMINA_RECOVERY
        }

        // rotation
        this.rotation = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            this.aim.x,
            this.aim.y
        )

        // feet and rotation
        this.feet.x = this.x
        this.feet.y = this.y
        this.feet.rotation = this.rotation


        // straight and side walk
        let playerVelocity = this.getVelocity()
        if( (playerVelocity.x !== 0 || playerVelocity.y !== 0)){
            let velocityAngle = Phaser.Math.Angle.Between(this.x,this.y,this.x + playerVelocity.x,this.y + playerVelocity.y),
                playerFaceToAngle = this.rotation,
                faceMovementAngleDiffDegrees = Phaser.Math.RadToDeg(velocityAngle - playerFaceToAngle)
            // straight anim
            if( (faceMovementAngleDiffDegrees <= 45 && faceMovementAngleDiffDegrees >= -45)
            || (faceMovementAngleDiffDegrees <= -135 && faceMovementAngleDiffDegrees >= -225)
            || faceMovementAngleDiffDegrees >= 135
            ){
                if(!this.feet.anims.isPlaying){
                    this.feet.play("walk")
                }
            }
            // aside anim
            else {
                if(!this.feet.anims.isPlaying){
                    this.feet.play("walk_aside")
                }
            }
        } else {
            if(this.feet.anims.isPlaying){
                this.feet.stop()
            }
        }

        // firing
        if(this.scene.input.activePointer.isDown && this.canShoot) {
            if(this.currentWeapon.type === "weapon"){
                this.shoot()
            }
            if(this.currentWeapon.type === "grenade"){
                this.throwGrenade()
            }
        }
    }
}
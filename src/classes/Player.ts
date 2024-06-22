import { Physics, GameObjects, Input } from 'phaser';
import {PLAYER_DEPTH, HUMAN_SPEED_WALK, HUMAN_SPEED_RUN, UI_COLOR_RED_CSS, UI_DEPTH,
    UI_COLOR_RED,UI_COLOR_SILVER,UI_MARGIN,STAMINA_SPENDING,STAMINA_RECOVERY} from "../constants"
import {Bullet} from "../classes/Bullet";
import {Grenade} from "../classes/Grenade";
import {weapons,ammo} from "../data/weapons"

export class Player extends Physics.Matter.Sprite{

    category : string

    state : string
    stamina : number
    speed : number

    muzzleFire : GameObjects.Image
    aim : GameObjects.Image

    staminaBar : GameObjects.Rectangle

    bullets : Array<Bullet>
    grenades : Array<Grenade>
    controlKeys : object
    canShoot : boolean
    ammo : object
    weapons : Array<object>
    currentWeapon : object
    weaponIcon : GameObjects.Image
    weaponAmmoUIText : GameObjects.Text
    weaponNameUIText : GameObjects.Text

    // player world status and missions etc
    factions : Array<string>

    feet : GameObjects.Sprite

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"player",0,{
            shape:{ type: 'circle', radius:65 },
            render: { sprite: { xOffset: -0.15 } },
            frictionAir:0,
        })

        this.setScale(.5,.5).setDepth(PLAYER_DEPTH)

        // technical
        this.category = "character"

        // config, inventory, state
        this.state = "idle"
        this.stamina = 100
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

        this.staminaBar = config.scene.add.rectangle(
            UI_MARGIN,
            this.scene.game.config.canvas.height - UI_MARGIN * 2,
            Math.ceil(200 * (this.stamina / 100)),
            20,
            UI_COLOR_SILVER
        ).setScrollFactor(0).setDepth(UI_DEPTH).setOrigin(0,0)
        this.createWeaponUI(config)
        this.createAnimations()
        this.initControls(config.scene)
        this.initWeaponsSelect()
    }
    createWeaponUI(config : object){
        this.weaponIcon = config.scene.add.sprite(
            config.scene.game.config.canvas.width - UI_MARGIN,
            config.scene.game.config.canvas.height - 60,
            "weapons_icons",
            this.currentWeapon.iconIndex
        ).setOrigin(1,1).setScale(.5).setScrollFactor(0).setDepth(UI_DEPTH)

        this.weaponAmmoUIText = config.scene.add.text(
            this.weaponIcon.getBottomCenter().x,
            config.scene.game.config.canvas.height - UI_MARGIN * 2,
            this.getAmmoUIText(),
            {fontSize:28,color:UI_COLOR_RED_CSS,fontFamily:"Arial, sans-serif"}
        ).setOrigin(.5,1).setScrollFactor(0).setDepth(UI_DEPTH)

        this.weaponNameUIText = config.scene.add.text(
            this.weaponAmmoUIText.getBottomRight().x,
            config.scene.game.config.canvas.height - 15,
            this.currentWeapon.name,
            {fontSize:24,color:UI_COLOR_RED_CSS,fontFamily:"Arial, sans-serif"}
        ).setOrigin(1,1).setScrollFactor(0).setDepth(UI_DEPTH)
    }
    updateStatsUI(){
        this.staminaBar.width = Math.ceil(200 * (this.stamina / 100))
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
        if (this.controlKeys['up'].isDown && !this.controlKeys['down'].isDown) { this.setVelocityY(-this.speed); }
        if (this.controlKeys['down'].isDown && !this.controlKeys['up'].isDown) { this.setVelocityY(this.speed); }
        if (this.controlKeys['left'].isDown && !this.controlKeys['right'].isDown) { this.setVelocityX(-this.speed); }
        if (this.controlKeys['right'].isDown && !this.controlKeys['left'].isDown) { this.setVelocityX(this.speed); }
    }
    initWeaponsSelect(){
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) =>
        {
            if(this.state !== "reload"){
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

        this.updateWeaponUI()
    }
    toggleWeapon(index : number){
        if(this.weapons[index]){
            this.currentWeapon = this.weapons[index]
            this.updateWeaponUI()
        }
    }
    updateWeaponUI(){
        this.weaponAmmoUIText.setText(this.getAmmoUIText())
        this.weaponNameUIText.setText(this.currentWeapon.name)
        this.setFrame(this.currentWeapon.spriteIndex)
        this.weaponIcon.setFrame(this.currentWeapon.iconIndex)
    }
    reload(){
        if(this.currentWeapon.type === "grenade" || this.ammo[this.currentWeapon.ammoType] === 0
            || this.state === "reload"
            || this.currentWeapon.holder1 === this.currentWeapon.holderQuantity) return

        this.state = "reload"
        this.canShoot = false

        this.play(this.currentWeapon.label + "ReloadTransition")
        this.scene.time.addEvent({
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

                this.weaponAmmoUIText.setText(this.getAmmoUIText())
                this.stop()
                this.play(this.currentWeapon.label + "ReloadTransition")
            },
        })
    }
    getAmmoUIText() : string{
        if(this.currentWeapon.type === "weapon"){
            let holder2Text = this.currentWeapon.double ? "-" + this.currentWeapon.holder2 : ""
            return this.currentWeapon.holder1 + holder2Text + "/" + this.ammo[this.currentWeapon.ammoType]
        }
        if(this.currentWeapon.type === "grenade"){
            return this.ammo[this.currentWeapon.ammoType]
        }
    }
    shoot(weaponIndex = 1){
        // no ammo
        if(this.currentWeapon["holder" + weaponIndex] === 0){
            return
        }

        // update state and ui
        this.canShoot = false
        this.currentWeapon["holder" + weaponIndex]--
        this.weaponAmmoUIText.setText(this.getAmmoUIText())

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
                rotation:this.rotation,
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
        this.scene.time.addEvent({
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
        this.weaponAmmoUIText.setText(this.getAmmoUIText())

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

        this.scene.time.addEvent({
            delay:this.currentWeapon.throwDelay,
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
    getHitByBullet(bullet){

    }
    update(){
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
        this.updateStatsUI()

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
                this.throwGrenade(this.currentWeapon.label)
            }
        }
    }
}
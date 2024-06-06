import { Physics, GameObjects, Input } from 'phaser';
import {PLAYER_DEPTH, PLAYER_SPEED, UI_COLOR_DARK_RED_CSS, UI_COLOR_RED_CSS, UI_DEPTH} from "../constants"
import {Bullet} from "../classes/Bullet";
import {Grenade} from "../classes/Grenade";
import {weapons,ammo} from "../data/weapons"

export class Player extends Physics.Matter.Sprite{

    state : string

    muzzleFire : GameObjects.Image
    aim : GameObjects.Image

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

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"player",0,{
            shape:{ type: 'circle', radius:65 },
            render: { sprite: { xOffset: -0.15 } },
            frictionAir:0
        })

        this.setScale(.5,.5).setDepth(PLAYER_DEPTH)

        // config, inventory, state
        this.state = "idle"
        this.bullets = []
        this.grenades = []
        this.canShoot = true

        this.ammo = ammo
        this.weapons = weapons
        this.currentWeapon = this.weapons[0]

        // muzzle fire and aim
        this.muzzleFire = config.scene.add.image(0,0,"muzzle_fire").setVisible(false).setScale(.4,.4).setOrigin(0,.5)
        this.aim = config.scene.add.image(this.x + 100,this.y,"aim_cursor").setScale(.75,.75).setDepth(UI_DEPTH)

        config.scene.add.existing(this)

        this.createWeaponUI(config)
        this.createAnimations()
        this.initControls(config.scene)
        this.initWeaponsSelect()
    }
    createWeaponUI(config : object){
        this.weaponIcon = config.scene.add.sprite(
            config.scene.game.config.canvas.width - 20,
            config.scene.game.config.canvas.height - 60,
            "weapons_icons",
            this.currentWeapon.iconIndex
        ).setOrigin(1,1).setScale(.5).setScrollFactor(0).setDepth(UI_DEPTH)

        this.weaponAmmoUIText = config.scene.add.text(
            this.weaponIcon.getBottomCenter().x,
            config.scene.game.config.canvas.height - 40,
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

        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation)=>{
            if(animation.key === this.currentWeapon.label + "ReloadTransition"){
                if(this.state === "reload"){
                    this.play(this.currentWeapon.label + "Reload")
                }
                if(this.state === "idle"){
                    this.setFrame(this.currentWeapon.spriteIndex)
                }
            }
        }, this)
    }
    initControls(scene){
        this.controlKeys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload:Phaser.Input.Keyboard.KeyCodes.R
        })

        // Enables movement of player with WASD keys
        scene.input.keyboard.on('keydown', event => {
            if (this.controlKeys['up'].isDown && !this.controlKeys['down'].isDown) { this.setVelocityY(-PLAYER_SPEED); }
            if (this.controlKeys['down'].isDown && !this.controlKeys['up'].isDown) { this.setVelocityY(PLAYER_SPEED); }
            if (this.controlKeys['left'].isDown && !this.controlKeys['right'].isDown) { this.setVelocityX(-PLAYER_SPEED); }
            if (this.controlKeys['right'].isDown && !this.controlKeys['left'].isDown) { this.setVelocityX(PLAYER_SPEED); }
            if (this.controlKeys['reload'].isDown && this.state !== "reload") { this.reload() }

            // change weapon
            if("12345".includes(event.key) && this.state !== "reload"){
                this.toggleWeapon(Number(event.key) - 1)
            }
        });
        scene.input.keyboard.on('keyup', event => {
            if (this.controlKeys['up'].isUp && this.controlKeys['down'].isUp) { this.setVelocityY(0); }
            if (this.controlKeys['down'].isUp && this.controlKeys['up'].isUp) { this.setVelocityY(0); }
            if (this.controlKeys['left'].isUp && this.controlKeys['right'].isUp) { this.setVelocityX(0); }
            if (this.controlKeys['right'].isUp && this.controlKeys['left'].isUp) { this.setVelocityX(0); }
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
            l("no ammo")
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

                if(this.currentWeapon.double && weaponIndex === 1){
                    this.shoot(2)
                }
            },
        })
    }
    throwGrenade(grenadeLabel : string){
        // no grenade
        if(this.ammo[this.currentWeapon.ammoType] === 0){
            l("no grenade")
            return
        }

        // update state and ui
        this.canShoot = false
        this.ammo[this.currentWeapon.ammoType]--
        this.weaponAmmoUIText.setText(this.getAmmoUIText())

        let startX = this.currentWeapon["offsetX"] * Math.cos(this.rotation) - this.currentWeapon["offsetY"] * Math.sin(this.rotation),
            startY = this.currentWeapon["offsetX"] * Math.sin(this.rotation) + this.currentWeapon["offsetY"] * Math.cos(this.rotation)

        let grenade = this.grenades.find(grenade => !grenade.active && grenade.name === grenadeLabel)
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
    update(){
        // rotation
        this.rotation = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            this.aim.x,
            this.aim.y
        )

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
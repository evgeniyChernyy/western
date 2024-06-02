import { Physics, GameObjects, Input } from 'phaser';
import {PLAYER_DEPTH, PLAYER_SPEED, UI_DEPTH} from "../constants"

export class Player extends Physics.Matter.Sprite{

    muzzleFire : GameObjects.Image
    aim : GameObjects.Image

    moveKeys : object
    canShoot : boolean
    currentWeapon : object

    constructor(config) {
        super(config.scene.matter.world,config.x,config.y,"player",null,{
            shape:{ type: 'circle', radius:65 },
            render: { sprite: { xOffset: -0.1 } },
            frictionAir:0
        })

        this.setScale(.5,.5).setDepth(PLAYER_DEPTH)

        // config and state
        this.canShoot = true
        this.currentWeapon = {
            name:"pistols",
            shootDelay:500,
            shakeDuration:25,
            shakeIntensity:0.01,
            offsetX1:50,
            offsetY1:20,
            offsetX2:50,
            offsetY2:-20,
        }

        // muzzle fire
        this.muzzleFire = config.scene.add.image(0,0,"muzzle_fire").setVisible(false).setScale(.4,.4).setOrigin(0,.5)

        // aim
        this.aim = config.scene.add.image(this.x + 100,this.y,"aim_cursor").setScale(.75,.75).setDepth(UI_DEPTH)

        config.scene.add.existing(this)

        this.initControls(config.scene)
    }
    initControls(scene){
        scene.game.canvas.addEventListener('mousedown', () => {
            scene.game.input.mouse.requestPointerLock();
        });

        this.moveKeys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Enables movement of player with WASD keys
        scene.input.keyboard.on('keydown', event => {
            if (this.moveKeys['up'].isDown && !this.moveKeys['down'].isDown) { this.setVelocityY(-PLAYER_SPEED); }
            if (this.moveKeys['down'].isDown && !this.moveKeys['up'].isDown) { this.setVelocityY(PLAYER_SPEED); }
            if (this.moveKeys['left'].isDown && !this.moveKeys['right'].isDown) { this.setVelocityX(-PLAYER_SPEED); }
            if (this.moveKeys['right'].isDown && !this.moveKeys['left'].isDown) { this.setVelocityX(PLAYER_SPEED); }
        });
        scene.input.keyboard.on('keyup', event => {
            if (this.moveKeys['up'].isUp && this.moveKeys['down'].isUp) { this.setVelocityY(0); }
            if (this.moveKeys['down'].isUp && this.moveKeys['up'].isUp) { this.setVelocityY(0); }
            if (this.moveKeys['left'].isUp && this.moveKeys['right'].isUp) { this.setVelocityX(0); }
            if (this.moveKeys['right'].isUp && this.moveKeys['left'].isUp) { this.setVelocityX(0); }
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
    shoot(pistolIndex = 1){
        this.canShoot = false
        // пока без отдачи+
        // knockback(player,150,player.rotation);

        this.scene.cameras.main.shake(this.currentWeapon.shakeDuration,this.currentWeapon.shakeIntensity,true);

        let muzzleX = this.currentWeapon["offsetX" + pistolIndex] * Math.cos(this.rotation) - this.currentWeapon["offsetY" + pistolIndex] * Math.sin(this.rotation),
            muzzleY = this.currentWeapon["offsetX" + pistolIndex] * Math.sin(this.rotation) + this.currentWeapon["offsetY" + pistolIndex] * Math.cos(this.rotation)
        this.muzzleFire.setPosition(this.x + muzzleX,this.y + muzzleY)
        this.muzzleFire.rotation = this.rotation
        this.muzzleFire.setVisible(true)

        this.scene.time.addEvent({
            delay:this.currentWeapon.shootDelay,
            callback:()=>{
                this.canShoot = true

                if(pistolIndex === 1){
                    this.shoot(2)
                }
            },
        })
        this.scene.time.addEvent({
            delay:25,
            callback:()=>{
                this.muzzleFire.setVisible(false)
            },
        })

        // player.reticleSpread += 1;
        // new Bullet(game, player.x, player.y, 'atlas', 'bullet0001', 1, player, 400, 0);
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
            this.shoot()
        }
    }
}
import { Scene, GameObjects } from 'phaser';
import {UI_COLOR_RED_CSS, UI_COLOR_SILVER, UI_DEPTH, UI_MARGIN} from "../constants";
import {Player} from "../classes/Player";

export class UI extends Scene {

    player : Player
    bloodSmear : GameObjects.Image
    weaponIcon : GameObjects.Sprite
    weaponAmmoUIText : GameObjects.Text
    weaponNameUIText : GameObjects.Text
    staminaBar : GameObjects.Rectangle

    constructor ()
    {
        super("UI");
    }
    init(data){
        this.player = data.player
    }
    create ()
    {
        // blood image on the screen
        this.bloodSmear = this.add.image(
            this.game.custom.gameCenterX,
            this.game.custom.gameCenterY,
            "blood_smear"
        )
        let bloodSmearScale = this.game.config.canvas.width / this.bloodSmear.width
        this.bloodSmear.setScale(bloodSmearScale).setAlpha(0)

        this.createWeaponUI()

        // player stats ui
        this.staminaBar = this.add.rectangle(
            UI_MARGIN,
            this.game.config.canvas.height - UI_MARGIN * 2,
            Math.ceil(200 * (this.player.stamina / 100)),
            20,
            UI_COLOR_SILVER
        ).setScrollFactor(0).setDepth(UI_DEPTH).setOrigin(0,0)

        // update player UI
        this.game.events.on("updatePlayerStat",(statData)=>{
            this.handlePlayerStatChange(statData)
        })
        this.game.events.on("updatePlayerWeaponUI",()=>{
            this.updateWeaponUI()
        })
    }
    updateStatsUI(){
        this.staminaBar.width = Math.ceil(200 * (this.player.stamina / 100))
    }
    createWeaponUI(){
        this.weaponIcon = this.add.sprite(
            this.game.config.canvas.width - UI_MARGIN,
            this.game.config.canvas.height - 60,
            "weapons_icons",
            this.player.currentWeapon.iconIndex
        ).setOrigin(1,1).setScale(.5).setScrollFactor(0).setDepth(UI_DEPTH)

        this.weaponAmmoUIText = this.add.text(
            this.weaponIcon.getBottomCenter().x,
            this.game.config.canvas.height - UI_MARGIN * 2,
            this.getAmmoUIText(),
            {fontSize:28,color:UI_COLOR_RED_CSS,fontFamily:"Arial, sans-serif"}
        ).setOrigin(.5,1).setScrollFactor(0).setDepth(UI_DEPTH)

        this.weaponNameUIText = this.add.text(
            this.weaponAmmoUIText.getBottomRight().x,
            this.game.config.canvas.height - 15,
            this.player.currentWeapon.name,
            {fontSize:24,color:UI_COLOR_RED_CSS,fontFamily:"Arial, sans-serif"}
        ).setOrigin(1,1).setScrollFactor(0).setDepth(UI_DEPTH)
    }
    updateWeaponUI() : void {
        this.weaponAmmoUIText.setText(this.getAmmoUIText())
        this.weaponNameUIText.setText(this.player.currentWeapon.name)
        this.weaponIcon.setFrame(this.player.currentWeapon.iconIndex)
    }
    getAmmoUIText() : string {
        if(this.player.currentWeapon.type === "weapon"){
            let holder2Text = this.player.currentWeapon.double ? "-" + this.player.currentWeapon.holder2 : ""
            return this.player.currentWeapon.holder1 + holder2Text + "/" + this.player.ammo[this.player.currentWeapon.ammoType]
        }
        if(this.player.currentWeapon.type === "grenade"){
            return this.player.ammo[this.player.currentWeapon.ammoType]
        }
    }
    handlePlayerStatChange(statData) : void {
        if(statData.statName === "health"){
            if(statData.statValue >= 100){
                this.bloodSmear.setAlpha(0)
            } else if(statData.statValue <= 0){
                this.bloodSmear.setAlpha(1)
            } else {
                let alpha = 1 - statData.statValue / 100
                this.bloodSmear.setAlpha(alpha)
            }
        }
    }
    update(){
        this.updateStatsUI()
    }
}
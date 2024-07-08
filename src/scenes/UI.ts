import { Scene, GameObjects } from 'phaser';

export class UI extends Scene {

    bloodSmear : GameObjects.Image

    constructor ()
    {
        super("UI");
    }
    create ()
    {
        this.bloodSmear = this.add.image(
            this.game.custom.gameCenterX,
            this.game.custom.gameCenterY,
            "blood_smear"
        )
        let bloodSmearScale = this.game.config.canvas.width / this.bloodSmear.width
        this.bloodSmear.setScale(bloodSmearScale).setAlpha(0)

        this.game.events.on("updatePlayerStat",(statData)=>{
            this.handlePlayerStatChange(statData)
        })
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
    setBloodVisibility(){

    }
}
export class BloodDrop extends Phaser.GameObjects.Ellipse{
    constructor(character) {
        let radius = Phaser.Math.Between(5,10)
        super(
            character.scene,
            character.x,
            character.y,
            radius,
            radius,
            0x8E0000
        )

        this.scene.add.existing(this)
        this.init()
    }
    init(){
        let speedX = Phaser.Math.Between(-80,80),
            speedY = Phaser.Math.Between(-80,80)
        this.scene.tweens.add({
            targets: this,
            duration: 150,
            x:"+=" + speedX,
            y:"+=" + speedY,
            ease:"Power4",
            onComplete: () => {
                this.scene.time.addEvent({
                    delay:5000,
                    callback:()=>{
                        this.destroy()
                    },
                })
            },
        });
    }
}
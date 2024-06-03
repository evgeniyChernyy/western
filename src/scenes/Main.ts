import { Scene, GameObjects, Tilemaps } from 'phaser';
import {PLAYER_DEPTH} from "../constants";
import {Player} from "../classes/Player";

export class Main extends Scene
{
    map : Tilemaps.Tilemap
    grass : GameObjects.TileSprite
    treesLayer : Tilemaps.ObjectLayer
    charactersLayer : Tilemaps.ObjectLayer
    player : GameObjects.Image

    constructor ()
    {
        super('Main');
    }

    preload(){
        this.load.tilemapTiledJSON('level1', 'map/level1.json');
    }
    create ()
    {
        this.map = this.make.tilemap({ key: 'level1' })
        this.matter.world.setBounds(0,0,this.map.widthInPixels, this.map.heightInPixels)

        this.grass = this.add.tileSprite(
            0,
            0,
            this.game.config.canvas.width,
            this.game.config.canvas.height,
            "background_grass"
            ).setOrigin(0,0).setScrollFactor(0)

        // objects
        this.treesLayer = this.map.getObjectLayer("trees");
        this.addTrees()

       // player
        this.charactersLayer = this.map.getObjectLayer("characters")
        this.addCharacters()

        // camera
        this.cameras.main.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels)
        this.cameras.main.startFollow(this.player)

        // collisions
        // bullet and world bounds
        this.matter.world.on('collisionstart', (event, bodyA, bodyB) =>
        {
            if(bodyA.isStatic && bodyB.label === "bullet" ||
                bodyB.isStatic && bodyA.label === "bullet"){
                bodyA.gameObject?.deactivate?.()
                bodyB.gameObject?.deactivate?.()
            }
        });
    }
    addTrees(){
        this.treesLayer.objects.forEach((object) => {
            if (object.name === "palm") {
                let shadow = this.add.image(object.x,object.y,"palm_shadow").setOrigin(1,0).setDepth(PLAYER_DEPTH - 1),
                    tree = this.matter.add.image(object.x,object.y, 'palm',null,{
                    shape:{
                        type: 'circle',
                        radius: 20
                    },
                    isStatic:true,
                    label:"tree"
                }).setDepth(PLAYER_DEPTH + 1)
                if(Phaser.Math.Between(0,1)){
                    let config = {
                        targets:[tree,shadow],
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        x:"+=10",
                        y:"+=10",
                        duration:Phaser.Math.Between(4000,8000)
                    }
                    this.tweens.add(config)
                }
            }
        })
    }
    addCharacters(){
        this.charactersLayer.objects.forEach((object) => {
            if (object.name === "player") {
                this.player = new Player({
                    x:object.x,
                    y:object.y,
                    scene:this
                })
            }
        })
    }
    update(time,delta){
        this.grass.tilePositionX = this.cameras.main.scrollX
        this.grass.tilePositionY = this.cameras.main.scrollY

        this.player.update()
    }
}
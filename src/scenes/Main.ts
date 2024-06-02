import { Scene, GameObjects, Tilemaps } from 'phaser';
import {PLAYER_DEPTH} from "../constants";

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
        this.matter.world.setBounds(this.map.widthInPixels, this.map.heightInPixels)

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
    }
    addTrees(){
        this.treesLayer.objects.forEach((object) => {
            if (object.name === "palm") {
                this.add.image(object.x,object.y,"palm_shadow").setOrigin(1,0).setDepth(PLAYER_DEPTH - 1)
                this.matter.add.image(object.x,object.y, 'palm',null,{
                    shape:{
                        type: 'circle',
                        radius: 20
                    }
                }).setDepth(PLAYER_DEPTH + 1)
            }
        })
    }
    addCharacters(){
        this.charactersLayer.objects.forEach((object) => {
            if (object.name === "player") {
                this.player = this.add.image(object.x,object.y,"player").setScale(.5,.5)
            }
        })
    }
    update(){
        this.grass.tilePositionX = this.cameras.main.scrollX
        this.grass.tilePositionY = this.cameras.main.scrollY
    }
}

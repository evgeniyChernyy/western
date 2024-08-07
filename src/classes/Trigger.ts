import {Physics, Scene} from "phaser";
import utils from "../utils";

export class Trigger{

    rectangle : Phaser.Matter.Rectanle
    properties : Array<Object>
    characterLabel : string

    constructor(scene : Scene, triggerObject : Object) {
        this.rectangle = scene.matter.add.rectangle(
            triggerObject.x,
            triggerObject.y,
            triggerObject.width,
            triggerObject.height,
            {
                label: triggerObject.name,
                isSensor:true,
            }
        )
        this.properties = triggerObject.properties

        let characterLabel = utils.getDataByLabel("character",triggerObject.properties)
        if(characterLabel){
            this.characterLabel = characterLabel
        }

        // backlink
        this.rectangle.trigger = this
    }
}
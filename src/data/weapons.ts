let weapons = {
    singlePistol:{
        type:"weapon",
        name:"singlePistol",
        shootDelay:300,
        shakeDuration:25,
        shakeIntensity:0.01,
        offsetX1:50,
        offsetY1:20,
        bulletLifespan:500,
        bulletSpeed:25,
        spriteIndex:0,
        ammo:28,
        holder1:6,
    },
    pistols:{
        type:"weapon",
        name:"pistols",
        double:true,
        twoHanded:true,
        shootDelay:300,
        shakeDuration:25,
        shakeIntensity:0.01,
        offsetX1:50,
        offsetY1:20,
        offsetX2:50,
        offsetY2:-20,
        bulletLifespan:500,
        bulletSpeed:25,
        spriteIndex:1,
        ammo:28,
        holder1:6,
        holder2:6
    }
}

export {weapons}
let weapons = [
    {
        type:"weapon",
        label:"singlePistol",
        name:"Colt Peacemaker 1873",
        shootDelay:300,
        shakeDuration:25,
        shakeIntensity:0.01,
        offsetX1:52,
        offsetY1:20,
        bulletLifespan:500,
        bulletSpeed:25,
        reloadTime:3000,
        spriteIndex:0,
        ammoType:".44",
        holderQuantity:6,
        holder1:6,
    },
    {
        type:"weapon",
        label:"pistols",
        name:"Dual Colts",
        double:true,
        twoHanded:true,
        shootDelay:300,
        shakeDuration:25,
        shakeIntensity:0.01,
        offsetX1:50,
        offsetY1:20,
        offsetX2:50,
        offsetY2:-18,
        bulletLifespan:500,
        bulletSpeed:25,
        reloadTime:7000,
        spriteIndex:1,
        ammoType:".44",
        holderQuantity:6,
        holder1:6,
        holder2:6,
    },
    {
        type:"weapon",
        label:"rifle",
        name:"Winchester 1873",
        twoHanded:true,
        shootDelay:800,
        shakeDuration:40,
        shakeIntensity:0.02,
        offsetX1:65,
        offsetY1:10,
        bulletLifespan:1000,
        bulletSpeed:40,
        reloadTime:4000,
        spriteIndex:2,
        ammoType:".44",
        holderQuantity:12,
        holder1:12,
    }
],
    ammo = {
    ".44":80,
    }

export {weapons,ammo}
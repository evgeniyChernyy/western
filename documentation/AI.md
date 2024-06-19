## AI

Basic AI for NPCs and enemies.

####Properties:

playerRelation {number}

the relationship of this NPC to the player, from 0 to 100. If it is equal or lower than NPC_AGGRESSION_LEVEL, NPC will attack player. It can be obtained from Tiled object properties or from NPC_BASIC_PLAYER_RELATION.

detectionInterval {number}

event interval during which the NPC checks the distance to the player. It can be obtained from Tiled object properties or from NPC_DETECTION_INTERVAL 
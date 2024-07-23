import draggable from 'vuedraggable'

let TraderUI = {
    components:{
        draggable
    },
    data() {
        return {
            open:false,
            playerInventory:[],
            playerMoney:0,
            sellerInventory:[{
                name:"whiskey",
                quantity:2,
            },{
                name:"meat",
                quantity:3,
            }],
            sellerMoney:24.2,
            sales:[],
            purchases:[],
            salesTotal:0,
            purchasesTotal:0,
            draggedElement:{},
            rangeSceneActive:false,
            rangeMax:0,
            quantityValue:1
        }
    },
    methods:{
        start(playerInventory : Array<Object>, playerMoney : number) : void {
            this.playerInventory = playerInventory
            this.playerMoney = playerMoney

            this.open = true
        },
        handleDragEnd(event){
            if(event.from.dataset.list === event.to.dataset.list) return

            this.draggedElement["from"] = event.from.dataset.list
            this.draggedElement["oldIndex"] = event.oldDraggableIndex
            this.draggedElement["newIndex"] = event.newDraggableIndex
            this.draggedElement["item"] = Object.assign({},event.item._underlying_vm_)
            this.draggedElement["to"] = event.to.dataset.list

            this.rangeMax = this.draggedElement["item"].quantity
            this.quantityValue = 1

            this.rangeSceneActive = true
        },
        cancelMoving(){
            // remove from new list
            let toKey = this.draggedElement["to"]

            this[toKey].splice(
                this.draggedElement["newIndex"],
                1
            )

            this.rangeSceneActive = false
        },
        applyMoving(){
            let fromKey = this.draggedElement["from"],
                toKey = this.draggedElement["to"]

            // move all items
            if(Number(this.quantityValue) === this.rangeMax){
                this[fromKey].splice(
                    this.draggedElement["oldIndex"],
                    1
                )
            } else {
                this[fromKey][ this.draggedElement["oldIndex"] ].quantity -= this.quantityValue
                this[toKey][this.draggedElement["newIndex"]].quantity = this.quantityValue
            }
            this.removeDuplicatesInList(toKey)

            this.rangeSceneActive = false
        },
        removeDuplicatesInList(listKey : string){
            for(let i = 0; i < this[listKey].length; i++){
                if(this[listKey][i].name === this.draggedElement["item"].name &&
                i !== this.draggedElement["newIndex"]){
                    this[listKey][i].quantity = Number(this[listKey][i].quantity) + Number(this.quantityValue)

                    this[listKey].splice(
                        this.draggedElement["newIndex"],
                        1
                    )
                    break
                }
            }
        },
        cloneItem(item : Object){
            return {
                name:item.name,
                quantity:item.quantity
            }
        }
    },
    template:`
            <div class="dialoger-overlay" :class="{active:open}"></div>
            <div class="trader-ui" :class="{active:open}">
                <div class="trader-ui__inner-container">
                    <div class="trader-ui__player-inventory-container">
                        <p class="trader-ui__money-label">MONEY: {{ playerMoney }}</p>
                        <draggable
                                class="trader-ui__items-list"
                                data-list="playerInventory"
                                :group="{ name: 'sales', pull: 'clone', put: true }"
                                :clone="cloneItem"
                                v-model="playerInventory"
                                @end="handleDragEnd"
                                :sort="false"
                                item-key="id">
                            <template #item="{element}">
                                <div class="trader-ui__item">
                                    <img :src="'goods/' + element.name + '.png'" alt=""
                                         class="trader-ui__item-icon"
                                    >
                                    <span class="trader-ui__item-quantity">{{element.quantity}}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>
                    <div class="trader-ui__sales-container">
                        <p class="trader-ui__money-label">FOR SALE: {{ salesTotal }}</p>
                        <draggable
                                class="trader-ui__items-list"
                                data-list="sales"
                                :group="{ name: 'sales', pull: 'clone', put: true }"
                                :clone="cloneItem"
                                v-model="sales"
                                @end="handleDragEnd"
                                :sort="false"
                                item-key="id">
                            <template #item="{element}">
                                <div class="trader-ui__item">
                                    <img :src="'goods/' + element.name + '.png'" alt=""
                                         class="trader-ui__item-icon"
                                    >
                                    <span class="trader-ui__item-quantity">{{element.quantity}}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>
                    <div class="trader-ui__buying-container">
                        <p class="trader-ui__money-label">BUY: {{ purchasesTotal }}</p>
                        <draggable
                                class="trader-ui__items-list"
                                data-list="purchases"
                                v-model="purchases"
                                group="purchases"
                                @start="drag=true"
                                @end="drag=false"
                                :sort="false"
                                item-key="id">
                            <template #item="{element}">
                                <div class="trader-ui__item">
                                    <img :src="'goods/' + element.name + '.png'" alt=""
                                         class="trader-ui__item-icon"
                                    >
                                    <span class="trader-ui__item-quantity">{{element.quantity}}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>
                    <div class="trader-ui__seller-inventory-container">
                        <p class="trader-ui__money-label">MONEY: {{ sellerMoney }}</p>
                        <draggable
                                class="trader-ui__items-list"
                                data-list="sellerInventory"
                                v-model="sellerInventory"
                                group="purchases"
                                @start="drag=true"
                                @end="drag=false"
                                :sort="false"
                                item-key="id">
                            <template #item="{element}">
                                <div class="trader-ui__item">
                                    <img :src="'goods/' + element.name + '.png'" alt=""
                                    class="trader-ui__item-icon"
                                    >
                                    <span class="trader-ui__item-quantity">{{element.quantity}}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>
            </div>
            <div class="trader-ui__quantity-assistant" :class="{active:rangeSceneActive}">
                <div class="trader-ui__quantity-assistant-top">
                    <span class="trader-ui__quantity-min">1</span>
                    <input type="range" ref="quantityRange" min="1" :max="rangeMax" v-model="quantityValue">
                    <span class="trader-ui__quantity-max">{{ rangeMax }}</span>
                    <span class="trader-ui__quantity-current">{{ quantityValue }}</span>
                </div>
                <div class="trader-ui__quantity-assistant-bottom">
                    <button class="trader-ui__quantity-assistant-button" @click="cancelMoving">Cancel</button>
                    <button class="trader-ui__quantity-assistant-button" @click="applyMoving">Ok</button>
                </div>
            </div>
            `
}
export default TraderUI
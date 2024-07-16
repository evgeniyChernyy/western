let DialogerUI = {
    props:{
        gameState:{type:Object},
        dialogsVariables:{type:Object}
    },
    data() {
        return {
            dialog: null,
            open:false,
            currentDialogText:"",
            currentDialogOptions:[],
        }
    },
    methods:{
        start(dialog : Object) : void {
            this.dialog = dialog

            this.toggleCurrentDialog("welcome")

            this.open = true
        },
        toggleCurrentDialog(dialogLabel : string) : void {
            this.currentDialogText = this.replaceVariables(this.dialog[dialogLabel]["text"])
            this.currentDialogOptions = this.checkOptionsCondition(this.dialog[dialogLabel]["options"])
        },
        checkOptionsCondition(options : Array<Object>) : Array<Object> {
          options.forEach(option => {
              if(option.condition && !this.gameState[option.condition]){
                  option.hidden = true
              }
          })
            return options
        },
        replaceVariables(phrase : string) : string {
            phrase = phrase.replace(/%\w+%/g, (variableCode)=>{
                return this.dialogsVariables[variableCode]
            })
            return phrase
        },
        closeDialog() : void {
            this.open = false

            document.dispatchEvent(new CustomEvent("CloseDialog"))
        }
    },
    template:`
            <div class="dialoger-overlay" :class="{active:open}"></div>
            <div class="dialoger-ui" :class="{active:open}">
                <div class="dialoger-ui__container" v-if="dialog">
                    <div class="dialoger-ui__top">
                        <p class="dialoger-ui__charname">Erick</p>
                        <p class="dialoger-ui__phrase">{{ currentDialogText }}</p>
                    </div>
                    <div class="dialoger-ui__bottom">
                        <div class="dialoger-ui__options-container">
                            <p class="dialoger-ui__option" 
                               v-for="option in currentDialogOptions"
                                v-show="!option.hidden"
                               @click="toggleCurrentDialog(option.next)"
                            >
                                {{ option.text }}</p>
                        </div>
                        <div class="dialoger-ui__actions-container">
                            <button class="dialoger-ui__action-btn" @click="closeDialog">Exit</button>
                        </div>
                    </div>
                </div>
            </div>
            `
}
export default DialogerUI
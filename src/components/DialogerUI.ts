let DialogerUI = {
    props:{
        gameState:{type:Object},
        dialogsVariables:{type:Object}
    },
    data() {
        return {
            dialog: null,
            open:false,
            characterName:"",
            currentDialogText:"",
            currentDialogOptions:[],
        }
    },
    methods:{
        start(dialog : Object) : void {
            this.dialog = dialog
            this.characterName = dialog["name"]

            this.toggleCurrentDialog("welcome")

            // set avatar
            let avatarElement = this.$refs.avatar,
                frameWidth = parseInt(getComputedStyle(avatarElement).width),
                avatarFrame = dialog["avatarFrame"]
            avatarElement.style.backgroundPosition = (frameWidth * avatarFrame) + "px 0"

            this.open = true
        },
        handleOptionApply(option : Object) : void {
            if(option.makeTrue){
                this.gameState[option.makeTrue] = true
            }
            this.toggleCurrentDialog(option.next)
        },
        toggleCurrentDialog(dialogLabel : string) : void {
            this.currentDialogText = this.replaceVariables(this.dialog[dialogLabel]["text"])
            this.currentDialogOptions = this.prepareOptions(this.dialog[dialogLabel]["options"])
        },
        prepareOptions(options : Array<Object>) : Array<Object> {
            options.forEach(option => {
                if(option.condition && !this.gameState[option.condition]){
                    option.hidden = true
                    return
                }

                option.text = this.replaceVariables(option.text)
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
                <div class="dialoger-ui__container">
                    <div class="dialoger-ui__top">
                        <div class="dialoger-ui__avatar" ref="avatar"></div>
                        <p class="dialoger-ui__charname">{{ characterName }}</p>
                        <p class="dialoger-ui__phrase">{{ currentDialogText }}</p>
                    </div>
                    <div class="dialoger-ui__bottom">
                        <div class="dialoger-ui__options-container">
                            <p class="dialoger-ui__option" 
                               v-for="option in currentDialogOptions"
                                v-show="!option.hidden"
                               @click="handleOptionApply(option)"
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
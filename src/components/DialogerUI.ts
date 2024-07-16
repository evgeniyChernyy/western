let DialogerUI = {
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
            this.currentDialogText = this.dialog[dialogLabel]["text"]
            this.currentDialogOptions = this.dialog[dialogLabel]["options"]
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
                            <p class="dialoger-ui__option" v-for="option in currentDialogOptions"
                            @click="toggleCurrentDialog(option.next)"
                            >
                                {{ option.text }}</p>
                        </div>
                    </div>
                </div>
            </div>
            `
}
export default DialogerUI
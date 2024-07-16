export default {
    deepCopy(data){
        return JSON.parse(JSON.stringify(data))
    },
    getDataByLabel(label : string, data : Array<Object>) : undefined | number | string {
        return data.find((el) => el.name === label )?.value
    }
}
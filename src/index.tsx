/// <reference types="types-for-adobe/AfterEffects/22.0"/>
const SCRIPT_NAME = "Tile Utils"

class SplitSlider {
    defaultNum = 2
    defaultMinNum = 1
    defaultMaxNum = 10
    txtBounds = [0,0,20,20]
    val: number = this.defaultNum
    constructor(panel:Panel, title: string) {

        //colコントロール
        panel.add("statictext", undefined, title)
        const colGroup = panel.add("group", undefined)
        colGroup.orientation = "row"
        const colVal = colGroup.add("statictext", this.txtBounds as Bounds, `${this.defaultNum}`)
        const colSlider = colGroup.add("slider", undefined, this.defaultNum, this.defaultMinNum, this.defaultMaxNum)
        colSlider.onChanging = () => {
            colVal.text = `${Math.round(colSlider.value)}`
        }
        colSlider.onChange = () => {
            this.val = Math.round(colSlider.value)
            colSlider.value = this.val
        }
    }
}


const getActiveItem = (proj: Project): CompItem => {
    const activeItem = proj.activeItem
    if(activeItem == null || !(activeItem instanceof CompItem)){
        return undefined
    }
    return activeItem
}

const TileComps = (proj: Project, x_num: number, y_num: number) => {
    const activeItem = getActiveItem(proj)
    if(!activeItem) {
        alert("コンポジションを選択してください")
        return false
    }
    
    app.beginUndoGroup(SCRIPT_NAME)

    const { height:h , width:w } = activeItem
    const tileComp = proj.items.addComp(
        "Tile", w*x_num, h*y_num,
        activeItem.pixelAspect,
        activeItem.duration,
        activeItem.frameRate
        )
    const layers = tileComp.layers
    
    for (let i = 0; i < x_num*y_num; i++){
        let x = i % x_num
        let y = Math.floor(i / x_num)

        let item = activeItem.duplicate()
        let layer = layers.add(item)
        let anchorPos: TwoDPoint = layer.anchorPoint.value as TwoDPoint

        let pos = layer.position as TwoDProperty
        pos.setValue([
            x * w + anchorPos[0],
            y * h + anchorPos[1]
        ])
    }

    app.endUndoGroup()
    return true
}

const makeWindow = (proj: Project) => {
    const window = new Window("palette", "タイル化スクリプト")

    const panel = window.add("panel", undefined, "入力")

    //分割数コントロール
    const colSlider = new SplitSlider(panel, "列数")
    const rowSlider = new SplitSlider(panel, "行数")

    const createBtn = panel.add("button", undefined, "作成")
    createBtn.onClick = () => {
        if (TileComps(proj, colSlider.val, rowSlider.val)){
            alert("タイル化完了")
            window.close()
        }
    }

    return window
}

//サイズコントロール
//TODO: 作成

const OpenTileUtils = () => {
    //メイン
    const proj = app.project
    if(proj === null){
        alert("プロジェクトが開いていません", SCRIPT_NAME)
        return
    }

    const window = makeWindow(proj)
    window.show()
}
OpenTileUtils()

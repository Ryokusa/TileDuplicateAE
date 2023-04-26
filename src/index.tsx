/// <reference types="types-for-adobe/AfterEffects/22.0"/>
const SCRIPT_NAME = "Tile Utils"

class SplitSlider {
    defaultNum = 2
    defaultMinNum = 1
    defaultMaxNum = 10
    txtBounds = [0,0,20,20]
    val: number = this.defaultNum
    constructor(panel:Panel, title: string) {
        panel.add("statictext", undefined, title)
        const group = panel.add("group", undefined)
        group.orientation = "row"
        const valTxt = group.add("statictext", this.txtBounds as Bounds, `${this.defaultNum}`)
        const slider = group.add("slider", undefined, this.defaultNum, this.defaultMinNum, this.defaultMaxNum)
        slider.onChanging = () => {
            valTxt.text = `${Math.round(slider.value)}`
        }
        slider.onChange = () => {
            this.val = Math.round(slider.value)
            slider.value = this.val
        }
    }
}

class NumEdit {
    val = 0
    textBounds = [0,0,80,20]
    MIN = 10
    MAX = 10000

    constructor(panel: Panel, title: string, val: number) {
        const group = panel.add("group")
        group.orientation = "row"
        group.add("statictext", undefined, title)

        this.val = val
        const valTxt = group.add("edittext", this.textBounds as Bounds, `${val}`)
        valTxt.onChange = () => {
            this.val = parseInt(valTxt.text)
            if(isNaN(this.val)){
                alert("数字ではありません")
                this.val = 0
            }else if(this.val < this.MIN || this.val > this.MAX){
                alert(`入力値が有効値域ではありません(${this.MIN} < [${title}] < ${this.MAX})`)
                this.val = (this.val < this.MIN) ? this.MIN : this.MAX
            }

            valTxt.text = `${this.val}`
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

const makeTileComps = (proj: Project, x_num: number, y_num: number) => {
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
    
    const widthEdit = new NumEdit(panel, "横幅", 1920)
    const heightEdit = new NumEdit(panel, "縦幅", 1080)

    const createBtn = panel.add("button", undefined, "作成")
    createBtn.onClick = () => {
        if (makeTileComps(proj, colSlider.val, rowSlider.val)){
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

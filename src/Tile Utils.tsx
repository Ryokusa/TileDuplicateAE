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
    private _group: Group
    private _enable: boolean

    constructor(panel: Panel, title: string, val: number) {
        this._group = panel.add("group")
        this._group.orientation = "row"
        this._group.add("statictext", undefined, title)
        this._group.enabled = false

        this.val = val
        const valTxt = this._group.add("edittext", this.textBounds as Bounds, `${val}`)
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

    setEnabled(enabled: boolean){
        this._group.enabled = enabled
    }
}


const getActiveItem = (proj: Project): CompItem => {
    const activeItem = proj.activeItem
    if(activeItem == null || !(activeItem instanceof CompItem)){
        return undefined
    }
    return activeItem
}

const getActiveLayer = (item: CompItem): AVLayer => {
    if (item.selectedLayers.length !== 1) return undefined
    const activeLayer = item.selectedLayers[0]
    if(activeLayer === null || !(activeLayer instanceof AVLayer)){
        return undefined
    }
    return activeLayer
}

const makeTileComps = (proj: Project, x_num: number, y_num: number, width: number = -1, height: number = -1) => {
    const activeItem = getActiveItem(proj)
    if(!activeItem) {
        alert("コンポジションを選択してください")
        return false
    }
    
    app.beginUndoGroup(SCRIPT_NAME)

    const { height:h , width:w } = activeItem
    if (width === -1) {
        width = w*x_num
        height = h*y_num
    }
    const tileComp = proj.items.addComp(
        "Tile", width, height,
        activeItem.pixelAspect,
        activeItem.duration,
        activeItem.frameRate
        )
    const layers = tileComp.layers

    const dw = width / x_num
    const dh = height / y_num
    
    for (let i = 0; i < x_num*y_num; i++){
        let x = i % x_num
        let y = Math.floor(i / x_num)

        let item = activeItem.duplicate()
        let layer = layers.add(item)
        let multi = ( dw * y_num > height) ? dh/h : dw/w
        let scale = layer.scale as TwoDProperty
        scale.setValue([
            multi*100,
            multi*100
        ])

        let pos = layer.position as TwoDProperty
        pos.setValue([
            x * dw + dw/2,
            y * dh + dh/2
        ])
    }

    app.endUndoGroup()
    return true
}

const makeTileLayers = (proj: Project, x_num: number, y_num: number, width: number = -1, height: number = -1) => {
    const activeItem = getActiveItem(proj)
    if(!activeItem) {
        alert("コンポジションを一つ選択してください")
        return false
    }
    
    const activeLayer = getActiveLayer(activeItem)
    if(!activeLayer){
        alert("AVレイヤーを一つ選択してください")
        return false
    }


    app.beginUndoGroup(SCRIPT_NAME)

    const h = activeLayer.height
    const w = activeLayer.width
    if(width === -1){
        width = w * x_num
        height = h * y_num
    }
    activeItem.width = width
    activeItem.height = height

    const dw = width / x_num
    const dh = height / y_num

    const pos = activeLayer.position as TwoDProperty
    pos.setValue([dw/2, dh/2])

    for (var i = 1; i < x_num*y_num; i++){
        const x = i % x_num
        const y = Math.floor(i / x_num)

        const layer = activeLayer.duplicate()

        const multi = ( dw * y_num > height) ? dh/h : dw/w
        const scale = layer.scale as TwoDProperty
        scale.setValue([
            multi*100,
            multi*100
        ])

        const pos = layer.position as TwoDProperty
        pos.setValue([
            x * w + dw/2,
            y * h + dh/2
        ])
    }

    app.endUndoGroup()
}

const makeWindow = (proj: Project) => {
    const window = new Window("palette", "タイル化スクリプト")

    const panel = window.add("panel", undefined, "入力")

    //分割数コントロール
    const colSlider = new SplitSlider(panel, "列数")
    const rowSlider = new SplitSlider(panel, "行数")

    const checkbox = panel.add("checkbox", undefined, "サイズ指定")
    const widthEdit = new NumEdit(panel, "横幅", 1920)
    const heightEdit = new NumEdit(panel, "縦幅", 1080)
    checkbox.onClick = () => {
        widthEdit.setEnabled(checkbox.value)
        heightEdit.setEnabled(checkbox.value)
    }

    const radioGroup = window.add("group")
    radioGroup.orientation = "row"
    const compRadio = radioGroup.add("radiobutton", undefined, "Comp")
    radioGroup.add("radiobutton", undefined, "Layer")
    compRadio.value = true

    const createBtn = window.add("button", undefined, "作成")
    createBtn.onClick = () => {
        const col = colSlider.val
        const row = rowSlider.val
        const w = (checkbox.value) ? widthEdit.val : -1
        const h = (checkbox.value) ? heightEdit.val : -1
        const result = (compRadio.value) ? makeTileComps(proj, col, row, w, h) : makeTileLayers(proj, col, row, w, h)

        if (result){
            alert("タイル化完了")
            window.close()
        }
    }

    return window
}

//メイン
const OpenTileUtils = () => {
    const proj = app.project
    if(proj === null){
        alert("プロジェクトが開いていません", SCRIPT_NAME)
        return
    }

    const window = makeWindow(proj)
    window.show()
}
OpenTileUtils()

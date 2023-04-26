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

class Tile{
    readonly width: number
    readonly height: number
    readonly colNum: number
    readonly rowNum: number
    readonly dw: number
    readonly dh: number
    readonly scale: number
    
    constructor(width: number, height: number, colNum: number, rowNum: number){
        this.width = width
        this.height = height
        this.colNum = colNum
        this.rowNum = rowNum

        this.dw = width / colNum
        this.dh = height / rowNum
    }

    getPos (col:number, row:number) {
        return { 
            x: col*this.dw,
            y: row*this.dh 
        }
    }

    // 入力サイズとタイル一つのサイズ比率計算
    calcScale(width: number, height: number){
        return {
            x: this.dw / width,
            y: this.dh / height
        }
    }
}

const makeTileLayer = (tile: Tile, layer: AVLayer, col: number, row: number) => {
    const tileScale = tile.calcScale(layer.width, layer.height)
    const multi = (tileScale.x > tileScale.y) ? tileScale.y*100 : tileScale.x*100

    let layerScale = layer.scale as TwoDProperty
    layerScale.setValue([
        multi,
        multi
    ])

    const pos = tile.getPos(col, row)
    let layerPos = layer.position as TwoDProperty
    layerPos.setValue([
        pos.x + tile.dw/2,
        pos.y + tile.dh/2
    ])

    return layer
}

const makeTileComps = (proj: Project, colNum: number, rowNum: number, width: number = -1, height: number = -1) => {
    const activeItem = getActiveItem(proj)
    if(!activeItem) {
        alert("コンポジションを選択してください")
        return false
    }
    
    app.beginUndoGroup(SCRIPT_NAME)

    const { height:itemH , width:itemW } = activeItem
    if (width === -1) {
        width = itemW*colNum
        height = itemH*rowNum
    }
    const tileComp = proj.items.addComp(
        "Tile", width, height,
        activeItem.pixelAspect,
        activeItem.duration,
        activeItem.frameRate
        )
    const layers = tileComp.layers

    const tile = new Tile(width, height, colNum, rowNum)
    
    for (let i = 0; i < colNum*rowNum; i++){
        const col = i % colNum
        const row = Math.floor(i / colNum)

        const item = activeItem.duplicate()
        const layer = layers.add(item)

        makeTileLayer(tile, layer, col, row)
    }

    app.endUndoGroup()
    return true
}

const makeTileLayers = (proj: Project, colNum: number, rowNum: number, width: number = -1, height: number = -1) => {
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

    const layerH = activeLayer.height
    const layerW = activeLayer.width
    if(width === -1){
        width = layerW * colNum
        height = layerH * rowNum
    }
    activeItem.width = width
    activeItem.height = height

    const tile = new Tile(width, height, colNum, rowNum)

    const pos = activeLayer.position as TwoDProperty
    pos.setValue([tile.dw/2, tile.dh/2])

    for (var i = 1; i < colNum*rowNum; i++){
        const col = i % colNum
        const row = Math.floor(i / colNum)

        const layer = activeLayer.duplicate() as AVLayer

        makeTileLayer(tile, layer, col, row)
    }

    app.endUndoGroup()
}

const makeWindow = (proj: Project) => {
    const window = (this instanceof Panel) ? this as unknown as Panel : new Window("palette", SCRIPT_NAME)

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
    if(window instanceof Window){
        window.show()
    }else{
        window.layout.layout()
    }
}
OpenTileUtils()

/// <reference types="types-for-adobe/AfterEffects/22.0"/>
var SCRIPT_NAME = "Tile Utils";
var SplitSlider = /** @class */ (function () {
    function SplitSlider(panel, title) {
        var _this = this;
        this.defaultNum = 2;
        this.defaultMinNum = 1;
        this.defaultMaxNum = 10;
        this.txtBounds = [0, 0, 20, 20];
        this.val = this.defaultNum;
        panel.add("statictext", undefined, title);
        var group = panel.add("group", undefined);
        group.orientation = "row";
        var valTxt = group.add("statictext", this.txtBounds, "".concat(this.defaultNum));
        var slider = group.add("slider", undefined, this.defaultNum, this.defaultMinNum, this.defaultMaxNum);
        slider.onChanging = function () {
            valTxt.text = "".concat(Math.round(slider.value));
        };
        slider.onChange = function () {
            _this.val = Math.round(slider.value);
            slider.value = _this.val;
        };
    }
    return SplitSlider;
}());
var NumEdit = /** @class */ (function () {
    function NumEdit(panel, title, val) {
        var _this = this;
        this.val = 0;
        this.textBounds = [0, 0, 80, 20];
        this.MIN = 10;
        this.MAX = 10000;
        this._group = panel.add("group");
        this._group.orientation = "row";
        this._group.add("statictext", undefined, title);
        this._group.enabled = false;
        this.val = val;
        var valTxt = this._group.add("edittext", this.textBounds, "".concat(val));
        valTxt.onChange = function () {
            _this.val = parseInt(valTxt.text);
            if (isNaN(_this.val)) {
                alert("数字ではありません");
                _this.val = 0;
            }
            else if (_this.val < _this.MIN || _this.val > _this.MAX) {
                alert("\u5165\u529B\u5024\u304C\u6709\u52B9\u5024\u57DF\u3067\u306F\u3042\u308A\u307E\u305B\u3093(".concat(_this.MIN, " < [").concat(title, "] < ").concat(_this.MAX, ")"));
                _this.val = (_this.val < _this.MIN) ? _this.MIN : _this.MAX;
            }
            valTxt.text = "".concat(_this.val);
        };
    }
    NumEdit.prototype.setEnabled = function (enabled) {
        this._group.enabled = enabled;
    };
    return NumEdit;
}());
var getActiveItem = function (proj) {
    var activeItem = proj.activeItem;
    if (activeItem == null || !(activeItem instanceof CompItem)) {
        return undefined;
    }
    return activeItem;
};
var getActiveLayer = function (item) {
    if (item.selectedLayers.length !== 1)
        return undefined;
    var activeLayer = item.selectedLayers[0];
    if (activeLayer === null || !(activeLayer instanceof AVLayer)) {
        return undefined;
    }
    return activeLayer;
};
var Tile = /** @class */ (function () {
    function Tile(width, height, colNum, rowNum) {
        this.width = width;
        this.height = height;
        this.colNum = colNum;
        this.rowNum = rowNum;
        this.dw = width / colNum;
        this.dh = height / rowNum;
    }
    Tile.prototype.getPos = function (col, row) {
        return {
            x: col * this.dw,
            y: row * this.dh
        };
    };
    // 入力サイズとタイル一つのサイズ比率計算
    Tile.prototype.calcScale = function (width, height) {
        return {
            x: this.dw / width,
            y: this.dh / height
        };
    };
    return Tile;
}());
var makeTileLayer = function (tile, layer, col, row) {
    var tileScale = tile.calcScale(layer.width, layer.height);
    var multi = (tileScale.x > tileScale.y) ? tileScale.y * 100 : tileScale.x * 100;
    var layerScale = layer.scale;
    layerScale.setValue([
        multi,
        multi
    ]);
    var pos = tile.getPos(col, row);
    var layerPos = layer.position;
    layerPos.setValue([
        pos.x + tile.dw / 2,
        pos.y + tile.dh / 2
    ]);
    return layer;
};
var makeTileComps = function (proj, colNum, rowNum, width, height) {
    if (width === void 0) { width = -1; }
    if (height === void 0) { height = -1; }
    var activeItem = getActiveItem(proj);
    if (!activeItem) {
        alert("コンポジションを選択してください");
        return false;
    }
    app.beginUndoGroup(SCRIPT_NAME);
    var itemH = activeItem.height, itemW = activeItem.width;
    if (width === -1) {
        width = itemW * colNum;
        height = itemH * rowNum;
    }
    var tileComp = proj.items.addComp("Tile", width, height, activeItem.pixelAspect, activeItem.duration, activeItem.frameRate);
    var layers = tileComp.layers;
    var tile = new Tile(width, height, colNum, rowNum);
    for (var i = 0; i < colNum * rowNum; i++) {
        var col = i % colNum;
        var row = Math.floor(i / colNum);
        var item = activeItem.duplicate();
        var layer = layers.add(item);
        makeTileLayer(tile, layer, col, row);
    }
    app.endUndoGroup();
    return true;
};
var makeTileLayers = function (proj, colNum, rowNum, width, height) {
    if (width === void 0) { width = -1; }
    if (height === void 0) { height = -1; }
    var activeItem = getActiveItem(proj);
    if (!activeItem) {
        alert("コンポジションを一つ選択してください");
        return false;
    }
    var activeLayer = getActiveLayer(activeItem);
    if (!activeLayer) {
        alert("AVレイヤーを一つ選択してください");
        return false;
    }
    app.beginUndoGroup(SCRIPT_NAME);
    var h = activeLayer.height;
    var w = activeLayer.width;
    if (width === -1) {
        width = w * colNum;
        height = h * rowNum;
    }
    activeItem.width = width;
    activeItem.height = height;
    var tile = new Tile(width, height, colNum, rowNum);
    var pos = activeLayer.position;
    pos.setValue([tile.dw / 2, tile.dh / 2]);
    for (var i = 1; i < colNum * rowNum; i++) {
        var col = i % colNum;
        var row = Math.floor(i / colNum);
        var layer = activeLayer.duplicate();
        makeTileLayer(tile, layer, col, row);
    }
    app.endUndoGroup();
};
var makeWindow = function (proj) {
    var window = new Window("palette", SCRIPT_NAME);
    var panel = window.add("panel", undefined, "入力");
    //分割数コントロール
    var colSlider = new SplitSlider(panel, "列数");
    var rowSlider = new SplitSlider(panel, "行数");
    var checkbox = panel.add("checkbox", undefined, "サイズ指定");
    var widthEdit = new NumEdit(panel, "横幅", 1920);
    var heightEdit = new NumEdit(panel, "縦幅", 1080);
    checkbox.onClick = function () {
        widthEdit.setEnabled(checkbox.value);
        heightEdit.setEnabled(checkbox.value);
    };
    var radioGroup = window.add("group");
    radioGroup.orientation = "row";
    var compRadio = radioGroup.add("radiobutton", undefined, "Comp");
    radioGroup.add("radiobutton", undefined, "Layer");
    compRadio.value = true;
    var createBtn = window.add("button", undefined, "作成");
    createBtn.onClick = function () {
        var col = colSlider.val;
        var row = rowSlider.val;
        var w = (checkbox.value) ? widthEdit.val : -1;
        var h = (checkbox.value) ? heightEdit.val : -1;
        var result = (compRadio.value) ? makeTileComps(proj, col, row, w, h) : makeTileLayers(proj, col, row, w, h);
        if (result) {
            alert("タイル化完了");
            window.close();
        }
    };
    return window;
};
//メイン
var OpenTileUtils = function () {
    var proj = app.project;
    if (proj === null) {
        alert("プロジェクトが開いていません", SCRIPT_NAME);
        return;
    }
    var window = makeWindow(proj);
    window.show();
};
OpenTileUtils();

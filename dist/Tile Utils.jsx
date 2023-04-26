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
var makeTileComps = function (proj, x_num, y_num, width, height) {
    if (width === void 0) { width = -1; }
    if (height === void 0) { height = -1; }
    var activeItem = getActiveItem(proj);
    if (!activeItem) {
        alert("コンポジションを選択してください");
        return false;
    }
    app.beginUndoGroup(SCRIPT_NAME);
    var h = activeItem.height, w = activeItem.width;
    if (width === -1) {
        width = w * x_num;
        height = h * y_num;
    }
    var tileComp = proj.items.addComp("Tile", width, height, activeItem.pixelAspect, activeItem.duration, activeItem.frameRate);
    var layers = tileComp.layers;
    var dw = width / x_num;
    var dh = height / y_num;
    for (var i = 0; i < x_num * y_num; i++) {
        var x = i % x_num;
        var y = Math.floor(i / x_num);
        var item = activeItem.duplicate();
        var layer = layers.add(item);
        var multi = (dw * y_num > height) ? dh / h : dw / w;
        var scale = layer.scale;
        scale.setValue([
            multi * 100,
            multi * 100
        ]);
        var pos = layer.position;
        pos.setValue([
            x * dw + dw / 2,
            y * dh + dh / 2
        ]);
    }
    app.endUndoGroup();
    return true;
};
var makeTileLayers = function (proj, x_num, y_num, width, height) {
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
    //TODO: makeTileLayers
    var h = activeLayer.height;
    var w = activeLayer.width;
    if (width === -1) {
        width = w * x_num;
        height = h * y_num;
    }
    activeItem.width = width;
    activeItem.height = height;
    var dw = width / x_num;
    var dh = height / y_num;
    var pos = activeLayer.position;
    pos.setValue([dw / 2, dh / 2]);
    for (var i = 1; i < x_num * y_num; i++) {
        var x = i % x_num;
        var y = Math.floor(i / x_num);
        var layer = activeLayer.duplicate();
        var multi = (dw * y_num > height) ? dh / h : dw / w;
        var scale = layer.scale;
        scale.setValue([
            multi * 100,
            multi * 100
        ]);
        var pos_1 = layer.position;
        pos_1.setValue([
            x * w + dw / 2,
            y * h + dh / 2
        ]);
    }
    app.endUndoGroup();
};
var makeWindow = function (proj) {
    var window = new Window("palette", "タイル化スクリプト");
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

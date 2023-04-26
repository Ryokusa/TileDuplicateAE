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
        var group = panel.add("group");
        group.orientation = "row";
        group.add("statictext", undefined, title);
        this.val = val;
        var valTxt = group.add("edittext", this.textBounds, "".concat(val));
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
    return NumEdit;
}());
var getActiveItem = function (proj) {
    var activeItem = proj.activeItem;
    if (activeItem == null || !(activeItem instanceof CompItem)) {
        return undefined;
    }
    return activeItem;
};
var TileComps = function (proj, x_num, y_num) {
    var activeItem = getActiveItem(proj);
    if (!activeItem) {
        alert("コンポジションを選択してください");
        return false;
    }
    app.beginUndoGroup(SCRIPT_NAME);
    var h = activeItem.height, w = activeItem.width;
    var tileComp = proj.items.addComp("Tile", w * x_num, h * y_num, activeItem.pixelAspect, activeItem.duration, activeItem.frameRate);
    var layers = tileComp.layers;
    for (var i = 0; i < x_num * y_num; i++) {
        var x = i % x_num;
        var y = Math.floor(i / x_num);
        var item = activeItem.duplicate();
        var layer = layers.add(item);
        var anchorPos = layer.anchorPoint.value;
        var pos = layer.position;
        pos.setValue([
            x * w + anchorPos[0],
            y * h + anchorPos[1]
        ]);
    }
    app.endUndoGroup();
    return true;
};
var makeWindow = function (proj) {
    var window = new Window("palette", "タイル化スクリプト");
    var panel = window.add("panel", undefined, "入力");
    //分割数コントロール
    var colSlider = new SplitSlider(panel, "列数");
    var rowSlider = new SplitSlider(panel, "行数");
    var widthEdit = new NumEdit(panel, "横幅", 1920);
    var heightEdit = new NumEdit(panel, "縦幅", 1080);
    var createBtn = panel.add("button", undefined, "作成");
    createBtn.onClick = function () {
        if (TileComps(proj, colSlider.val, rowSlider.val)) {
            alert("タイル化完了");
            window.close();
        }
    };
    return window;
};
//サイズコントロール
//TODO: 作成
var OpenTileUtils = function () {
    //メイン
    var proj = app.project;
    if (proj === null) {
        alert("プロジェクトが開いていません", SCRIPT_NAME);
        return;
    }
    var window = makeWindow(proj);
    window.show();
};
OpenTileUtils();

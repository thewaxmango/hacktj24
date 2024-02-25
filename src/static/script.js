var width = window.innerWidth;
var height = window.innerHeight;

var stage = new Konva.Stage({
container: 'container',
width: width,
height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

// what is url of dragging element?
var itemURL = '';
let external = 0
let internal = 0

document
.getElementById('drag-items')
.addEventListener('dragstart', function (e) {
    itemURL = e.target.src;
});

var con = stage.container();
con.addEventListener('dragover', function (e) {
e.preventDefault(); // !important
});

let allGroups = []

function componentToHex(c) {
var hex = c.toString(16);
return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function updateGroups(values) {
    values.forEach((v) => {
        allGroups.forEach((group) => {
            if (v.ID ==  group.ID) {
                let r = parseInt((v.external + 0.5) * 255)
                let b = parseInt(255 - r)
                group.children[0].fill(rgbToHex(r, 0, b))
            }
        });
    }); 
}

function getAllActors() {
    res = []
    allGroups.forEach((group) => {
        res.add({
            ID: group.ID,
            external: group.external,
            edges: [] //daniel deals with this
        });
    });
    return res;
}

let nxtID = 1
con.addEventListener('drop', function (e) {
    e.preventDefault();
    // now we need to find pointer position
    // we can't use stage.getPointerPosition() here, because that event
    // is not registered by Konva.Stage
    // we can register it manually:
    stage.setPointersPositions(e);

    let group = new Konva.Group({
        draggable: true,
    });

    Konva.Image.fromURL(itemURL, function (image) {
        layer.add(image);
        image.position(stage.getPointerPosition());
        // image.draggable(true);
        group.add(image);
    });

    xVal = stage.getPointerPosition().x + 5
    yVal = stage.getPointerPosition().y - 15
    console.log(xVal)
    var rect2 = new Konva.Rect({
        x: xVal,
        y: yVal,
        width: 60,
        height: 10,
        fill: rgbToHex(155, 50, 255),
        shadowBlur: 5,
        cornerRadius: 10,
    });
    group.add(rect2)
    layer.add(group)
    
    allGroups.push(group)

    group.external = 0
    group.internal = 0
    group.ID = nxtID;
    nxtID += 1

    console.log("rect2")
    console.log(rect2)

    bob = {
        ID: 1,
        external: 0.5
    }

    updateGroups([bob])
});


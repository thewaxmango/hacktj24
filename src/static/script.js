class AgentGraph {
    MAX_TURN_DEPTH;
    n_len;
    nodes;
    
    constructor () {
        
    }

    init_2 (type_list, adj_list, trust_list = null) {
        this.nodes = [];
        this.MAX_TURN_DEPTH = 100;
        let propagandaA = 0.5;
        for (let i = 0; i < adj_list.length; i++) {
            this.nodes.push(new AgentNode(this, type_list[i]))
            if (type_list[i] == AgentNode.PROPAGANDIST) {
                this.nodes[i].propaganda_belief = propagandaA
                this.nodes[i].update_external_belief();
                propagandaA = -propagandaA
            }
        }
        this.n_len = this.nodes.length;

        for (let i = 0; i < adj_list.length; i++) {
            for (let j = 0; j < adj_list[i].length; j++) {
                let idx = adj_list[i][j]
                if (trust_list != null) {
                    this.nodes[i].add_conx(idx, this.nodes[idx], trust_list[i][j]);
                } else {
                    this.nodes[i].add_conx(idx, this.nodes[idx]);
                }
            }
        }
    }
    
    init_1 (all_actors, edge_pairs) {
        this.n_len = all_actors.length;
        let type_list = [];
        let adj_list = [];
        for (let _ = 0; _ < this.n_len; _++) {
            type_list.push(0);
            adj_list.push([]);
        }

        for (let i = 0; i < this.n_len; i++) {
            let idx = all_actors[i].ID;
            type_list[idx] = all_actors[i].type;
        }

        for (let i = 0; i < edge_pairs.length; i++) {
            let a = edge_pairs[i][0];
            let b = edge_pairs[i][1];

            adj_list[a].push(b);
        }
        
        this.init_2(type_list, adj_list);
        this.print_debug()
    }

    static rand_int(n) {
        return Math.floor(Math.random() * n);
    }

    do_round() {
        this.init_round();
        this.do_turns();
    }

    init_round() {
        //* initialize round
        for (let i = 0; i < this.n_len; i++) {
            this.nodes[i].init_round();
        }
        let root_idx = AgentGraph.rand_int(this.n_len);
        this.nodes[root_idx].init_round_root();
    }

    do_turns() {
        //* do turns
        //steps = []
        for (let turn = 0; turn < this.MAX_TURN_DEPTH; turn++) {
            //console.log(turn + " ------------")
            for (let i = 0; i < this.n_len; i++) {
                this.nodes[i].do_turn();
            }
            for (let i = 0; i < this.n_len; i++) {
                this.nodes[i].update_external_belief();
            }
            console.log(turn, this.nodes[0].get_external())
            let dawei = system.get_all_updates()
            setTimeout((dawei)=>{
                //console.log(dawei)
                updateGroups(dawei)
            }, turn * 100, dawei);
        }

        //* update trust levels
        for (let i = 0; i < this.n_len; i++) {
            this.nodes[i].update_trust();
        }
    }

    print_debug() {
        for (let i = 0; i < this.n_len; i++) {
            console.log("----- node " + i + " -----");
            this.nodes[i].print_debug();
        }
    }

    print_belief() {
        console.log("<--->");
        for (let i = 0; i < this.n_len; i++) {
            console.log(this.nodes[i].get_external());
        }
    }

    get_update(idx) {
        return {
            ID: idx, 
            external: this.nodes[idx].get_external(), 
            edges: this.nodes[idx].conxs_idx};
    }

    get_all_updates() {
        let updates = [];
        for (let i = 0; i < this.n_len; i++) {
            updates.push(this.get_update(i));
        }
        return updates;
    }

    gen_trust_matr() {
        let trust_matr = []
        for (let i = 0; i < this.n_len; i++) {
            trust_matr.push([]);
            for (let _ = 0; _ < this.n_len; _++) {
                trust_matr[i].push(0);
            }

            let idxs = this.nodes[i].conxs_idx;
            let trusts = this.nodes[i].conx_trust;
            for (let j = 0; j < idxs.length; j++) {
                trust_matr[i][idxs[j]] = trusts[j];
            }
        }
        return trust_matr;
    }
}

class AgentNode {
    static TRUTH_TELLER = 0;
    static CONTRARIAN = 1;
    static BULLSHITTER = 2;
    static PROPAGANDIST = 3;
    
    static BELIEF_A = -0.5;
    static BELIEF_AVG = 0;
    static BELIEF_B = 0.5;

    static BELIEF_CHANGE_RATE = 1 / 8;
    static TRUST_INCREASE_RATE = 1 / 16;
    static TRUST_DECREASE_RATE = 1 / 16;

    static MISTAKE_RATE = 0;

    #agent_type;
    #internal_belief;
    external_belief;

    propaganda_belief;
    #bullshit_belief;

    CONTRARIAN_CONST = 0.5;

    conxs_idx = [];
    #conx_nodes = [];
    conx_trust = [];

    #graph;

    constructor(graph, type) {
        this.#graph = graph
        this.#agent_type = type;

        this.#internal_belief = AgentNode.BELIEF_AVG;
        this.propaganda_belief = [AgentNode.BELIEF_A, AgentNode.BELIEF_B][AgentGraph.rand_int(2)];
        this.#bullshit_belief = [AgentNode.BELIEF_A, AgentNode.BELIEF_B][AgentGraph.rand_int(2)];
        this.update_external_belief();
    }

    add_conx(node_idx, node, trust = 0.5) {
        this.conxs_idx.push(node_idx);
        this.conx_trust.push(trust);
        this.#conx_nodes.push(node);
    }

    update_external_belief() {
        switch (this.#agent_type) {
            case AgentNode.TRUTH_TELLER:
                this.external_belief = this.#internal_belief;
                break;
            case AgentNode.CONTRARIAN:
                this.external_belief = -this.#internal_belief;
                break;
            case AgentNode.BULLSHITTER:
                this.external_belief = this.#bullshit_belief;
                break;
            case AgentNode.PROPAGANDIST:
                this.external_belief = this.propaganda_belief;
                break;
        }

        if (Math.random() < AgentNode.MISTAKE_RATE) {
            this.external_belief = Math.round((Math.random() - 0.5) * 64) / 64;
        }
    }

    init_round() {
        this.#internal_belief = AgentNode.BELIEF_AVG;
        this.#bullshit_belief = Math.random();
        this.update_external_belief();
    }

    init_round_root() {
        // if (Math.random() - 0.5 < this.#internal_belief) {
        //     this.#internal_belief = AgentNode.BELIEF_A;
        // } else {
        //     this.#internal_belief = AgentNode.BELIEF_B;
        // }
        this.#internal_belief = Math.round(Math.random() * 64) / 64;
       this.update_external_belief();
    }

    do_turn() {
        //* update internal belief
        let belief_delta = 0;
        for (let i = 0; i < this.conxs_idx.length; i++) {
            belief_delta += (this.#conx_nodes[i].external_belief - this.#internal_belief) * this.conx_trust[i];
        }
        belief_delta *= AgentNode.BELIEF_CHANGE_RATE;
        belief_delta = Math.round(belief_delta * 64) / 64;

        if (this.#agent_type != AgentNode.CONTRARIAN || Math.abs(this.#internal_belief) < this.CONTRARIAN_CONST) {
            this.#internal_belief += belief_delta;
        } else if (belief_delta * this.#internal_belief > 0) {
            this.#internal_belief += belief_delta;
        }
            
        //console.log("\t" + belief_delta + " " + this.#internal_belief + " -- " + this.conx_trust)
                
        if (this.#internal_belief < AgentNode.BELIEF_A) {
            this.#internal_belief = AgentNode.BELIEF_A;
        } else if (this.#internal_belief > AgentNode.BELIEF_B) {
            this.#internal_belief = AgentNode.BELIEF_B;
        }
    }

    update_trust() {
        for (let i = 0; i < this.conxs_idx.length; i++) {
            if (this.conx_trust[i] <= 0) {
                continue;
            }

            let node_belief = this.#conx_nodes[i].external_belief;

            if (node_belief == 0 || this.#internal_belief == 0) {
                continue;
            }

            let diff_view = Math.min(this.#internal_belief, node_belief) < AgentNode.BELIEF_AVG && Math.max(this.#internal_belief, node_belief) > AgentNode.BELIEF_AVG;
            let belief_diff = Math.abs(this.#internal_belief - node_belief)
            if (!diff_view) {
                this.conx_trust[i] += AgentNode.TRUST_INCREASE_RATE * (1 - belief_diff);
            } else {
                this.conx_trust[i] -= AgentNode.TRUST_DECREASE_RATE * belief_diff;
            }

            if (this.conx_trust[i] > 1) {
                this.conx_trust[i] = 1;
            } else if (this.conx_trust[i] < 0) {
                this.conx_trust[i] = 0;
            }
        }
    }

    print_debug() {
        console.log("type:  " + this.#agent_type);
        console.log("belie: " + this.#internal_belief + " " + this.external_belief);
        console.log("conxs: " + this.conxs_idx);
        console.log("trust: " + this.conx_trust)
    }

    get_external() {
        return this.external_belief;
    }
}

//---------------------------------------------

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
    console.log(itemURL)
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
    //console.log("Updating groups")
    values.forEach((v) => {
        allGroups.forEach((group) => {
            if (v.ID ==  group.ID) {
                let r = parseInt((v.external + 0.5) * 255)
                let b = parseInt(255 - r)
                group.children[0].fill(rgbToHex(r, 0, b))
                group.children[1].text(v.external.toString().substring(0, 5))
            }
        });
    }); 
    
    redrawLines(system.gen_trust_matr());
}

function getAllEdges(){
    return lines;
}
function getAllActors() {
    res = []
    allGroups.forEach((group) => {
        res.push({
            ID: group.ID,
            external: group.external,
            type: group.type,
            edges: [] //daniel deals with this
        });
    });
    return res;
}

let nxtID = 0
con.addEventListener('drop', function (e) {
    e.preventDefault();
    // now we need to find pointer position
    // we can't use stage.getPointerPosition() here, because that event
    // is not registered by Konva.Stage
    // we can register it manually:
    stage.setPointersPositions(e);

    let group = new Konva.Group({
        draggable: true,
        name: "target"+nxtID
    });
    group.on('dragend', function(){
        // thickness = [[4, 4, 10, 3], [4, 4, 10, 3], [4, 4, 10, 3], [4, 4, 10, 3]]
            redrawLines();
    });

    group.type = -1
    Konva.Image.fromURL(itemURL, function (image) {
        layer.add(image);
        console.log(itemURL);
        if ("https://hacktj24.sites.tjhsst.edu/assets/truth.png" == itemURL) {
            group.type = 0
        }
        if ("https://hacktj24.sites.tjhsst.edu/assets/capper.png" == itemURL) {
            group.type = 1
        }
        if ("https://hacktj24.sites.tjhsst.edu/assets/yapper.png" == itemURL) {
            group.type = 2
        }
        if ("https://hacktj24.sites.tjhsst.edu/assets/propagandist.png" == itemURL) {
            group.type = 3
        }

        image.position(stage.getPointerPosition());
        // image.draggable(true);
        group.add(image);
    });

    xVal = stage.getPointerPosition().x + 5
    yVal = stage.getPointerPosition().y - 15
    console.log(xVal)
    ext = 0.0
    let r = parseInt((ext + 0.5) * 255)
    let b = parseInt(255 - r)
    console.log(r, b)
    
    var rect2 = new Konva.Rect({
        x: xVal,
        y: yVal,
        width: 60,
        height: 10,
        fill: rgbToHex(r, 0, b),
        shadowBlur: 5,
        cornerRadius: 10,
    });
    group.add(rect2)

    var txt = new Konva.Text({
        x: xVal + 5,
        y: yVal - 25,
        text: "0.5",
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#555',
        width: 50,
        padding: 0,
        align: 'center',
      });
      
    group.add(txt)
    group.add(rect2)
    layer.add(group)
    
    allGroups.push(group)

    group.external = 0
    group.internal = 0
    group.ID = nxtID;

    nxtID += 1
wow();
    // console.log("rect2")
    // console.log(rect2)
});

function forceSpawn(pckg) {
    let group = new Konva.Group({
        draggable: true,
        name: "target"+nxtID
    });
    group.on('dragend', function(){
                // thickness = [[4, 4, 10, 3], [4, 4, 10, 3], [4, 4, 10, 3], [4, 4, 10, 3]]
            redrawLines();
            console.log("WOW finsihed ");
    });

    group.type = -1;
    let itemURL = undefined
    if (pckg.type == 0) {
        group.type = 0
        itemURL = "./assets/truth.png"
    } else if (pckg.type == 1) {
        group.type = 1
        itemURL = "./assets/capper.png"
    } else if (pckg.type == 2) {
        group.type = 2
        itemURL = "./assets/balder.png"
    } else if (pckg.type == 3) {
        group.type = 3
        itemURL = "./assets/propagandist.png"
    }

    pos = {
        x: pckg.x,
        y: pckg.y
    }
    Konva.Image.fromURL(itemURL, function (image) {
        image.position(pos);
        console.log(pos)
        group.add(image)
    })

    xVal = pckg.x + 5
    yVal = pckg.y - 15
    console.log(xVal)
    ext = 0.0
    let r = parseInt((ext + 0.5) * 255)
    let b = parseInt(255 - r)
    console.log(r, b)

    var rect2 = new Konva.Rect({
        x: xVal,
        y: yVal,
        width: 60,
        height: 10,
        fill: rgbToHex(r, 0, b),
        shadowBlur: 5,
        cornerRadius: 10,
    });
    group.add(rect2)

    var txt = new Konva.Text({
        x: xVal + 5,
        y: yVal - 25,
        text: "0.5",
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#555',
        width: 50,
        padding: 0,
        align: 'center',
      });
    group.add(txt)
    layer.add(group)
    
    allGroups.push(group)

    group.external = 0
    group.internal = 0
    group.ID = nxtID;

    nxtID += 1
    wow();
}
    let line;
    let lines = [];
    let coords = [];
    let linehe = [];

    function redrawLines(thickness){
            linehe.forEach((x)=>{
                    x.destroy();
            });
            lines.forEach((x)=>{
                console.log("redraw")
                    console.log(lines);
                    console.log(x);
                    val = 0;
                    if(thickness==undefined){
                        console.log("undefined")
                        val = 1;
                    }else{
                        val = 10*thickness[allGroups[x[0]].ID][allGroups[x[1]].ID];
                    }
                    console.log("VSDFSDF")
                    console.log(val);
                    contVal = 30;
                    randx = contVal*(Math.random()-0.5);
                    randy = contVal*(Math.random()-0.5);
                    
                    line = new Konva.Arrow({
                            stroke: 'black',
                            // remove line from hit graph, so we can check intersections
                            listening: false,
                            strokeWidth: val,
                            points: [allGroups[x[0]].children[0].x()+40+allGroups[x[0]].x()+randx, allGroups[x[0]].children[0].y()+allGroups[x[0]].y()+100+randy, allGroups[x[1]].children[0].x()+allGroups[x[1]].x()+40+randx, allGroups[x[1]].children[0].y()+allGroups[x[1]].y()+100+randy]
                    });
                    linehe.push(line)
                    layer.add(line)
                    line = null;
            });
    }
function wow(){

    for(let i  = 0; i< allGroups.length; i++){
            allGroups[i].on('mousedown', (e) => {
              if (e.evt.button === 2) {
                    const pos = stage.getPointerPosition();
                    list = [allGroups[i].children[0].x()+allGroups[i].x()+50, allGroups[i].children[0].y()+allGroups[i].y()+100, pos.x, pos.y]
                    // if((list[0]-list[2])**2+(list[1]-list[3])**2>3000){
                    line = new Konva.Arrow({
                            stroke: 'black',
                            // remove line from hit graph, so we can check intersections
                            listening: false,
                            points: [allGroups[i].children[0].x()+allGroups[i].x()+50, allGroups[i].children[0].y()+allGroups[i].y()+100, pos.x, pos.y]
                    });
                    // }
                    coords.push(i);
              }
            });
    }
    stage.on('mouseover', (e) => {
        if(e.target.parent==null){
            return;
        }
            if (e.target.parent.ID!=undefined) {
                    // e.target.stroke('black');
                    layer.draw();
            }
    });
    stage.on('mouseout', (e) => {
        if(e.target.parent==null){
            return;
        }

            if (e.target.parent.ID!=undefined) {
                    e.target.stroke(null);
                    layer.draw();
            }
    });
    stage.on('mousemove', (e) => {
            if (!line) {
                    return;
            }
            const pos = stage.getPointerPosition();
            const points = line.points().slice();
            points[2] = pos.x;
            points[3] = pos.y;
            line.points(points);
            layer.batchDraw();
    });
    
    stage.on('mouseup', (e) => {
            if (!line) {
                    return;
            }

            if (e.target.parent==null||e.target.parent.ID==undefined) {
                    line.destroy();
                    layer.draw();
                    line = null;
            } else {
                    coords.push(e.target.parent.ID)
                    console.log(coords);
                    while(coords.length>2){
                        coords.shift();
                    }
                    // if(coords.length==2){
                            lines.push(coords)
                            linehe.push(line)
                            console.log(lines)
                            coords = [];
                    // }
                                        layer.add(line);
                    console.log(e.target.getName());
                    line = null;
            }
    });
}
document.addEventListener('contextmenu', event => {
    event.preventDefault();
});


bob = {
    ID: 1,
    external: 0.5
}


type_list = [AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER,
    AgentNode.TRUTH_TELLER, AgentNode.PROPAGANDIST, AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, 
    AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, AgentNode.PROPAGANDIST];
adj_list = [[1, 2, 3, 4, 5, 6], [0, 2, 3, 4, 5, 7], [0, 1, 3, 4, 5, 7, 8], [0, 1, 2, 4, 5], [0, 1, 2, 3, 5], [0, 1, 2, 3, 4], [0, 7, 8, 9, 10], [1, 2, 6, 8, 9, 10], [2, 6, 7, 9, 10], [6, 7, 8, 10], [6, 7, 8, 9]];


// HARD CODE PCKGS HERE CORRESPONDING TO ^^^^
pckg1 = {
    x: 100,
    y: 100,
    type: AgentNode.TRUTH_TELLER
}

pckg2 = {
    x: 200,
    y: 100,
    type: AgentNode.TRUTH_TELLER
}

pckg3 = {
    x: 250,
    y: 100,
    type: AgentNode.TRUTH_TELLER
}

pckg4 = {
    x: 300,
    y: 100,
    type: AgentNode.TRUTH_TELLER
}


// setTimeout(()=>{forceSpawn(pckg1)}, 100);
// setTimeout(()=>{forceSpawn(pckg2)}, 200);
// setTimeout(()=>{forceSpawn(pckg3)}, 300);
// setTimeout(()=>{forceSpawn(pckg4)}, 400);




//-----------------------------------------

system = new AgentGraph();
// system.nodes[5].propaganda_belief = AgentNode.BELIEF_B;
// system.nodes[5].update_external_belief();
// system.nodes[10].propaganda_belief = AgentNode.BELIEF_A;
// system.nodes[10].update_external_belief();


david = system.get_all_updates()
updateGroups(david)

console.log(document.getElementById('go'))

document.getElementById('go').onclick = function() {
    system.do_round();
    david = system.get_all_updates()
    updateGroups(david)
    console.log(system.get_all_updates())
    system.print_debug();
};

document.getElementById('reset').onclick = function() {
    let allInfo = getAllActors()
    let allEdges = getAllEdges()
    system.init_1(allInfo, allEdges)

    system.print_debug();
};


// console.log(system.nodes);
// for (let i = 0; i < 10; i++) {
//     //system.print_belief();
// }
// system.print_debug();

// console.log(system.get_all_updates())



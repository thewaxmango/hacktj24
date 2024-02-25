class AgentGraph {
    MAX_TURN_DEPTH;
    n_len;
    nodes;
    
    constructor (type_list, adj_list, trust_list = null) {
        this.nodes = [];
        this.MAX_TURN_DEPTH = 100;

        for (let i = 0; i < adj_list.length; i++) {
            this.nodes.push(new AgentNode(this, type_list[i]))
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

        //AgentGraph.MAX_TURN_DEPTH = 2 * this.n_len;
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
        //this.nodes[root_idx].init_round_root();
    }

    do_turns() {
        //* do turns
        for (let turn = 0; turn < this.MAX_TURN_DEPTH; turn++) {
            for (let i = 0; i < this.n_len; i++) {
                this.nodes[i].do_turn();
            }
            for (let i = 0; i < this.n_len; i++) {
                this.nodes[i].update_external_belief();
            }
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
}

class AgentNode {
    static TRUTH_TELLER = 0;
    static CONTRARIAN = 1;
    static BULLSHITTER = 2;
    static PROPAGANDIST = 3;
    
    static BELIEF_A = -0.5;
    static BELIEF_AVG = 0;
    static BELIEF_B = 0.5;

    static BELIEF_CHANGE_RATE = 0.05;
    static TRUST_INCREASE_RATE = 0.02;
    static TRUST_DECREASE_RATE = 0.02;

    #agent_type;
    #internal_belief;
    external_belief;

    propaganda_belief;
    #bullshit_belief;

    #conxs_idx = [];
    #conx_nodes = [];
    #conx_trust = [];

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
        this.#conxs_idx.push(node_idx);
        this.#conx_trust.push(trust);
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
    }

    init_round() {
        this.#internal_belief = AgentNode.BELIEF_AVG;
        this.#bullshit_belief = Math.random();
        this.update_external_belief();
    }

    init_round_root() {
        if (Math.random() < this.#internal_belief) {
            this.#internal_belief = AgentNode.BELIEF_A;
        } else {
            this.#internal_belief = AgentNode.BELIEF_B;
        }
        this.update_external_belief();
    }

    do_turn() {
        //* update internal belief
        let belief_delta = 0;
        for (let i = 0; i < this.#conxs_idx.length; i++) {
            belief_delta += (this.#conx_nodes[i].external_belief - this.#internal_belief) * this.#conx_trust[i];
        }
        belief_delta *= AgentNode.BELIEF_CHANGE_RATE;
        this.#internal_belief += belief_delta;
                
        if (this.#internal_belief < AgentNode.BELIEF_A) {
            this.#internal_belief = AgentNode.BELIEF_A;
        } else if (this.#internal_belief > AgentNode.BELIEF_B) {
            this.#internal_belief = AgentNode.BELIEF_B;
        }
    }

    update_trust() {
        for (let i = 0; i < this.#conxs_idx.length; i++) {
            if (this.#conx_trust[i] <= 0) {
                continue;
            }

            let node_belief = this.#conx_nodes[i].external_belief;

            if (node_belief == 0 || this.#internal_belief == 0) {
                continue;
            }

            let diff_view = Math.min(this.#internal_belief, node_belief) < AgentNode.BELIEF_AVG && Math.max(this.#internal_belief, node_belief) > AgentNode.BELIEF_AVG;
            let belief_diff = Math.abs(this.#internal_belief - node_belief)
            if (!diff_view) {
                this.#conx_trust[i] += AgentNode.TRUST_INCREASE_RATE * (1 - belief_diff);
            } else {
                this.#conx_trust[i] -= AgentNode.TRUST_DECREASE_RATE * belief_diff;
            }

            if (this.#conx_trust[i] > 1) {
                this.#conx_trust[i] = 1;
            } else if (this.#conx_trust[i] < 0) {
                this.#conx_trust[i] = 0;
            }
        }
    }

    print_debug() {
        //console.log("type:  " + this.#agent_type);
        console.log("belie: " + this.#internal_belief + " " + this.external_belief);
        //console.log("conxs: " + this.#conxs_idx);
        console.log("trust: " + this.#conx_trust)
    }

    get_external() {
        return this.external_belief;
    }
}

type_list = [AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER,
            AgentNode.PROPAGANDIST, AgentNode.PROPAGANDIST];
adj_list = [[], [2, 3, 4, 5], [1, 3, 4], [1, 2, 4], [1, 2, 3, 6], [1], [4]];

system = new AgentGraph(type_list, adj_list);
system.nodes[5].propaganda_belief = AgentNode.BELIEF_B;
system.nodes[5].update_external_belief();
system.nodes[6].propaganda_belief = AgentNode.BELIEF_A;
system.nodes[6].update_external_belief();


console.log(system.nodes);
for (let i = 0; i < 50; i++) {
    //system.print_belief();
    system.do_round();
}
system.print_debug();

class AgentGraph {
    static MAX_TURN_DEPTH = 20;
    static nodes = [];
    
    constructor(type_list, adj_list, trust_list = null) {
        for (let i = 0; i < adj_list.length; i++) {
            this.nodes.push(new AgentNode(type_list[i]))
        }

        for (let i = 0; i < adj_list.length; i++) {
            for (let j = 0; j < adj_list[i].length; j++) {
                if (trust_list != null) {
                    this.nodes.add_conx(adj_list[i][j], trust_list[i][j])
                } else {
                    this.nodes.add_conx(adj_list[i][j])
                }
            }
        }

        this.MAX_TURN_DEPTH = 2 * this.nodes.length;
    }

    rand_int(n) {
        return Math.floor(Math.random() * n);
    }

    do_round() {
        //* initialize round
        for (let node in this.nodes) {
            node.init_round();
        }
        let root_idx = this.rand_int(this.nodes.length);
        this.nodes[root_idx].init_round_root();

        console.log("Round root is: " + root_idx);

        //* do turns
        let move_queue = new Set([root_idx]);
        for (let turn = 0; turn < this.MAX_TURN_DEPTH; turn++) {
            let new_move_queue = [];
            for (let node_idx in move_queue) {
                new_move_queue += node_idx.do_turn();
            }
            move_queue = new Set(new_move_queue);
        }

        //* update trust levels
        for (let node in this.nodes) {
            node.update_trust();
        }
    }
}

class AgentNode {
    static TRUTH_TELLER = 0;
    static CONTRARIAN = 1;
    static BULLSHITTER = 2;
    static PROPAGANDIST = 3;
    
    static BELIEF_A = 0;
    static BELIEF_AVG = 0.5;
    static BELIEF_B = 1;

    static belief_change_rate = 0.2;
    static trust_increase_rate = 0.1;
    static trust_decrease_rate = 0.1;

    #agent_type;
    #internal_belief;
    external_belief;

    #propaganda_belief;
    #bullshit_belief;

    #conxs_idx = [];
    #conx_trust = [];   

    constructor(type) {
        this.#agent_type = type;

        this.#internal_belief = this.BELIEF_AVG;
        this.#propaganda_belief = Math.random();
        this.#bullshit_belief = Math.random();
        this.update_external_belief();
    }

    add_conx(node_idx, trust = 0.5) {
        this.#conxs_idx.push(node_idx);
        this.#conx_trust.push(trust);
    }

    update_external_belief() {
        switch (this.#agent_type) {
            case this.TRUTH_TELLER:
                this.external_belief = this.#internal_belief;
                break;
            case this.CONTRARIAN:
                this.external_belief = 1 - this.#internal_belief;
                break;
            case this.BULLSHITTER:
                this.external_belief = this.#bullshit_belief;
                break;
            case this.PROPAGANDIST:
                this.external_belief = this.#propaganda_belief;
                break;
        }
    }

    init_round() {
        this.#internal_belief = this.BELIEF_AVG;
        this.#bullshit_belief = Math.random();
        this.update_external_belief();
    }

    init_round_root() {
        if (Math.random() < this.internal_belief) {
            this.#internal_belief = this.BELIEF_A;
        } else {
            this.#internal_belief = this.BELIEF_B;
        }

        console.log("Root belief is " + this.#internal_belief);
    }

    do_turn() {
        //* update internal belief
        let belief_delta = 0;
        for (let i = 0; i < this.#conxs_idx.length; i++) {
            let node = AgentGraph.nodes[this.#conxs_idx[i]]
            belief_delta += node.external_belief * this.#conx_trust[i];
        }
        belief_delta *= this.belief_change_rate;

        this.#internal_belief = this.BELIEF_AVG + belief_delta;
        if (this.#internal_belief < this.BELIEF_B) {
            this.#internal_belief = this.BELIEF_A;
        } else if (this.#internal_belief > this.BELIEF_B) {
            this.#internal_belief = this.BELIEF_B;
        }

        //* update external belief
        this.update_external_belief();

        //* propagate
        return this.#conxs_idx;
    }

    update_trust() {
        for (let i = 0; i < this.#conxs_idx.length; i++) {
            if (this.#conx_trust[i] == 0) {
                continue;
            }

            let node_idx = this.#conxs_idx[i]; 
            let node_belief = AgentGraph.nodes[node_idx].external_belief;
            let same_view = Math.min(this.#internal_belief, node_belief) < 0.5 && Math.max(this.#internal_belief, node_belief) > 0.5;

            let belief_diff = Math.abs(this.#internal_belief - node_belief)
            if (same_view) {
                this.#conx_trust[i] += this.trust_increase_rate * belief_diff;
            } else {
                this.#conx_trust[i] -= this.trust_decrease_rate * belief_diff;
            }
        }
    }
}

type_list = [AgentNode.TRUTH_TELLER, AgentNode.TRUTH_TELLER];
adj_list = [[1], [0]]


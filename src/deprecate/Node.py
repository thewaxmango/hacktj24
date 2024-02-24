import random

#* a person in a communication network
class Node:

    #* types of people
    TRUTH_TELLER = 0
    CONTRARIAN = 1
    BULLSHITTER = 2
    PROPAGANDIST = 3
    
    #* A, B beliefs
    BELIEF_A = 0
    BELIEF_B = 1
    
    #* initialize
    def __init__(self, type = TRUTH_TELLER):
        self.belief_type = type
        
        #^ what the individuals actually believes
        self.internal_belief = 0.5
        
        #^ what the individuals displays to others
        self.external_belief = 0.5
        self.propaganda_belief = random.random()
        self.bullshit_belief = random.random()
        self.external_match_internal()
        
        #^ connected individuals : how much influenced by
        self.connections = {} 
    
    #* upon starting round
    def init_round(self):
        #^ set internal, bullshit belief
        self.internal_belief = 0.5
        self.bullshit_belief = random.random()
        
        #^ let external belief match
        self.external_match_internal()
        
    #* per round root of information
    def init_round_root(self):
        #^ choose weighted based on previous
        #! change formula?
        if random.random() < self.internal_belief:
            self.internal_belief = self.BELIEF_A
        else:
            self.internal_belief = self.BELIEF_B

    #* make external belief match internal
    def external_match_internal(self):
        match (self.belief_type):
            case self.TRUTH_TELLER:
                self.external_belief = self.internal_belief
            case self.CONTRARIAN:
                self.external_belief = 1 - self.internal_belief
            case self.BULLSHITTER:
                self.external_belief = self.bullshit_belief
            case self.PROPAGANDIST:
                self.external_belief = self.propaganda_belief
    
    def step_belief(self):
        #! update and propagate
        pass

    
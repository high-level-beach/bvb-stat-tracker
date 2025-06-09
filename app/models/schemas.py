from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import date
from enum import Enum

# Enum definitions to match SQLAlchemy models
class ActionType(str, Enum):
    SERVING = "serving"
    SERVE_RECEIVE = "serve_receive"
    ATTACK = "attack" 
    BLOCK = "block"
    DIG = "dig"
    SET = "set"

class ServeType(str, Enum):
    FLOAT = "float"
    HYBRID = "hybrid"
    TOPSPIN = "topspin"
    JUMP = "jump"
    
class AttackDirection(str, Enum):
    LINE = "line"
    ANGLE = "angle"
    CUT = "cut"
    JUMBO = "jumbo"

class AttackType(str, Enum):
    HARD = "hard"
    ROLL = "roll"
    TIP = "tip"
    
class SetType(str, Enum):
    BUMP = "bump"
    HAND = "hand"
    JUMP = "jump"

class PassRating(int, Enum):
    POOR = 0
    PLAYABLE = 1
    GOOD = 2
    PERFECT = 3

class DigQuality(str, Enum):
    GOOD = "good"
    PLAYABLE = "playable"
    POOR = "poor"

# Player Schemas
class PlayerBase(BaseModel):
    name: str

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    id: int
    
    class Config:
        orm_mode = True

# Game Schemas
class GameBase(BaseModel):
    date: date
    team1: list[int]
    team2: list[int]

class GameCreate(GameBase):
    pass

class Game(GameBase):
    id: int
    
    class Config:
        orm_mode = True

# Base Stat Schema
class BaseStatBase(BaseModel):
    game_id: int
    player_id: int
    action_type: ActionType
    timestamp: str  # ISO datetime string

class BaseStatCreate(BaseStatBase):
    pass

class BaseStat(BaseStatBase):
    id: int
    player_name: Optional[str] = None
    
    class Config:
        orm_mode = True

# Serve Stats
class ServeStatBase(BaseModel):
    is_ace: bool = False
    is_missed: bool = False
    serve_type: Optional[ServeType] = None
    serve_target: Optional[str] = None
    opponent_pass_quality: Optional[PassRating] = None

class ServeStatCreate(ServeStatBase):
    pass

class ServeStat(ServeStatBase):
    stat_id: int
    
    class Config:
        orm_mode = True

# Receive Stats
class ReceiveStatBase(BaseModel):
    is_good_pass: bool = False
    is_error: bool = False
    pass_rating: Optional[PassRating] = None

class ReceiveStatCreate(ReceiveStatBase):
    pass

class ReceiveStat(ReceiveStatBase):
    stat_id: int
    
    class Config:
        orm_mode = True

# Attack Stats
class AttackStatBase(BaseModel):
    is_kill: bool = False
    is_error: bool = False
    is_blocked: bool = False
    attack_type: Optional[AttackType] = None
    attack_direction: Optional[AttackDirection] = None

class AttackStatCreate(AttackStatBase):
    pass

class AttackStat(AttackStatBase):
    stat_id: int
    
    class Config:
        orm_mode = True

# Block Stats
class BlockStatBase(BaseModel):
    is_stuff: bool = False
    is_touch: bool = False

class BlockStatCreate(BlockStatBase):
    pass

class BlockStat(BlockStatBase):
    stat_id: int
    
    class Config:
        orm_mode = True

# Dig Stats
class DigStatBase(BaseModel):
    is_successful: bool = False
    led_to_kill: bool = False
    dig_quality: Optional[DigQuality] = None

class DigStatCreate(DigStatBase):
    pass

class DigStat(DigStatBase):
    stat_id: int
    
    class Config:
        orm_mode = True

# Set Stats
class SetStatBase(BaseModel):
    is_killable: bool = False
    is_error: bool = False
    set_type: Optional[SetType] = None

class SetStatCreate(SetStatBase):
    pass

class SetStat(SetStatBase):
    stat_id: int
    
    class Config:
        orm_mode = True

# Combined Stat Response Model
class StatResponse(BaseModel):
    base: BaseStat
    details: Union[ServeStat, ReceiveStat, AttackStat, BlockStat, DigStat, SetStat, None] = None
    
    class Config:
        orm_mode = True

# Game Stats summary
class PlayerGameStats(BaseModel):
    player: Player
    game: Game
    
    # Serving stats
    total_serves: int = 0
    missed_serves: int = 0
    aces: int = 0
    serve_types: dict = {}
    
    # Serve receive stats
    total_receive_attempts: int = 0
    good_passes: int = 0
    receive_errors: int = 0
    pass_ratings: dict = {}
    
    # Attack stats
    total_attacks: int = 0
    kills: int = 0
    attack_errors: int = 0
    attacks_blocked: int = 0
    attack_directions: dict = {}
    attack_types: dict = {}
    
    # Block stats
    block_attempts: int = 0
    stuff_blocks: int = 0
    block_touches: int = 0
    
    # Dig stats
    dig_attempts: int = 0
    successful_digs: int = 0
    digs_to_kills: int = 0
    dig_qualities: dict = {}
    
    # Set stats
    total_sets: int = 0
    set_errors: int = 0
    killable_sets: int = 0
    set_types: dict = {}
    
    class Config:
        orm_mode = True

# All-in-one request model for creating stats
class CreateStatRequest(BaseModel):
    base_stat: BaseStatCreate
    serve_stat: Optional[ServeStatCreate] = None
    receive_stat: Optional[ReceiveStatCreate] = None
    attack_stat: Optional[AttackStatCreate] = None
    block_stat: Optional[BlockStatCreate] = None
    dig_stat: Optional[DigStatCreate] = None
    set_stat: Optional[SetStatCreate] = None

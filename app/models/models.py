from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
import enum
from datetime import date

from .database import Base

# Enums
class ActionType(enum.Enum):
    SERVING = "serving"
    SERVE_RECEIVE = "serve_receive"
    ATTACK = "attack"
    BLOCK = "block"
    DIG = "dig"
    SET = "set"

class ServeType(enum.Enum):
    FLOAT = "float"
    HYBRID = "hybrid"
    TOPSPIN = "topspin"
    JUMP = "jump"

class AttackDirection(enum.Enum):
    LINE = "line"
    ANGLE = "angle"
    CUT = "cut"
    JUMBO = "jumbo"

class AttackType(enum.Enum):
    HARD = "hard"
    ROLL = "roll"
    TIP = "tip"

class SetType(enum.Enum):
    BUMP = "bump"
    HAND = "hand"
    JUMP = "jump"

class PassRating(enum.Enum):
    POOR = 0
    PLAYABLE = 1
    GOOD = 2
    PERFECT = 3

class DigQuality(enum.Enum):
    GOOD = "good"
    PLAYABLE = "playable"
    POOR = "poor"

# Base Game Models
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=date.today)
    team1 = Column(String, nullable=False)  # JSON stringified list of player IDs
    team2 = Column(String, nullable=False)  # JSON stringified list of player IDs
    
    # Relationships
    base_stats = relationship("BaseStat", back_populates="game")

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    
    # Relationships
    base_stats = relationship("BaseStat", back_populates="player")

# Base Stat Model - Common fields for all stat types
class BaseStat(Base):
    __tablename__ = "base_stats"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    action_type = Column(Enum(ActionType), nullable=False)
    timestamp = Column(String)  # ISO datetime string
    
    # Relationships
    game = relationship("Game", back_populates="base_stats")
    player = relationship("Player", back_populates="base_stats")
    serve_stat = relationship("ServeStat", back_populates="base_stat", uselist=False, cascade="all, delete-orphan")
    receive_stat = relationship("ReceiveStat", back_populates="base_stat", uselist=False, cascade="all, delete-orphan")
    attack_stat = relationship("AttackStat", back_populates="base_stat", uselist=False, cascade="all, delete-orphan")
    block_stat = relationship("BlockStat", back_populates="base_stat", uselist=False, cascade="all, delete-orphan")
    dig_stat = relationship("DigStat", back_populates="base_stat", uselist=False, cascade="all, delete-orphan")
    set_stat = relationship("SetStat", back_populates="base_stat", uselist=False, cascade="all, delete-orphan")
    
    @property
    def player_name(self):
        return self.player.name if self.player else None

# Serve Stats
class ServeStat(Base):
    __tablename__ = "serve_stats"

    stat_id = Column(Integer, ForeignKey("base_stats.id"), primary_key=True)
    is_ace = Column(Boolean, default=False)
    is_missed = Column(Boolean, default=False)
    serve_type = Column(Enum(ServeType))
    serve_target = Column(String)  # Zone 1-6
    opponent_pass_quality = Column(Enum(PassRating))
    
    # Relationship back to base stat
    base_stat = relationship("BaseStat", back_populates="serve_stat")

# Receive Stats
class ReceiveStat(Base):
    __tablename__ = "receive_stats"

    stat_id = Column(Integer, ForeignKey("base_stats.id"), primary_key=True)
    is_good_pass = Column(Boolean, default=False) 
    is_error = Column(Boolean, default=False)
    pass_rating = Column(Enum(PassRating))
    
    # Relationship back to base stat
    base_stat = relationship("BaseStat", back_populates="receive_stat")

# Attack Stats
class AttackStat(Base):
    __tablename__ = "attack_stats"

    stat_id = Column(Integer, ForeignKey("base_stats.id"), primary_key=True)
    is_kill = Column(Boolean, default=False)
    is_error = Column(Boolean, default=False) 
    is_blocked = Column(Boolean, default=False)
    attack_type = Column(Enum(AttackType))
    attack_direction = Column(Enum(AttackDirection))
    
    # Relationship back to base stat
    base_stat = relationship("BaseStat", back_populates="attack_stat")

# Block Stats
class BlockStat(Base):
    __tablename__ = "block_stats"

    stat_id = Column(Integer, ForeignKey("base_stats.id"), primary_key=True)
    is_stuff = Column(Boolean, default=False)
    is_touch = Column(Boolean, default=False)
    
    # Relationship back to base stat
    base_stat = relationship("BaseStat", back_populates="block_stat")

# Dig Stats
class DigStat(Base):
    __tablename__ = "dig_stats"

    stat_id = Column(Integer, ForeignKey("base_stats.id"), primary_key=True)
    is_successful = Column(Boolean, default=False)
    led_to_kill = Column(Boolean, default=False)
    dig_quality = Column(Enum(DigQuality))
    
    # Relationship back to base stat
    base_stat = relationship("BaseStat", back_populates="dig_stat")

# Set Stats
class SetStat(Base):
    __tablename__ = "set_stats"

    stat_id = Column(Integer, ForeignKey("base_stats.id"), primary_key=True)
    is_killable = Column(Boolean, default=False)
    is_error = Column(Boolean, default=False)
    set_type = Column(Enum(SetType))
    
    # Relationship back to base stat
    base_stat = relationship("BaseStat", back_populates="set_stat")

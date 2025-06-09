import json
import enum

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..models.database import get_db
from ..models.models import BaseStat, Game, ActionType, ServeType, AttackType, AttackDirection, SetType, PassRating, DigQuality
from ..models.models import ServeStat, ReceiveStat, AttackStat, BlockStat, DigStat, SetStat
from ..models.schemas import StatResponse, BaseStatCreate, ServeStatCreate, ReceiveStatCreate, AttackStatCreate
from ..models.schemas import BlockStatCreate, DigStatCreate, SetStatCreate, CreateStatRequest

router = APIRouter(
    prefix="/api/games",
    tags=["game_stats"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{game_id}/stats", response_model=List[StatResponse])
async def get_game_stats(game_id: int, db: AsyncSession = Depends(get_db)):
    """Get all stats for a specific game"""
    # First verify the game exists
    game_result = await db.execute(select(Game).where(Game.id == game_id))
    game = game_result.scalars().first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get all base stats for this game
    try:
        result = await db.execute(
            select(BaseStat).where(BaseStat.game_id == game_id).order_by(BaseStat.timestamp.desc())
        )
        base_stats = result.scalars().all()
    except Exception as e:
        # Handle any database errors
        print(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
    
    # Build response objects with details based on action_type
    response_stats = []
    for base_stat in base_stats:
        # Convert the base_stat to a dict with proper formatting
        base_dict = {
            "id": base_stat.id,
            "game_id": base_stat.game_id,
            "player_id": base_stat.player_id,
            "action_type": base_stat.action_type.value if hasattr(base_stat.action_type, 'value') else base_stat.action_type,
            "timestamp": base_stat.timestamp.isoformat() if hasattr(base_stat.timestamp, 'isoformat') else base_stat.timestamp
        }
        
        # Create the response object
        stat_response = {"base": base_dict, "details": None}
        
        # Get the corresponding detail stat based on action_type and convert to dict
        action_type = base_stat.action_type
        detail_stat = None
        
        # Compare using string value for more reliability
        action_type_str = action_type.value if hasattr(action_type, 'value') else action_type
        
        if action_type_str == "serving" and base_stat.serve_stat:
            detail_stat = base_stat.serve_stat
        elif action_type_str == "serve_receive" and base_stat.receive_stat:
            detail_stat = base_stat.receive_stat
        elif action_type_str == "attack" and base_stat.attack_stat:
            detail_stat = base_stat.attack_stat
        elif action_type_str == "block" and base_stat.block_stat:
            detail_stat = base_stat.block_stat
        elif action_type_str == "dig" and base_stat.dig_stat:
            detail_stat = base_stat.dig_stat
        elif action_type_str == "set" and base_stat.set_stat:
            detail_stat = base_stat.set_stat
            
        # Convert detail stat to dict if it exists
        if detail_stat:
            detail_dict = {}
            for key, value in vars(detail_stat).items():
                if not key.startswith('_'):
                    # Handle special cases like enums
                    if isinstance(value, enum.Enum):
                        detail_dict[key] = value.value
                    else:
                        detail_dict[key] = value
            stat_response["details"] = detail_dict
        
        response_stats.append(stat_response)
    
    return response_stats


@router.post("/{game_id}/stats", response_model=StatResponse)
async def add_game_stat(game_id: int, stat_request: CreateStatRequest, db: AsyncSession = Depends(get_db)):
    """Add a new stat for a specific game"""
    # First verify the game exists
    game_result = await db.execute(select(Game).where(Game.id == game_id))
    game = game_result.scalars().first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Create the base stat with values from base_stat field
    base_stat_data = stat_request.base_stat
    
    # Convert string action_type to enum value if needed
    action_type = base_stat_data.action_type
    if isinstance(action_type, str):
        # Convert string to uppercase to match enum naming convention
        action_type = ActionType[action_type.upper()]
    
    base_stat = BaseStat(
        game_id=game_id,
        player_id=base_stat_data.player_id,
        action_type=action_type,
        timestamp=datetime.now()
    )
    db.add(base_stat)
    await db.flush()
    
    # Create the detail stat based on action_type
    # Already converted action_type to enum value above
    detail_stat = None
    
    if action_type == ActionType.SERVING and stat_request.serve_stat:
        # Create serve stat
        detail_stat = ServeStat(stat_id=base_stat.id, **stat_request.serve_stat.dict())
        db.add(detail_stat)
        
    elif action_type == ActionType.SERVE_RECEIVE and stat_request.receive_stat:
        # Create receive stat
        detail_stat = ReceiveStat(stat_id=base_stat.id, **stat_request.receive_stat.dict())
        db.add(detail_stat)
        
    elif action_type == ActionType.ATTACK and stat_request.attack_stat:
        # Create attack stat
        detail_stat = AttackStat(stat_id=base_stat.id, **stat_request.attack_stat.dict())
        db.add(detail_stat)
        
    elif action_type == ActionType.BLOCK and stat_request.block_stat:
        # Create block stat
        detail_stat = BlockStat(stat_id=base_stat.id, **stat_request.block_stat.dict())
        db.add(detail_stat)
        
    elif action_type == ActionType.DIG and stat_request.dig_stat:
        # Create dig stat
        detail_stat = DigStat(stat_id=base_stat.id, **stat_request.dig_stat.dict())
        db.add(detail_stat)
        
    elif action_type == ActionType.SET and stat_request.set_stat:
        # Create set stat
        detail_stat = SetStat(stat_id=base_stat.id, **stat_request.set_stat.dict())
        db.add(detail_stat)
    
    await db.commit()
    
    # Return the newly created stat
    # Convert to a format that matches the StatResponse model
    # First refresh the base_stat to get any database-generated values
    await db.refresh(base_stat)
    
    # Create a dict with string properties instead of using the ORM objects directly
    base_dict = {
        "id": base_stat.id,
        "game_id": base_stat.game_id,
        "player_id": base_stat.player_id,
        "action_type": base_stat.action_type.value if hasattr(base_stat.action_type, 'value') else base_stat.action_type,
        "timestamp": base_stat.timestamp.isoformat() if hasattr(base_stat.timestamp, 'isoformat') else base_stat.timestamp
    }
    
    stat_response = {"base": base_dict}
    
    if detail_stat:
        # Convert detail stat to dict so we can manipulate it
        detail_dict = {}
        for key, value in vars(detail_stat).items():
            if not key.startswith('_'):
                # Handle special cases like enums
                if isinstance(value, enum.Enum):
                    detail_dict[key] = value.value
                else:
                    detail_dict[key] = value
        stat_response["details"] = detail_dict
    
    return stat_response


@router.delete("/{game_id}/stats/{stat_id}", response_model=StatResponse)
async def delete_game_stat(game_id: int, stat_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a stat for a specific game"""
    # First verify the game exists
    game_result = await db.execute(select(Game).where(Game.id == game_id))
    game = game_result.scalars().first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get the base stat
    result = await db.execute(
        select(BaseStat).where(and_(BaseStat.game_id == game_id, BaseStat.id == stat_id))
    )
    base_stat = result.scalars().first()
    if base_stat is None:
        raise HTTPException(status_code=404, detail="Stat not found")
    
    # Get the corresponding detail stat based on action_type
    if base_stat.action_type == ActionType.SERVING and base_stat.serve_stat:
        detail_stat = base_stat.serve_stat
        db.delete(detail_stat)
        
    elif base_stat.action_type == ActionType.SERVE_RECEIVE and base_stat.receive_stat:
        detail_stat = base_stat.receive_stat
        db.delete(detail_stat)
        
    elif base_stat.action_type == ActionType.ATTACK and base_stat.attack_stat:
        detail_stat = base_stat.attack_stat
        db.delete(detail_stat)
        
    elif base_stat.action_type == ActionType.BLOCK and base_stat.block_stat:
        detail_stat = base_stat.block_stat
        db.delete(detail_stat)
        
    elif base_stat.action_type == ActionType.DIG and base_stat.dig_stat:
        detail_stat = base_stat.dig_stat
        db.delete(detail_stat)
        
    elif base_stat.action_type == ActionType.SET and base_stat.set_stat:
        detail_stat = base_stat.set_stat
        db.delete(detail_stat)
    
    db.delete(base_stat)
    await db.commit()
    
    # Return the deleted stat
    stat_response = {"base": base_stat, "details": detail_stat}
    return stat_response

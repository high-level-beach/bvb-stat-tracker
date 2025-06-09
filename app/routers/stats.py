from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from typing import List, Optional, Union, Dict, Any

from ..models.database import get_db
from ..models.models import Player, Game, ActionType  # Stat removed (normalized schema)
from ..models.schemas import (







    PlayerGameStats
)

router = APIRouter(
    prefix="/api/stats",
    tags=["stats"],
    responses={404: {"description": "Not found"}},
)

# Helper functions for different stat types
# TODO: Implement stat creation using BaseStat and ServeStat tables (normalized schema)
# async def create_serving_stat(...): ...

# TODO: Implement stat creation using BaseStat and ReceiveStat tables (normalized schema)
# async def create_serve_receive_stat(...): ...

# TODO: Implement stat creation using BaseStat and AttackStat tables (normalized schema)
# async def create_attack_stat(...): ...

# TODO: Implement stat creation using BaseStat and BlockStat tables (normalized schema)
# async def create_block_stat(...): ...

# TODO: Implement stat creation using BaseStat and DigStat tables (normalized schema)
# async def create_dig_stat(...): ...

# TODO: Implement stat creation using BaseStat and SetStat tables (normalized schema)
# async def create_set_stat(...): ...

# API endpoints
# TODO: Implement serving stat endpoint using BaseStat and ServingStat tables (normalized schema)
# @router.post("/serving/", response_model=StatSchema)
# async def add_serving_stat(stat: ServingStatCreate, db: AsyncSession = Depends(get_db)):
#     return await create_serving_stat(stat, db)

# TODO: Implement serve-receive stat endpoint using normalized schema
# @router.post("/serve-receive/", response_model=StatSchema)
# async def add_serve_receive_stat(stat: ServeReceiveStatCreate, db: AsyncSession = Depends(get_db)):
#     return await create_serve_receive_stat(stat, db)

# TODO: Implement attack stat endpoint using normalized schema
# @router.post("/attack/", response_model=StatSchema)
# async def add_attack_stat(stat: AttackStatCreate, db: AsyncSession = Depends(get_db)):
#     return await create_attack_stat(stat, db)

# TODO: Implement block stat endpoint using normalized schema
# @router.post("/block/", response_model=StatSchema)
# async def add_block_stat(stat: BlockStatCreate, db: AsyncSession = Depends(get_db)):
#     return await create_block_stat(stat, db)

# TODO: Implement dig stat endpoint using normalized schema
# @router.post("/dig/", response_model=StatSchema)
# async def add_dig_stat(stat: DigStatCreate, db: AsyncSession = Depends(get_db)):
#     return await create_dig_stat(stat, db)

# TODO: Implement set stat endpoint using normalized schema
# @router.post("/set/", response_model=StatSchema)
# async def add_set_stat(stat: SetStatCreate, db: AsyncSession = Depends(get_db)):
#     return await create_set_stat(stat, db)

# TODO: Implement game stats endpoint using normalized schema (BaseStat + detail tables)
# @router.get("/game/{game_id}", response_model=List[StatResponse])
# async def get_game_stats(
#    game_id: int, 
#    player_id: Optional[int] = None, 
#    action_type: Optional[ActionType] = None,
#    db: AsyncSession = Depends(get_db)
# ):
#    # Use BaseStat and detail tables for query
#    pass
# Rest of function commented out - to be reimplemented with normalized schema

# TODO: Implement player stats endpoint using BaseStat and detail tables
# @router.get("/player/{player_id}", response_model=List[StatResponse])
# async def get_player_stats(
#     player_id: int, 
#     game_id: Optional[int] = None,
#     action_type: Optional[ActionType] = None,
#     db: AsyncSession = Depends(get_db)
# ):
#     # Query BaseStat and join with appropriate detail table based on action_type
#     pass
        
# Rest of function commented out for normalized schema migration

# TODO: Implement player game summary endpoint using normalized schema (BaseStat + detail tables)
# @router.get("/summary/player/{player_id}/game/{game_id}", response_model=Dict[str, Any])
# async def get_player_game_summary(player_id: int, game_id: int, db: AsyncSession = Depends(get_db)):
#     # Query using BaseStat and detail tables to build a comprehensive summary
#     pass
# Rest of function removed for schema migration

# TODO: Implement delete stat endpoint using BaseStat and detail tables
# @router.delete("/{stat_id}", response_model=StatResponse)
# async def delete_stat(stat_id: int, db: AsyncSession = Depends(get_db)):
#     # Implement deletion of BaseStat and corresponding detail stat
#     pass

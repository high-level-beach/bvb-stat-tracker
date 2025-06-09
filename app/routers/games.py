from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..models.database import get_db
from ..models.models import Game
from ..models.schemas import Game as GameSchema
from ..models.schemas import GameCreate

router = APIRouter(
    prefix="/api/games",
    tags=["games"],
    responses={404: {"description": "Not found"}},
)

import json

@router.post("/", response_model=GameSchema)
async def create_game(game: GameCreate, db: AsyncSession = Depends(get_db)):
    db_game = Game(
        date=game.date,
        team1=json.dumps(game.team1),
        team2=json.dumps(game.team2)
    )
    db.add(db_game)
    await db.commit()
    await db.refresh(db_game)
    # Return with team1/team2 as lists
    return GameSchema(
        id=db_game.id,
        date=db_game.date,
        team1=json.loads(db_game.team1),
        team2=json.loads(db_game.team2)
    )

@router.get("/", response_model=List[GameSchema])
async def read_games(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game).order_by(Game.date.desc()))
    games = result.scalars().all()
    # Parse JSON fields for each game
    return [
        GameSchema(
            id=g.id,
            date=g.date,
            team1=json.loads(g.team1),
            team2=json.loads(g.team2)
        ) for g in games
    ]

@router.get("/{game_id}", response_model=GameSchema)
async def read_game(game_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game).where(Game.id == game_id))
    db_game = result.scalars().first()
    if db_game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return GameSchema(
        id=db_game.id,
        date=db_game.date,
        team1=json.loads(db_game.team1),
        team2=json.loads(db_game.team2)
    )

@router.delete("/{game_id}", response_model=GameSchema)
async def delete_game(game_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Game).where(Game.id == game_id))
    db_game = result.scalars().first()
    if db_game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    await db.delete(db_game)
    await db.commit()
    return db_game

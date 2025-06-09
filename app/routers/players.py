from fastapi import APIRouter, Depends, HTTPException, status, Request, File, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from sqlalchemy import Integer

from ..models.database import get_db
from ..models.models import Player
from ..models.schemas import Player as PlayerSchema
from ..models.schemas import PlayerCreate

router = APIRouter(
    prefix="/api/players",
    tags=["players"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=PlayerSchema)
async def create_player(player: PlayerCreate, db: AsyncSession = Depends(get_db)):
    # Check if player with same name already exists
    result = await db.execute(select(Player).where(Player.name == player.name))
    existing_player = result.scalars().first()
    if existing_player is not None:
        raise HTTPException(status_code=400, detail="Player with this name already exists")
    
    db_player = Player(name=player.name)
    db.add(db_player)
    await db.commit()
    await db.refresh(db_player)
    return db_player

@router.get("/", response_model=List[PlayerSchema])
async def read_players(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).order_by(Player.name))
    players = result.scalars().all()
    return players

from fastapi import Response
from sqlalchemy import func, select as sa_select, case
from ..models.models import ActionType

@router.get("/summary")
async def player_summaries(db: AsyncSession = Depends(get_db)):
    # Get basic stats per player
    result = await db.execute(
        sa_select(
            Player.id,
            Player.name
            # TODO: Add stat summary fields from new normalized schema
        )
        .group_by(Player.id)
        .order_by(Player.name)
    )
    rows = result.all()
    # TODO: Add games_played, total_kills, total_aces from normalized schema
    return [
        {
            'id': r.id,
            'name': r.name
        } for r in rows
    ]

@router.get("/{player_id}", response_model=PlayerSchema)
async def read_player(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    db_player = result.scalars().first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return db_player

@router.get("/{player_id}/stats")
async def player_stats(player_id: int, db: AsyncSession = Depends(get_db)):
    # TODO: Rewrite player_stats endpoint for new normalized schema
    stats = []
    if not stats:
        return {"categories": {}}
    # Organize by action type
    categories = {
        "serving": {},
        "serve_receive": {},
        "attack": {},
        "block": {},
        "dig": {},
        "set": {}
    }
    # Count stats by category
    # TODO: Process stats from new normalized tables
    for st in stats:
        if st.action_type == ActionType.SERVING:
            cat = categories["serving"]
            cat["total_serves"] = cat.get("total_serves", 0) + 1
            if st.is_missed_serve: cat["missed_serves"] = cat.get("missed_serves", 0) + 1
            if st.is_ace: cat["aces"] = cat.get("aces", 0) + 1
        elif st.action_type == ActionType.SERVE_RECEIVE:
            cat = categories["serve_receive"]
            cat["total_receives"] = cat.get("total_receives", 0) + 1
            if st.is_good_pass: cat["good_passes"] = cat.get("good_passes", 0) + 1
            if st.is_receive_error: cat["receive_errors"] = cat.get("receive_errors", 0) + 1
        elif st.action_type == ActionType.ATTACK:
            cat = categories["attack"]
            cat["total_attacks"] = cat.get("total_attacks", 0) + 1
            if st.is_kill: cat["kills"] = cat.get("kills", 0) + 1
            if st.is_attack_error: cat["attack_errors"] = cat.get("attack_errors", 0) + 1
            if st.is_blocked: cat["blocked"] = cat.get("blocked", 0) + 1
            if st.attack_direction:
                key = f"direction_{st.attack_direction.value}"
                cat[key] = cat.get(key, 0) + 1
            if st.attack_type:
                key = f"type_{st.attack_type.value}"
                cat[key] = cat.get(key, 0) + 1
        elif st.action_type == ActionType.BLOCK:
            cat = categories["block"]
            cat["total_blocks"] = cat.get("total_blocks", 0) + 1
            if st.is_stuff_block: cat["stuff_blocks"] = cat.get("stuff_blocks", 0) + 1
            if st.is_soft_touch: cat["soft_touches"] = cat.get("soft_touches", 0) + 1
        elif st.action_type == ActionType.DIG:
            cat = categories["dig"]
            cat["total_digs"] = cat.get("total_digs", 0) + 1
            if st.is_successful_dig: cat["successful_digs"] = cat.get("successful_digs", 0) + 1
            if st.dig_led_to_kill: cat["dig_led_to_kill"] = cat.get("dig_led_to_kill", 0) + 1
        elif st.action_type == ActionType.SET:
            cat = categories["set"]
            cat["total_sets"] = cat.get("total_sets", 0) + 1
            if st.is_set_error: cat["set_errors"] = cat.get("set_errors", 0) + 1
            if st.is_killable_set: cat["killable_sets"] = cat.get("killable_sets", 0) + 1
    # Remove empty categories
    categories = {k: v for k, v in categories.items() if v}
    return {"categories": categories}

from fastapi import status

@router.patch("/{player_id}")
async def update_player(player_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    # Allow name/image_url change
    name = data.get('name', '').strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    # Check name uniqueness
    result = await db.execute(select(Player).where(Player.name == name, Player.id != player_id))
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Player name already exists")
    result = await db.execute(select(Player).where(Player.id == player_id))
    db_player = result.scalars().first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    db_player.name = name
    db.add(db_player)
    await db.commit()
    await db.refresh(db_player)
    return {"success": True}

@router.delete("/{player_id}")
async def delete_player(player_id: int, db: AsyncSession = Depends(get_db)):
    # Only allow delete if player has no stats
    result = await db.execute(select(Player).where(Player.id == player_id))
    db_player = result.scalars().first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    # Check for stats
    # TODO: Check for player stats in new normalized tables before allowing delete
    # Example: check BaseStat for player_id
    # stat_result = await db.execute(select(BaseStat).where(BaseStat.player_id == player_id))
    # if stat_result.scalars().first():
    #     raise HTTPException(status_code=409, detail="Cannot delete player in use (has stats)")
    await db.delete(db_player)
    await db.commit()
    return {"success": True}

@router.delete("/{player_id}", response_model=PlayerSchema)
async def delete_player(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    db_player = result.scalars().first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    await db.delete(db_player)
    await db.commit()
    return db_player

from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
import os

from .models.database import get_db, async_engine, Base
from .routers import players, games, stats, game_stats

# Create FastAPI app
app = FastAPI(
    title="Beach Volleyball Stats Tracker",
    description="Track detailed stats for beach volleyball games",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(games.router)
app.include_router(players.router)
app.include_router(stats.router)
app.include_router(game_stats.router)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Configure templates
templates = Jinja2Templates(directory="app/templates")

# On startup, create database tables
@app.on_event("startup")
async def on_startup():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/", response_class=HTMLResponse)
async def serve_home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/players", response_class=HTMLResponse)
async def serve_players(request: Request):
    return templates.TemplateResponse("players.html", {"request": request})

@app.get("/players/{player_id}", response_class=HTMLResponse)
async def serve_player_detail(request: Request, player_id: int):
    return templates.TemplateResponse("player_detail.html", {"request": request})

@app.get("/tracking", response_class=HTMLResponse)
async def track_options_page(request: Request):
    return templates.TemplateResponse("track_options.html", {"request": request})

@app.get("/tracking/create", response_class=HTMLResponse)
async def create_tracking_page(request: Request):
    return templates.TemplateResponse("create_tracking.html", {"request": request})

@app.get("/tracking/{game_id}", response_class=HTMLResponse)
async def track_game_page(request: Request, game_id: int):
    return templates.TemplateResponse("track_game.html", {"request": request, "game_id": game_id})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

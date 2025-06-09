#!/usr/bin/env python3
import os
import sys
import json
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import async_engine, AsyncSessionLocal
from models.models import Base, Game, Player, BaseStat
from models.models import ServeStat, ReceiveStat, AttackStat, BlockStat, DigStat, SetStat
from datetime import date

async def reset_db():
    """Drop all tables if they exist and recreate them"""
    print("Dropping all tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("Creating tables for new schema...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database schema reset successfully!")

async def main():
    """Main function to initialize the database"""
    print("Initializing database...")
    
    # Reset database schema
    await reset_db()
    
    print("Database initialization complete!")

if __name__ == "__main__":
    asyncio.run(main())

import sys
import os
from pathlib import Path

# Get the current file's directory and find the backend
current_dir = Path(__file__).parent.absolute()
backend_dir = current_dir.parent / 'backend'

# Add backend to Python path
sys.path.insert(0, str(backend_dir))

# Change to backend directory for relative imports to work
original_cwd = os.getcwd()
os.chdir(str(backend_dir))

try:
    # Import the FastAPI app
    from main import app
except ImportError as e:
    # Fallback: create a simple FastAPI app if import fails
    from fastapi import FastAPI
    app = FastAPI(title="PDF Insights Platform", description="API for PDF analysis and insights")
    
    @app.get("/")
    async def root():
        return {"message": "PDF Insights Platform API", "status": "running"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "version": "1.0.0"}

# Restore original working directory
os.chdir(original_cwd)

# This is the ASGI application that Vercel will use

import sys
import os
from pathlib import Path

# For Vercel serverless functions
def handler(request):
    # Set up paths
    current_dir = Path(__file__).parent.absolute()
    project_root = current_dir.parent
    backend_dir = project_root / 'backend'
    
    # Add backend to path
    sys.path.insert(0, str(backend_dir))
    
    # Import FastAPI app
    try:
        # Change to backend directory
        original_cwd = os.getcwd()
        os.chdir(str(backend_dir))
        
        from main import app
        
        # Restore directory
        os.chdir(original_cwd)
        
        return app
    except Exception as e:
        # Fallback app
        from fastapi import FastAPI
        fallback_app = FastAPI(title="PDF Insights API")
        
        @fallback_app.get("/")
        async def root():
            return {"message": "PDF Insights API", "error": str(e)}
            
        @fallback_app.get("/health")
        async def health():
            return {"status": "healthy", "fallback": True}
        
        return fallback_app

# Get the app instance
app = handler(None)

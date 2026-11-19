"""
Thefirstresponse360 / Golden Hour Backend Entrypoint
"""
import sys
from pathlib import Path

# Setup paths
root_path = Path(__file__).resolve().parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    print("Starting Thefirstresponse360 Backend on http://0.0.0.0:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

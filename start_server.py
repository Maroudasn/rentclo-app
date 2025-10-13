import os
import sys

# Change to backend directory
backend_dir = r"C:\Users\30693\Downloads\rentclo-app\backend"
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Now start uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
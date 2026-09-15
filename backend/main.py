from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1 import attempts, children, students, teacher

app = FastAPI(
    title="Shineworld API",
    description="Backend API service for Shineworld student tracing and evaluation",
    version="0.1.0"
)

# Allow frontend requests (Vite runs on port 5173 or 3000 by default)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers from v1 API
app.include_router(attempts.router, prefix="/api/v1")
app.include_router(children.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(teacher.router, prefix="/api/v1")

@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "ok", "service": "shineworld-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
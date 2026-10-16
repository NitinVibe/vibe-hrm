import sys
from pathlib import Path

# Resolve root and backend directories safely across different execution contexts (Vercel lambda /var/task, local, etc.)
current_file = Path(__file__).resolve()
current_dir = current_file.parent
repo_root = current_dir.parent

candidate_backend_dirs = [
    repo_root / "backend",
    current_dir / "backend",
    Path.cwd() / "backend",
    repo_root,
    Path.cwd(),
]

for candidate in candidate_backend_dirs:
    if candidate.exists() and (candidate / "app").exists():
        candidate_str = str(candidate)
        if candidate_str not in sys.path:
            sys.path.insert(0, candidate_str)
        break

from app.main import app  # noqa: E402

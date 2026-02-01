"""Worker entrypoint: python -m app.workers [worker options]"""

import sys

from app.workers.celery_app import app

if __name__ == "__main__":
    argv = ["worker", "-l", "info"] + sys.argv[1:]
    app.worker_main(argv)

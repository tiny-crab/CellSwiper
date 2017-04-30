#!/usr/bin/env bash
find $1 -type d | python -c "import sys; import json; dirs = [d for d in sys.stdin]; del dirs[0]; sys.stdout.write(json.dumps({'folders': dirs}))" > "$2/scripts/folders.json"

#!/usr/bin/env bash
find $1 -type d | python -c "import sys; import json; dirs = [d[:-1] + '/' for d in sys.stdin]; del dirs[0]; sys.stdout.write(json.dumps({'folders': dirs}) + '\n')" > "$2/scripts/folders.json"

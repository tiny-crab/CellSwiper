find . -type d | python -c "import sys; import json; dirs = [d[2:-1] + '/' for d in sys.stdin]; del dirs[0]; sys.stdout.write(json.dumps({'folders': dirs}))" > scripts/folders.json 

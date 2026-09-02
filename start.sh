#!/bin/zsh
cd "$(dirname "$0")"
echo "BMS5002 學習站：http://127.0.0.1:8877/"
exec python3 -m http.server 8877

#!/bin/sh
nginx -g 'daemon off;' &
sleep 0.5
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx failed to start" >&2
    exit 1
fi
exec node /app/src/cobalt

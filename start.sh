#!/bin/sh
set -eu

runtime_config_path="/var/www/html/runtime-config.js"
custom_logo_url="null"
custom_logo_path=""

for candidate in \
    /custom/logo \
    /custom/logo.png \
    /custom/logo.jpg \
    /custom/logo.jpeg \
    /custom/logo.webp \
    /custom/logo.gif \
    /custom/logo.svg
do
    if [ -f "$candidate" ]; then
        custom_logo_path="$candidate"
        break
    fi
done

if [ -n "$custom_logo_path" ]; then
    filename=$(basename "$custom_logo_path")
    extension=""

    case "$filename" in
        *.*) extension=".${filename##*.}" ;;
    esac

    target_path="/var/www/html/custom-logo${extension}"
    cp "$custom_logo_path" "$target_path"
    custom_logo_url="'/custom-logo${extension}'"
    echo "loaded custom logo from $custom_logo_path"
fi

printf "window.__COBALT_RUNTIME_CONFIG__ = Object.freeze({ customLogoPath: %s });\n" "$custom_logo_url" > "$runtime_config_path"

nginx -g 'daemon off;' &
sleep 0.5
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx failed to start" >&2
    exit 1
fi
exec node /app/src/cobalt

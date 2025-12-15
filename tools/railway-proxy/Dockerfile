FROM alpine:latest
RUN apk add --no-cache socat
EXPOSE 5432

# Use a wrapper script to validate and sanitize environment variables
COPY <<EOF /entrypoint.sh
#!/bin/sh
set -e

# Validate PGHOST (alphanumeric, dots, hyphens only)
if ! echo "\$PGHOST" | grep -qE '^[a-zA-Z0-9.-]+$'; then
  echo "Error: Invalid PGHOST format" >&2
  exit 1
fi

# Validate PGPORT (numeric only)
if ! echo "\$PGPORT" | grep -qE '^[0-9]+$'; then
  echo "Error: Invalid PGPORT format" >&2
  exit 1
fi

exec socat TCP-LISTEN:5432,fork,reuseaddr "TCP:\$PGHOST:\$PGPORT"
EOF

RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

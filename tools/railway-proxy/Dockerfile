FROM alpine:latest
RUN apk add --no-cache socat
EXPOSE 5432
CMD ["sh", "-c", "socat TCP-LISTEN:5432,fork,reuseaddr TCP:${PGHOST}:${PGPORT}"]

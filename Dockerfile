FROM ghcr.io/supabase/edge-runtime:v1.40.0

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.source=https://github.com/ajayvignesh01/tradeloop-functions
LABEL org.opencontainers.image.description="TradeLoop Server Docker Image"

COPY ./functions /home/deno/functions
CMD [ "start", "--main-service", "/home/deno/functions/main" ]

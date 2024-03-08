FROM ghcr.io/supabase/edge-runtime:v1.40.0

LABEL org.opencontainers.image.source=https://github.com/ajayvignesh01/tradeloop-functions

COPY ./functions /home/deno/functions
CMD [ "start", "--main-service", "/home/deno/functions/main" ]

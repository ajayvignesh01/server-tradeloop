# Tradeloop Edge Functions

## Docker

- Clone this repository: `git clone --depth 1 https://github.com/ajayvignesh01/tradeloop-functions`
- Copy your edge functions to `./functions` directory.
- Build the container image: `docker compose up --build -d`
- Setup Cloudflare Tunnel using: `docker run -d --network host cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoiMmI3ZWU4YTVlYjMwNDI1ZDg2MzA2MWM4OTUwMjk3YjIiLCJ0IjoiYWQ3YzllNmUtMWRkNC00MTMwLThiNDctY2ExZjgzZjI5MDg4IiwicyI6Ik56TXdZVFZpWTJZdE5HVTVNUzAwTXpsaExUa3lPRFl0T1dNeFkyUTNNVFV3T0RGaiJ9`

File changes in the `/functions` directory will automatically be detected, except for the `/main/index.ts` function as it is a long running server.

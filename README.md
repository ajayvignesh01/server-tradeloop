# Tradeloop Edge Functions

## Docker

- Clone this repository: `git clone --depth 1 https://github.com/ajayvignesh01/tradeloop-functions`
- Copy your edge functions to `./functions` directory.
- Build the container image: `docker compose up --build -d`
- Setup Cloudflare Tunnel using: `docker run -d --network host cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoiMmI3ZWU4YTVlYjMwNDI1ZDg2MzA2MWM4OTUwMjk3YjIiLCJ0IjoiYWQ3YzllNmUtMWRkNC00MTMwLThiNDctY2ExZjgzZjI5MDg4IiwicyI6Ik56TXdZVFZpWTJZdE5HVTVNUzAwTXpsaExUa3lPRFl0T1dNeFkyUTNNVFV3T0RGaiJ9`

File changes in the `/functions` directory will automatically be detected, except for the `/main/index.ts` function as it is a long running server.

## Auto Deploy
### Authenticate Git Client on VPS
1. Generate a new SSH key pair on your VPS
    - SSH into your server as the relevant user
    - Run `ssh-keygen -t ed25519 -C "your_email@example.com"` to generate a new SSH key pair.
    - Accept the default file location `~/.ssh/id_ed25519` and leave the passphrase empty (just press Enter).
2. Add the SSH public key to your GitHub account:
    - Copy the contents of the `~/.ssh/id_ed25519.pub` file on your VPS.
    - In your GitHub account, go to Settings > SSH and GPG keys and click on New SSH key.
    - Provide a title for the key (e.g., "VPS Server") and paste the public key contents in the "Key" field.
3. Add GitHub host key on your VPS
    - On your VPS server, run the following command to fetch the host key of github.com `ssh-keyscan -H github.com`.
    - Open the `~/.ssh/known_hosts` file on your VPS server, and add the host keys.
    - Run `ssh -T git@github.com` to check, it should outout `Hi your_username! You've successfully authenticated, but GitHub does not provide shell access`

### Authenticate VPS SSH on GitHub
1. Set up SSH Key for Authentication
    - Generate a new SSH key pair on your local machine `ssh-keygen -t ed25519 -C "your_email@example.com"`.
    - Accept the default file location `~/.ssh/id_ed25519` and leave the passphrase empty (just press Enter).
    - Copy the public key (id_ed25519.pub) to your VPS server by appending it to the authorized_keys file in the ~/.ssh directory of the relevant user.
2. Store the SSH Private Key as a GitHub Secret
    - In your GitHub repository, go to Settings > Secrets > Actions and click on New repository secret.
    - Name the secret SSH_PRIVATE_KEY and paste the contents of the private key file (id_ed25519) as the value.
    - We will use this in our GitHub Action to authenticate and connect to our VPS server through SSH.
3. Obtain VPS SSH Host Key
    - Run  `ssh-keyscan -H [your.server.domain]` on your local machine.
    - Add the host keys to a new secret in your GitHub repository settings (e.g., SSH_KNOWN_HOSTS).
    - We will use this to tell our GitHub Action that the VPS server is a known host and we can securely connect to it.

### Create Github Action
- Edit the `/.github/workflows/deploy.yml` file according to your needs
#!/usr/bin/env bash

set -e

source /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    echo "This script works only on Ubuntu or Debian."
    exit 1
fi

# Update the package list and install tools used below.
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

echo "What would you like to install?"

read -r -p "Install Nginx? (y/n): " install_nginx
read -r -p "Install Docker? (y/n): " install_docker

# Install the latest stable Nginx from the official repository.
if [[ "$install_nginx" == "y" ]]; then
    sudo mkdir -p /usr/share/keyrings
    curl -fsSL https://nginx.org/keys/nginx_signing.key \
        | sudo gpg --dearmor --yes -o /usr/share/keyrings/nginx-keyring.gpg
    sudo chmod 0644 /usr/share/keyrings/nginx-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/nginx-keyring.gpg] https://nginx.org/packages/$ID ${VERSION_CODENAME:-$VERSION} nginx" \
        | sudo tee /etc/apt/sources.list.d/nginx.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y nginx certbot python3-certbot-nginx
    sudo systemctl enable --now nginx
fi

# Install the latest stable Docker Engine and Docker Compose plugin.
if [[ "$install_docker" == "y" ]]; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$ID/gpg \
        | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
    sudo chmod 0644 /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$ID ${VERSION_CODENAME:-$VERSION} stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable --now docker
    if ! getent group docker >/dev/null; then
        sudo groupadd docker
    fi
    sudo usermod -aG docker "$USER"
    echo "Log out and back in before using Docker without sudo."
fi
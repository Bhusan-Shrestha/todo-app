#!/usr/bin/env bash

set -e

source /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
	echo "This script works only on Ubuntu or Debian."
	exit 1
fi

# Install tools needed to add the PostgreSQL repository.
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# The PostgreSQL community repository provides the latest stable version.
sudo mkdir -p /usr/share/keyrings
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
	| sudo gpg --dearmor --yes -o /usr/share/keyrings/postgresql-keyring.gpg
sudo chmod 0644 /usr/share/keyrings/postgresql-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME:-$VERSION}-pgdg main" \
	| sudo tee /etc/apt/sources.list.d/postgresql.list >/dev/null

sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

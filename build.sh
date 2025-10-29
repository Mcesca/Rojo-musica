#!/usr/bin/env bash
set -o errexit

# Forçar uso de Python 3.11 manualmente
echo "---- Instalando Python 3.11 manualmente ----"
sudo apt-get update -y
sudo apt-get install -y python3.11 python3.11-venv python3.11-distutils

# Criar ambiente virtual manualmente com 3.11
python3.11 -m venv .venv
source .venv/bin/activate

echo "---- Atualizando pip e setuptools ----"
pip install --upgrade pip setuptools wheel
pip install "setuptools<75"

echo "---- Instalando dependências do projeto ----"
pip install Pillow==9.4.0 --only-binary=:all:
pip install -r requirements.txt

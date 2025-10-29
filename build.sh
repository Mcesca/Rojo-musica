#!/usr/bin/env bash
set -o errexit  # Faz o build parar se houver erro

# --- CORREÇÃO DO ERRO Pillow/__version__ ---
pip install --upgrade pip setuptools wheel
pip install "setuptools<75"  # evita bug no build do Pillow
pip install Pillow==9.4.0 --only-binary=:all:
# -------------------------------------------

pip install -r requirements.txt

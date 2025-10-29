#!/usr/bin/env bash
set -o errexit

# O Render já configura o ambiente virtual e a versão do Python (via runtime.txt).
# Não é necessário instalar o Python 3.11 manualmente ou criar o venv.

echo "---- Atualizando pip e setuptools para evitar conflitos de build ----"
# Atualiza o pip e o setuptools para versões que resolvem o problema de build
pip install --upgrade pip setuptools wheel

# O Pillow 9.4.0 é conhecido por ter problemas de build com versões recentes do pip/setuptools.
# Vamos instalá-lo primeiro, forçando o uso de binários pre-compilados para evitar a compilação (que falha).
echo "---- Instalando Pillow 9.4.0 com binários pre-compilados ----"
pip install Pillow==9.4.0 --only-binary :all:

echo "---- Instalando as demais dependências do projeto ----"
# Instala o restante das dependências (Flask e gunicorn)
pip install -r requirements.txt

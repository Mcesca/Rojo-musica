#!/bin/bash
echo "🚀 Iniciando build com Python 3.11..."

# Instala Python 3.11
apt-get update && apt-get install -y python3.11 python3.11-venv python3.11-dev

# Cria e ativa o ambiente virtual
python3.11 -m venv venv
source venv/bin/activate

# Atualiza pip e instala dependências
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build finalizado com sucesso!"

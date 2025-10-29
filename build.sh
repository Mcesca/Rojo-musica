#!/bin/bash
echo "🚀 Instalando Python 3.11 e dependências..."

# Instala Python 3.11 manualmente
apt-get update && apt-get install -y python3.11 python3.11-venv python3.11-dev

# Usa o Python 3.11
python3.11 -m venv venv
source venv/bin/activate

echo "📦 Instalando dependências..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📁 Criando estrutura de pastas..."
mkdir -p data/audio data/covers static/images static/scripts templates

cat > data/audio/INSTRUCOES.txt << EOF
COMO ADICIONAR MÚSICAS:

1. Após o deploy, faça upload de arquivos MP3 para esta pasta
2. Formato: "Artista - Nome da Música.mp3"
3. Exemplo: "Billie Eilish - bad guy.mp3"

As músicas serão organizadas automaticamente por artista!
EOF

echo "✅ Build concluído com sucesso!"

#!/bin/bash
echo "🚀 Instalando dependências do ROJO Music Player..."
pip install -r requirements.txt

echo "📁 Criando estrutura de pastas..."
mkdir -p data/audio data/covers static/images static/scripts templates

echo "🎵 Configurando pasta de músicas..."
# Criar arquivo de instruções
cat > data/audio/INSTRUCOES.txt << EOF
COMO ADICIONAR MÚSICAS:

1. Após o deploy, faça upload de arquivos MP3 para esta pasta
2. Formato: "Artista - Nome da Música.mp3"
3. Exemplo: "Billie Eilish - bad guy.mp3"

As músicas serão organizadas automaticamente por artista!
EOF

echo "✅ Build concluído com sucesso!"
echo "🎵 Adicione suas músicas MP3 após o deploy!"
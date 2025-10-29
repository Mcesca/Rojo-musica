#!/bin/bash
echo "🚀 Iniciando build do ROJO Music Player..."
pip install -r requirements.txt
mkdir -p data/audio data/covers static/images static/scripts templates
echo "✅ Build concluído com sucesso!"

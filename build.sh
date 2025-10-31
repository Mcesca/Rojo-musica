services:
  - type: web
    name: rojo-music
    env: python
    # Atualiza pip/setuptools, instala Pillow separadamente (forçando binários) e depois instala o restante do requirements.txt
    buildCommand: pip install --upgrade pip setuptools wheel && pip install Pillow==10.3.0 --only-binary :all: && pip install -r requirements.txt
    startCommand: gunicorn app:app

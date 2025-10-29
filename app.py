from flask import Flask, render_template, jsonify, send_from_directory, request
import os
import glob
import shutil
import mimetypes
from PIL import Image, ImageDraw, ImageFont
import json
from datetime import datetime
import hashlib

app = Flask(__name__)

# ✅ CONFIGURAÇÕES OTIMIZADAS PARA RENDER
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FOLDER = os.path.join(BASE_DIR, 'data')
AUDIO_FOLDER = os.path.join(DATA_FOLDER, 'audio')
IMAGES_FOLDER = os.path.join(app.static_folder, 'images')
COVERS_FOLDER = os.path.join(DATA_FOLDER, 'covers')

# Criar pastas se não existirem
os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(IMAGES_FOLDER, exist_ok=True)
os.makedirs(COVERS_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Arquivo para histórico
HISTORY_FILE = os.path.join(DATA_FOLDER, 'play_history.json')

def load_play_history():
    """Carrega o histórico de reproduções"""
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                history = json.load(f)
                if isinstance(history, list):
                    return history
        return []
    except Exception as e:
        print(f"Erro ao carregar histórico: {e}")
        return []

def save_play_history(history):
    """Salva o histórico de reproduções"""
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history[-100:], f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar histórico: {e}")

def organize_music_by_artist():
    """Organiza as músicas em pastas por artista"""
    print("Organizando músicas por artista...")
    
    audio_extensions = ['*.mp3', '*.wav', '*.ogg', '*.m4a', '*.flac']
    audio_files = []
    
    for ext in audio_extensions:
        audio_files.extend(glob.glob(os.path.join(AUDIO_FOLDER, ext)))
    
    moved_count = 0
    for audio_file in audio_files:
        filename = os.path.basename(audio_file)
        
        if ' - ' in filename:
            artist = filename.split(' - ')[0].strip()
            artist = artist[:50]
            
            artist_folder = os.path.join(AUDIO_FOLDER, artist)
            os.makedirs(artist_folder, exist_ok=True)
            
            destination = os.path.join(artist_folder, filename)
            if not os.path.exists(destination):
                shutil.move(audio_file, destination)
                moved_count += 1
        else:
            print(f'Formato inválido: {filename}')

    print(f"Organização concluída! {moved_count} arquivos movidos.")
    return moved_count

def scan_images_covers():
    """Escaneia a pasta images do projeto para capas"""
    cover_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp']
    covers_found = []
    
    if not os.path.exists(IMAGES_FOLDER):
        return []
    
    for ext in cover_extensions:
        covers_found.extend(glob.glob(os.path.join(IMAGES_FOLDER, ext)))
    
    return covers_found

def generate_color_from_string(text):
    """Gera uma cor única baseada no texto"""
    hash_object = hashlib.md5(text.encode())
    hash_hex = hash_object.hexdigest()[:6]
    
    r = int(hash_hex[0:2], 16) % 128 + 128
    g = int(hash_hex[2:4], 16) % 64
    b = int(hash_hex[4:6], 16) % 64
    
    return (r, g, b)

def find_best_cover_match(artist, title, available_covers):
    """Encontra a melhor capa correspondente para a música"""
    artist_lower = artist.lower()
    title_lower = title.lower()
    
    music_hash = hashlib.md5(f"{artist}_{title}".encode()).hexdigest()[:8]
    
    for cover_path in available_covers:
        cover_name = os.path.basename(cover_path).lower()
        
        title_words = title_lower.split()
        artist_words = artist_lower.split()
        
        for word in title_words + artist_words:
            if len(word) > 3 and word in cover_name:
                return cover_path
    
    if available_covers:
        cover_index = int(music_hash, 16) % len(available_covers)
        return available_covers[cover_index]
    
    return None

def get_cover_for_song(song_path, artist, title):
    """Encontra a capa apropriada para uma música"""
    image_covers = scan_images_covers()
    
    if not image_covers:
        return create_unique_cover(artist, title) or '/static/images/default-cover.png'
    
    best_cover = find_best_cover_match(artist, title, image_covers)
    
    if best_cover:
        return f'/static/images/{os.path.basename(best_cover)}'
    
    generated_cover = create_unique_cover(artist, title)
    if generated_cover:
        return generated_cover
    
    return '/static/images/default-cover.png'

def create_unique_cover(artist, title, size=(300, 300)):
    """Cria uma capa única com gradiente baseado no hash da música"""
    try:
        base_color = generate_color_from_string(f"{artist}_{title}")
        
        img = Image.new('RGB', size, color=base_color)
        draw = ImageDraw.Draw(img)
        
        for y in range(size[1]):
            ratio = y / size[1]
            r = int(base_color[0] * (1 - ratio) + base_color[0] * 0.7 * ratio)
            g = int(base_color[1] * (1 - ratio) + base_color[1] * 0.5 * ratio)
            b = int(base_color[2] * (1 - ratio) + base_color[2] * 0.5 * ratio)
            draw.line([(0, y), (size[0], y)], fill=(r, g, b))
        
        try:
            font_large = ImageFont.truetype("arial.ttf", 24)
            font_small = ImageFont.truetype("arial.ttf", 12)
        except:
            try:
                font_large = ImageFont.load_default()
                font_small = ImageFont.load_default()
            except:
                font_large = None
                font_small = None
        
        artist_text = artist[:15] + "..." if len(artist) > 15 else artist
        title_text = title[:20] + "..." if len(title) > 20 else title
        
        if font_large and font_small:
            try:
                # ✅ CORREÇÃO AQUI - Compatível com Pillow >= 10.0.0
                bbox_artist = draw.textbbox((0, 0), artist_text, font=font_large)
                bbox_title = draw.textbbox((0, 0), title_text, font=font_small)
            except AttributeError:
                # Fallback para versões antigas do Pillow
                bbox_artist = draw.textsize(artist_text, font=font_large)
                bbox_title = draw.textsize(title_text, font=font_small)
                bbox_artist = (0, 0, bbox_artist[0], bbox_artist[1])
                bbox_title = (0, 0, bbox_title[0], bbox_title[1])
            
            artist_width = bbox_artist[2] - bbox_artist[0]
            title_width = bbox_title[2] - bbox_title[0]
            
            artist_x = (size[0] - artist_width) // 2
            title_x = (size[0] - title_width) // 2
            
            total_height = (bbox_artist[3] - bbox_artist[1]) + (bbox_title[3] - bbox_title[1]) + 10
            start_y = (size[1] - total_height) // 2
            
            draw.text((artist_x, start_y), artist_text, fill='white', font=font_large)
            draw.text((title_x, start_y + (bbox_artist[3] - bbox_artist[1]) + 10), title_text, fill='white', font=font_small)
        else:
            draw.text((50, 120), artist_text, fill='white')
            draw.text((50, 150), title_text, fill='white')
        
        cover_hash = hashlib.md5(f"{artist}_{title}".encode()).hexdigest()[:12]
        cover_filename = f"cover_{cover_hash}.png"
        cover_path = os.path.join(COVERS_FOLDER, cover_filename)
        
        img.save(cover_path)
        return f'/static/covers/{cover_filename}'
        
    except Exception as e:
        print(f"Erro ao criar capa única: {e}")
        return None

def list_artists():
    """Lista todos os artistas e quantas músicas têm"""
    artists = []
    
    if os.path.exists(AUDIO_FOLDER):
        for item in os.listdir(AUDIO_FOLDER):
            item_path = os.path.join(AUDIO_FOLDER, item)
            if os.path.isdir(item_path):
                audio_count = 0
                for ext in ['*.mp3', '*.wav', '*.ogg', '*.m4a', '*.flac']:
                    audio_count += len(glob.glob(os.path.join(item_path, ext)))
                artists.append((item, audio_count))
    
    return artists

def scan_audio_files():
    """Escaneia todos os arquivos de áudio e retorna estatísticas"""
    audio_extensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
    all_files = []
    problems = []
    
    if not os.path.exists(AUDIO_FOLDER):
        return [], ["Pasta de audio não existe: " + AUDIO_FOLDER]
    
    for ext in audio_extensions:
        for audio_file in glob.glob(os.path.join(AUDIO_FOLDER, f'**/*.{ext}'), recursive=True):
            file_info = {
                'path': audio_file,
                'filename': os.path.basename(audio_file),
                'extension': ext,
                'size': os.path.getsize(audio_file),
                'exists': True,
                'problems': []
            }
            
            if file_info['size'] == 0:
                file_info['problems'].append("Arquivo vazio (0 bytes)")
                problems.append(f"Arquivo vazio: {audio_file}")
            
            if file_info['size'] < 1024:
                file_info['problems'].append("Arquivo muito pequeno")
                problems.append(f"Arquivo muito pequeno: {audio_file}")
            
            all_files.append(file_info)
    
    return all_files, problems

def get_all_songs():
    songs = []
    audio_extensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
    
    if not os.path.exists(AUDIO_FOLDER):
        return songs
    
    for ext in audio_extensions:
        for audio_file in glob.glob(os.path.join(AUDIO_FOLDER, f'**/*.{ext}'), recursive=True):
            filename = os.path.basename(audio_file)
            file_ext = filename.split('.')[-1].lower()
            
            relative_path = os.path.relpath(audio_file, AUDIO_FOLDER)
            if os.path.dirname(relative_path) != '.':
                artist_folder = os.path.dirname(relative_path)
                artist = os.path.basename(artist_folder)
                if ' - ' in filename:
                    title = ' - '.join(filename.split(' - ')[1:]).replace(f'.{file_ext}', '')
                else:
                    title = filename.replace(f'.{file_ext}', '')
            else:
                parts = filename.replace(f'.{file_ext}', '').split(' - ', 1)
                if len(parts) == 2:
                    artist = parts[0].strip()
                    title = parts[1].strip()
                else:
                    artist = "Desconhecido"
                    title = filename.replace(f'.{file_ext}', '')
            
            url_path = relative_path.replace(os.sep, "/")
            
            mime_types = {
                'mp3': 'audio/mpeg',
                'wav': 'audio/wav',
                'ogg': 'audio/ogg',
                'm4a': 'audio/mp4',
                'flac': 'audio/flac'
            }
            
            mime_type = mime_types.get(file_ext, 'audio/mpeg')
            file_size = os.path.getsize(audio_file)
            is_valid = file_size > 1024
            
            cover_url = get_cover_for_song(audio_file, artist, title)
            
            songs.append({
                'filename': filename,
                'artist': artist,
                'title': title,
                'url': f'/audio/{url_path}',
                'extension': file_ext,
                'mime_type': mime_type,
                'file_size': file_size,
                'file_path': audio_file,
                'is_valid': is_valid,
                'file_exists': os.path.exists(audio_file),
                'cover_url': cover_url,
                'has_custom_cover': cover_url != '/static/images/default-cover.png' and 'default-cover' not in cover_url
            })
    
    songs.sort(key=lambda x: (x['artist'], x['title']))
    return songs

def get_artists_with_songs():
    songs = get_all_songs()
    artists = {}
    
    for song in songs:
        artist_name = song['artist']
        if artist_name not in artists:
            artist_cover = song['cover_url']
            artists[artist_name] = {
                'name': artist_name,
                'song_count': 0,
                'songs': [],
                'cover_url': artist_cover
            }
        artists[artist_name]['songs'].append(song)
        artists[artist_name]['song_count'] = len(artists[artist_name]['songs'])
    
    sorted_artists = sorted(artists.values(), key=lambda x: x['song_count'], reverse=True)
    return sorted_artists

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/artistas')
def artistas():
    return render_template('artistas.html')

@app.route('/historico')
def historico():
    return render_template('historico.html')

@app.route('/mateus')
def mateus():
    """Endpoint principal que retorna todas as músicas e artistas"""
    try:
        scanned_files, problems = scan_audio_files()
        songs = get_all_songs()
        artists = get_artists_with_songs()
        
        custom_covers = len([s for s in songs if s['has_custom_cover']])
        
        return jsonify({
            'status': 'success',
            'songs': songs,
            'artists': artists,
            'total_songs': len(songs),
            'total_artists': len(artists),
            'cover_stats': {
                'total_covers': custom_covers,
                'total_songs': len(songs),
                'cover_percentage': round((custom_covers / len(songs)) * 100, 1) if songs else 0
            },
            'scan_info': {
                'total_files_found': len(scanned_files),
                'problematic_files': len(problems),
                'problems': problems[:10]
            }
        })
    except Exception as e:
        print(f"Erro no endpoint /mateus: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erro interno do servidor: {str(e)}',
            'songs': [],
            'artists': []
        }), 500

@app.route('/historico-data')
def historico_data():
    """Endpoint que retorna o histórico de reproduções"""
    try:
        history = load_play_history()
        return jsonify({
            'status': 'success',
            'history': history,
            'total_plays': len(history)
        })
    except Exception as e:
        print(f"Erro no endpoint /historico-data: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao carregar histórico: {str(e)}',
            'history': []
        }), 500

@app.route('/add-to-history', methods=['POST'])
def add_to_history():
    """Endpoint para adicionar uma música ao histórico"""
    try:
        song_data = request.get_json()
        
        history = load_play_history()
        
        history.insert(0, {
            **song_data,
            'id': len(history) + 1,
            'played_at': datetime.now().isoformat(),
            'timestamp': datetime.now().strftime('%d/%m/%Y %H:%M')
        })
        
        if len(history) > 100:
            history = history[:100]
        
        save_play_history(history)
        
        return jsonify({
            'status': 'success',
            'message': 'Música adicionada ao histórico',
            'history_length': len(history)
        })
    except Exception as e:
        print(f"Erro ao adicionar ao histórico: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao adicionar ao histórico: {str(e)}'
        }), 500

@app.route('/clear-history', methods=['POST'])
def clear_history():
    """Endpoint para limpar o histórico"""
    try:
        save_play_history([])
        return jsonify({
            'status': 'success',
            'message': 'Histórico limpo com sucesso!'
        })
    except Exception as e:
        print(f"Erro ao limpar histórico: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Erro ao limpar histórico: {str(e)}'
        }), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Servir arquivos estáticos"""
    return send_from_directory(app.static_folder, filename)

@app.route('/static/covers/<filename>')
def serve_cover(filename):
    """Servir capas da pasta data/covers"""
    return send_from_directory(COVERS_FOLDER, filename)

@app.route('/audio/<path:filename>')
def serve_audio(filename):
    """Servir arquivos de áudio da pasta data/audio"""
    audio_path = os.path.join(AUDIO_FOLDER, filename)
    
    if not os.path.exists(audio_path):
        return jsonify({'error': 'Arquivo não encontrado'}), 404
    
    response = send_from_directory(AUDIO_FOLDER, filename)
    
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Accept-Ranges', 'bytes')
    response.headers.add('Cache-Control', 'no-cache')
    
    if filename.lower().endswith('.mp3'):
        response.headers.add('Content-Type', 'audio/mpeg')
    elif filename.lower().endswith('.wav'):
        response.headers.add('Content-Type', 'audio/wav')
    elif filename.lower().endswith('.ogg'):
        response.headers.add('Content-Type', 'audio/ogg')
    elif filename.lower().endswith('.m4a'):
        response.headers.add('Content-Type', 'audio/mp4')
    elif filename.lower().endswith('.flac'):
        response.headers.add('Content-Type', 'audio/flac')
    
    return response

@app.route('/diagnostico')
def diagnostico():
    """Rota para diagnóstico do sistema"""
    scan_results, problems = scan_audio_files()
    songs = get_all_songs()
    image_covers = scan_images_covers()
    
    total_files = len(scan_results)
    problematic_files = len(problems)
    valid_songs = len([s for s in songs if s['is_valid']])
    custom_covers_count = len([s for s in songs if s['has_custom_cover']])
    
    extensions = {}
    for file_info in scan_results:
        ext = file_info['extension']
        extensions[ext] = extensions.get(ext, 0) + 1
    
    return jsonify({
        'status': 'success',
        'diagnostico': {
            'pasta_audio': AUDIO_FOLDER,
            'pasta_existe': os.path.exists(AUDIO_FOLDER),
            'pasta_images': IMAGES_FOLDER,
            'capas_images_encontradas': len(image_covers),
            'total_arquivos': total_files,
            'arquivos_problematicos': problematic_files,
            'musicas_validas': valid_songs,
            'extensoes': extensions,
            'capas_personalizadas_usadas': custom_covers_count,
            'porcentagem_capas': round((custom_covers_count / len(songs)) * 100, 1) if songs else 0,
            'problemas': problems[:10],
            'estrutura_pasta': list_artists(),
            'exemplo_musicas': songs[:5] if songs else []
        }
    })

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(app.static_folder, 'images/favicon.ico')

if __name__ == '__main__':
    print("🎵 ROJO Music Server Iniciando...")
    print("=" * 50)
    
    # Garantir que as pastas existam
    os.makedirs(AUDIO_FOLDER, exist_ok=True)
    os.makedirs(COVERS_FOLDER, exist_ok=True)
    os.makedirs(IMAGES_FOLDER, exist_ok=True)
    
    # Criar capa padrão se não existir
    default_cover_path = os.path.join(IMAGES_FOLDER, 'default-cover.png')
    if not os.path.exists(default_cover_path):
        try:
            img = Image.new('RGB', (300, 300), color='#8b0000')
            draw = ImageDraw.Draw(img)
            
            for y in range(300):
                ratio = y / 300
                r = int(230 + (139 - 230) * ratio)
                g = int(57 + (0 - 57) * ratio)
                b = int(70 + (0 - 70) * ratio)
                draw.line([(0, y), (300, y)], fill=(r, g, b))
            
            img.save(default_cover_path)
            print("✅ Capa padrão criada")
        except Exception as e:
            print(f"❌ Não foi possível criar capa padrão: {e}")
    
    # Organizar músicas e carregar dados
    organize_music_by_artist()
    songs = get_all_songs()
    artists = get_artists_with_songs()
    
    print(f"📊 Estatísticas: {len(songs)} músicas de {len(artists)} artistas")
    print("🚀 Servidor pronto!")
    
    # Configurar porta para Render
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
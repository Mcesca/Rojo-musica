// Variáveis globais
let serverUrl = window.location.origin + '/mateus';
let allSongs = [];
let allArtists = [];
let currentSongIndex = 0;
let favorites = JSON.parse(localStorage.getItem('rojoFavorites')) || [];
let isPlaying = false;
let showingFavorites = false;
let playHistory = [];

// Elementos do DOM
const connectBtn = document.getElementById('connect-btn');
const serverInput = document.getElementById('server-input');
const connectContainer = document.getElementById('connect-container');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const audioPlayer = document.getElementById('audio-player');
const fullscreenPlayer = document.getElementById('fullscreen-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const closePlayerBtn = document.getElementById('close-player');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playerFavoriteBtn = document.getElementById('player-favorite-btn');
const playerFormatEl = document.getElementById('player-format');
const playerStatusEl = document.getElementById('player-status');
const showFavoritesBtn = document.getElementById('show-favorites');

// Elementos específicos do histórico
const refreshHistoryBtn = document.getElementById('refresh-history');
const clearHistoryBtn = document.getElementById('clear-history');
const historyList = document.getElementById('history-list');
const emptyHistory = document.getElementById('empty-history');
const historyStats = document.getElementById('history-stats');

// Músicas da Billie Eilish (fixas)
const billieSongs = [
    {
        filename: 'billie_happier_than_ever.mp3',
        artist: 'Billie Eilish',
        title: 'Happier Than Ever',
        extension: 'mp3',
        file_size: 12615680,
        is_valid: true,
        file_exists: true,
        cover_url: '',
        has_custom_cover: false
    },
    {
        filename: 'billie_therefore_i_am.mp3',
        artist: 'Billie Eilish',
        title: 'Therefore I Am',
        extension: 'mp3',
        file_size: 11927552,
        is_valid: true,
        file_exists: true,
        cover_url: '',
        has_custom_cover: false
    },
    {
        filename: 'billie_bad_guy.mp3',
        artist: 'Billie Eilish',
        title: 'bad guy',
        extension: 'mp3',
        file_size: 7618560,
        is_valid: true,
        file_exists: true,
        cover_url: '',
        has_custom_cover: false
    }
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupBillieEilishSongs();
    
    // Auto-conectar ao servidor após 1 segundo
    setTimeout(() => {
        connectToServer();
    }, 1000);
});

function initializeApp() {
    // Navegação
    document.querySelectorAll('.navbar-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            window.location.href = page;
        });
    });

    // Conectar ao servidor
    if (connectBtn) {
        connectBtn.addEventListener('click', connectToServer);
    }

    // Preencher input com URL padrão
    if (serverInput) {
        serverInput.value = serverUrl;
        serverInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                connectToServer();
            }
        });
    }

    // Configurar eventos do player
    setupPlayerEvents();

    // Configurar eventos do histórico (se na página de histórico)
    if (window.location.pathname.includes('historico')) {
        setupHistoryEvents();
        loadHistory();
    }

    // Configurar botão de favoritas
    if (showFavoritesBtn) {
        showFavoritesBtn.addEventListener('click', toggleFavorites);
    }
}

// Configurar músicas da Billie Eilish
function setupBillieEilishSongs() {
    const billieCards = document.querySelectorAll('.music-card[data-artist="Billie Eilish"]');
    
    billieCards.forEach((card, index) => {
        const song = billieSongs[index];
        const favoriteBtn = card.querySelector('.favorite-btn');
        
        // Configurar estado do favorito
        const isFavorite = favorites.includes(song.filename);
        if (isFavorite) {
            favoriteBtn.classList.add('active');
            favoriteBtn.textContent = '❤️';
        }
        
        // Evento de favoritar
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(song.filename, favoriteBtn);
        });
        
        // Evento de reprodução
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('favorite-btn')) {
                playBillieSong(song, index);
            }
        });
    });
}

// Reproduzir música da Billie Eilish
function playBillieSong(song, index) {
    currentSongIndex = index;
    
    // Adicionar ao histórico
    try {
        const historyItem = {
            filename: song.filename,
            title: song.title,
            artist: song.artist,
            cover_url: song.cover_url,
            timestamp: new Date().toLocaleString('pt-BR'),
            played_at: new Date().toISOString()
        };
        
        // Enviar para o servidor para salvar no histórico
        fetch('/add-to-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        }).catch(error => {
            console.error('Erro ao adicionar ao histórico:', error);
        });
        
        // Atualizar localmente para exibição imediata
        playHistory.unshift(historyItem);
        
        // Se estiver na página de histórico, atualizar a exibição
        if (window.location.pathname.includes('historico')) {
            renderHistory(playHistory);
        }
        
    } catch (error) {
        console.error('Erro ao adicionar ao histórico:', error);
    }
    
    // Atualizar interface do player
    document.getElementById('player-title').textContent = song.title;
    document.getElementById('player-artist').textContent = song.artist;
    if (playerFormatEl) {
        playerFormatEl.textContent = `${song.extension.toUpperCase()} • ${formatFileSize(song.file_size)}`;
    }
    
    // Atualizar capa no player
    const playerCover = document.getElementById('player-cover');
    if (playerCover) {
        playerCover.innerHTML = `<div class="default-cover">${song.title}</div>`;
    }
    
    // Mostrar player em tela cheia
    fullscreenPlayer.classList.add('active');
    
    // Atualizar botão de favorito
    updatePlayerFavoriteButton();
    
    // Simular reprodução
    updatePlayerStatus('Música da Billie Eilish - Reprodução simulada');
    
    // Para uma implementação real, você precisaria:
    // audioPlayer.src = 'URL_DA_MUSICA_BILLIE';
    // audioPlayer.play().then(...).catch(...);
}

// Configurar eventos do player
function setupPlayerEvents() {
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', playPrevious);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', playNext);
    }

    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }

    if (playerFavoriteBtn) {
        playerFavoriteBtn.addEventListener('click', toggleCurrentFavorite);
    }

    if (progressContainer) {
        progressContainer.addEventListener('click', seekAudio);
    }

    // Eventos do elemento de áudio
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', playNext);
        audioPlayer.addEventListener('loadedmetadata', updateDuration);
        audioPlayer.addEventListener('error', handleAudioError);
        audioPlayer.addEventListener('canplaythrough', function() {
            updatePlayerStatus('Pronto para reproduzir');
        });
        audioPlayer.addEventListener('loadstart', function() {
            updatePlayerStatus('Carregando...');
        });
        audioPlayer.addEventListener('waiting', function() {
            updatePlayerStatus('Buffering...');
        });
        audioPlayer.addEventListener('playing', function() {
            updatePlayerStatus('Reproduzindo');
        });
    }
}

// Configurar eventos do histórico
function setupHistoryEvents() {
    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', loadHistory);
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
    }
}

// Carregar histórico
async function loadHistory() {
    showLoading('Carregando histórico...');
    
    try {
        const response = await fetch('/historico-data');
        const data = await response.json();
        
        if (data.status === 'success') {
            playHistory = data.history || [];
            renderHistory(playHistory);
            hideLoading();
        } else {
            throw new Error(data.message || 'Erro ao carregar histórico');
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        showError(`Erro ao carregar histórico: ${error.message}`);
        hideLoading();
    }
}

// Renderizar histórico
function renderHistory(history) {
    if (!historyList) return;

    if (history.length === 0) {
        historyList.classList.add('hidden');
        emptyHistory.classList.remove('hidden');
        if (historyStats) historyStats.classList.add('hidden');
        return;
    }

    emptyHistory.classList.add('hidden');
    historyList.classList.remove('hidden');
    if (historyStats) historyStats.classList.remove('hidden');

    // Renderizar lista de histórico
    historyList.innerHTML = '';
    history.forEach((item, index) => {
        const historyItem = createHistoryItem(item, index);
        historyList.appendChild(historyItem);
    });

    // Renderizar estatísticas
    if (historyStats) {
        renderHistoryStats(history);
    }
}

// Criar item do histórico
function createHistoryItem(item, index) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const hasCover = item.cover_url && item.cover_url !== '/static/images/default-cover.png';
    
    div.innerHTML = `
        <div class="history-cover">
            ${hasCover ? 
                `<img src="${item.cover_url}" alt="${item.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="default-cover" style="display: none;">🎵</div>` :
                `<div class="default-cover">🎵</div>`
            }
        </div>
        <div class="history-info">
            <div class="history-title">${item.title}</div>
            <div class="history-artist">${item.artist}</div>
            <div class="history-time">Reproduzido em: ${item.timestamp || 'Data desconhecida'}</div>
        </div>
    `;

    div.addEventListener('click', () => {
        // Verificar se é uma música da Billie Eilish
        if (item.artist === 'Billie Eilish') {
            const billieIndex = billieSongs.findIndex(song => song.filename === item.filename);
            if (billieIndex !== -1) {
                playBillieSong(billieSongs[billieIndex], billieIndex);
                return;
            }
        }
        
        // Caso contrário, procurar na lista completa
        const songIndex = allSongs.findIndex(song => song.filename === item.filename);
        if (songIndex !== -1) {
            playSong(allSongs[songIndex], songIndex);
        } else {
            alert('Música não encontrada na biblioteca atual.');
        }
    });

    return div;
}

// Renderizar estatísticas do histórico
function renderHistoryStats(history) {
    if (!historyStats) return;

    // Calcular estatísticas
    const totalPlays = history.length;
    const uniqueArtists = [...new Set(history.map(item => item.artist))].length;
    const uniqueSongs = [...new Set(history.map(item => item.filename))].length;
    
    // Encontrar artista mais ouvido
    const artistCounts = {};
    history.forEach(item => {
        artistCounts[item.artist] = (artistCounts[item.artist] || 0) + 1;
    });
    const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];

    historyStats.innerHTML = `
        <h3>📊 Estatísticas do Histórico</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${totalPlays}</div>
                <div class="stat-label">Reproduções</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${uniqueArtists}</div>
                <div class="stat-label">Artistas</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${uniqueSongs}</div>
                <div class="stat-label">Músicas</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${topArtist ? topArtist[0] : 'N/A'}</div>
                <div class="stat-label">Artista Favorito</div>
            </div>
        </div>
    `;
}

// Limpar histórico
async function clearHistory() {
    if (!confirm('Tem certeza que deseja limpar todo o histórico de reproduções?')) {
        return;
    }

    try {
        const response = await fetch('/clear-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            showSuccess('Histórico limpo com sucesso!');
            loadHistory();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        showError(`Erro ao limpar histórico: ${error.message}`);
    }
}

// Conectar ao servidor
async function connectToServer() {
    // Usar URL do input se existir, senão usar a padrão
    if (serverInput && serverInput.value.trim()) {
        serverUrl = serverInput.value.trim();
    } else {
        serverUrl = window.location.origin + '/mateus';
    }
    
    if (!serverUrl) {
        showError('Por favor, insira o endereço do servidor.');
        return;
    }

    showLoading('Conectando ao servidor...');
    errorMessage.classList.add('hidden');

    try {
        const response = await fetch(serverUrl);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status === 'success') {
            allSongs = data.songs;
            allArtists = data.artists;
            
            // Filtrar apenas músicas válidas
            const validSongs = allSongs.filter(song => song.is_valid && song.file_exists);
            console.log(`🎵 ${validSongs.length} músicas válidas de ${allSongs.length} totais`);
            
            // Usar apenas músicas válidas
            allSongs = validSongs;
            
            // Ocultar botão de conexão
            if (connectContainer) {
                connectContainer.classList.add('hidden');
            }
            hideLoading();
            
            // Mostrar mensagem de sucesso
            showSuccess(`✅ Conectado! ${data.total_songs} músicas e ${data.total_artists} artistas carregados.`);
            
            // Carregar conteúdo da página
            loadPageContent();
            
        } else {
            throw new Error(data.message || 'Resposta inválida do servidor');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        showError(`❌ Erro ao conectar ao servidor: ${error.message}`);
        hideLoading();
    }
}

function showLoading(message = 'Carregando...') {
    if (loading) {
        loading.textContent = message;
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

function showSuccess(message) {
    // Criar elemento de sucesso temporário
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;
    
    document.body.appendChild(successEl);
    
    setTimeout(() => {
        successEl.remove();
    }, 3000);
}

// Atualizar status do player
function updatePlayerStatus(message) {
    if (playerStatusEl) {
        playerStatusEl.textContent = message;
    }
}

// Construir URL da música
function buildSongUrl(song) {
    // Tentar usar a URL de áudio dedicada primeiro
    if (song.audio_url) {
        const audioUrl = window.location.origin + song.audio_url;
        return audioUrl;
    }
    
    // Fallback para URL estática
    const staticUrl = window.location.origin + song.url;
    return staticUrl;
}

// Carregar conteúdo da página
function loadPageContent() {
    const currentPath = window.location.pathname;
    
    if (currentPath === '/' || currentPath === '/index.html') {
        loadHomePage();
    } else if (currentPath === '/artistas' || currentPath === '/artistas.html') {
        loadArtistsPage();
    } else if (currentPath === '/historico') {
        // Histórico já é carregado automaticamente
        if (allSongs.length > 0) {
            loadHistory();
        }
    }
}

// Carregar página inicial
function loadHomePage() {
    const musicCarousel = document.getElementById('music-carousel');
    
    if (musicCarousel) {
        musicCarousel.classList.remove('hidden');
        renderSongs(allSongs, musicCarousel);
    }
}

// Alternar entre todas as músicas e favoritas
function toggleFavorites() {
    const musicCarousel = document.getElementById('music-carousel');
    
    showingFavorites = !showingFavorites;
    
    if (showingFavorites) {
        const favoriteSongs = allSongs.filter(song => favorites.includes(song.filename));
        // Incluir também as músicas da Billie Eilish que são favoritas
        const billieFavorites = billieSongs.filter(song => favorites.includes(song.filename));
        const allFavoriteSongs = [...favoriteSongs, ...billieFavorites];
        
        renderSongs(allFavoriteSongs, musicCarousel);
        showFavoritesBtn.textContent = '🎵 Todas as Músicas';
        showFavoritesBtn.style.background = 'var(--vermelho)';
    } else {
        renderSongs(allSongs, musicCarousel);
        showFavoritesBtn.textContent = '❤️ Músicas Favoritas';
        showFavoritesBtn.style.background = 'var(--vinho)';
    }
}

// Renderizar músicas
function renderSongs(songs, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (songs.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #aaa; font-size: 18px;">
                🎵 Nenhuma música encontrada
            </div>
        `;
        return;
    }
    
    songs.forEach((song, index) => {
        const card = createMusicCard(song, index);
        container.appendChild(card);
    });
}

// Criar card de música
function createMusicCard(song, index) {
    const card = document.createElement('div');
    card.className = 'music-card';
    
    const isFavorite = favorites.includes(song.filename);
    const isValid = song.is_valid && song.file_exists;
    const hasCustomCover = song.has_custom_cover;
    
    card.innerHTML = `
        <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-filename="${song.filename}">
            ${isFavorite ? '❤️' : '🤍'}
        </button>
        <div class="music-cover">
            ${hasCustomCover ? 
                `<img src="${song.cover_url}" alt="${song.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="default-cover" style="display: none;">🎵</div>
                 <div class="cover-badge">🖼️</div>` :
                `<div class="default-cover">🎵</div>`
            }
        </div>
        <div class="music-info">
            <div class="music-title" title="${song.title}">${song.title}</div>
            <div class="music-artist" title="${song.artist}">${song.artist}</div>
            <div class="music-format">
                ${song.extension.toUpperCase()} • ${formatFileSize(song.file_size)}
                ${!isValid ? ' • ❌ Inválida' : ''}
            </div>
        </div>
    `;
    
    // Evento de clique no card (exceto no botão de favorito)
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('favorite-btn')) {
            if (isValid) {
                playSong(song, index);
            } else {
                alert(`Esta música não é válida:\n\n${song.filename}\n\nVerifique se o arquivo existe e não está corrompido.`);
            }
        }
    });
    
    // Evento de favoritar
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(song.filename, favoriteBtn);
    });
    
    return card;
}

// Formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Alternar favorito
function toggleFavorite(filename, button) {
    const index = favorites.indexOf(filename);
    
    if (index > -1) {
        favorites.splice(index, 1);
        button.classList.remove('active');
        button.textContent = '🤍';
    } else {
        favorites.push(filename);
        button.classList.add('active');
        button.textContent = '❤️';
    }
    
    localStorage.setItem('rojoFavorites', JSON.stringify(favorites));
    updatePlayerFavoriteButton();
}

// Carregar página de artistas
function loadArtistsPage() {
    const artistsGrid = document.getElementById('artists-grid');
    const allSongsCarousel = document.getElementById('all-songs-carousel');
    
    if (artistsGrid) {
        artistsGrid.classList.remove('hidden');
        renderArtists(allArtists, artistsGrid);
    }
    
    if (allSongsCarousel) {
        allSongsCarousel.classList.remove('hidden');
        renderSongs(allSongs, allSongsCarousel);
    }
}

// Renderizar artistas
function renderArtists(artists, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (artists.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #aaa; font-size: 18px;">🎤 Nenhum artista encontrado</div>';
        return;
    }
    
    artists.forEach(artist => {
        const card = createArtistCard(artist);
        container.appendChild(card);
    });
}

// Criar card de artista
function createArtistCard(artist) {
    const card = document.createElement('div');
    card.className = 'artist-card';
    
    const hasCover = artist.cover_url && artist.cover_url !== '/static/images/default-cover.png';
    
    card.innerHTML = `
        <div class="artist-image">
            ${hasCover ? 
                `<img src="${artist.cover_url}" alt="${artist.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="default-cover" style="display: none;">${artist.name.charAt(0).toUpperCase()}</div>` :
                `<div class="default-cover">${artist.name.charAt(0).toUpperCase()}</div>`
            }
        </div>
        <div class="artist-name" title="${artist.name}">${artist.name}</div>
        <div class="artist-song-count">${artist.song_count} música${artist.song_count !== 1 ? 's' : ''}</div>
    `;
    
    card.addEventListener('click', () => {
        showArtistSongs(artist);
    });
    
    return card;
}

// Mostrar músicas do artista
function showArtistSongs(artist) {
    const artistSongsSection = document.getElementById('artist-songs-section');
    const selectedArtistName = document.getElementById('selected-artist-name');
    const artistSongsCarousel = document.getElementById('artist-songs-carousel');
    
    if (artistSongsSection && selectedArtistName && artistSongsCarousel) {
        artistSongsSection.classList.remove('hidden');
        selectedArtistName.textContent = `Músicas de ${artist.name}`;
        renderSongs(artist.songs, artistSongsCarousel);
        
        // Scroll suave até a seção
        artistSongsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Tocar música
async function playSong(song, index) {
    currentSongIndex = index;
    
    const songUrl = buildSongUrl(song);
    
    console.log('🎵 Tocando música:', song.title);
    console.log('🎤 Artista:', song.artist);
    
    // ADICIONAR AO HISTÓRICO
    try {
        const historyItem = {
            filename: song.filename,
            title: song.title,
            artist: song.artist,
            cover_url: song.cover_url,
            timestamp: new Date().toLocaleString('pt-BR'),
            played_at: new Date().toISOString()
        };
        
        // Enviar para o servidor para salvar no histórico
        const historyResponse = await fetch('/add-to-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        });
        
        if (historyResponse.ok) {
            console.log('📝 Música adicionada ao histórico:', song.title);
        }
        
        // Também atualizar localmente para exibição imediata
        playHistory.unshift(historyItem);
        
        // Se estiver na página de histórico, atualizar a exibição
        if (window.location.pathname.includes('historico')) {
            renderHistory(playHistory);
        }
        
    } catch (error) {
        console.error('Erro ao adicionar ao histórico:', error);
    }
    
    // Pausar e resetar o player
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    
    // Limpar fonte anterior
    audioPlayer.src = '';
    
    // Configurar a fonte
    audioPlayer.src = songUrl;
    
    console.log('🎵 Configurando áudio...');
    updatePlayerStatus('Configurando...');
    
    // Atualizar interface do player
    document.getElementById('player-title').textContent = song.title;
    document.getElementById('player-artist').textContent = song.artist;
    if (playerFormatEl) {
        playerFormatEl.textContent = `${song.extension.toUpperCase()} • ${formatFileSize(song.file_size)}`;
    }
    
    // Atualizar capa no player
    const playerCover = document.getElementById('player-cover');
    if (playerCover) {
        if (song.has_custom_cover) {
            playerCover.innerHTML = `
                <img src="${song.cover_url}" alt="${song.title}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="default-cover" style="display: none;">🎵</div>
            `;
        } else {
            playerCover.innerHTML = '<div class="default-cover">🎵</div>';
        }
    }
    
    // Mostrar player em tela cheia
    fullscreenPlayer.classList.add('active');
    
    // Atualizar botão de favorito
    updatePlayerFavoriteButton();
    
    // Tentar reproduzir após carregamento
    audioPlayer.load();
    
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('✅ Música começou a tocar!');
            isPlaying = true;
            playPauseBtn.textContent = '⏸';
            updatePlayerStatus('Reproduzindo');
            
        }).catch(error => {
            console.error('❌ Erro ao reproduzir música:', error);
            handlePlaybackError(song, error);
        });
    }
}

// Função para tratar erros de reprodução
function handlePlaybackError(song, error) {
    console.error('❌ Falha na reprodução:', error);
    
    let errorMessage = `Não foi possível reproduzir: "${song.title}".\n\n`;
    errorMessage += `Artista: ${song.artist}\n`;
    errorMessage += `Formato: ${song.extension.toUpperCase()}\n`;
    errorMessage += `Tamanho: ${formatFileSize(song.file_size)}\n\n`;
    
    if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
        errorMessage += 'Dica: Tente usar um navegador diferente ou verifique as permissões de áudio.';
    } else if (error.name === 'NetworkError') {
        errorMessage += 'Erro de rede. Verifique sua conexão.';
    } else {
        errorMessage += `Erro: ${error.message}`;
    }
    
    alert(errorMessage);
    updatePlayerStatus('Erro na reprodução');
}

// Atualizar botão de favorito do player
function updatePlayerFavoriteButton() {
    if (allSongs.length > 0 && currentSongIndex < allSongs.length) {
        const currentSong = allSongs[currentSongIndex];
        const isFavorite = favorites.includes(currentSong.filename);
        
        if (playerFavoriteBtn) {
            playerFavoriteBtn.classList.toggle('active', isFavorite);
            playerFavoriteBtn.textContent = isFavorite ? '❤️' : '🤍';
        }
    }
}

// Controles do player
function togglePlayPause() {
    if (isPlaying) {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶';
        isPlaying = false;
        updatePlayerStatus('Pausado');
    } else {
        audioPlayer.play().then(() => {
            playPauseBtn.textContent = '⏸';
            isPlaying = true;
            updatePlayerStatus('Reproduzindo');
        }).catch(error => {
            console.error('Erro ao retomar:', error);
            updatePlayerStatus('Erro ao retomar');
        });
    }
}

function playPrevious() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
        playSong(allSongs[currentSongIndex], currentSongIndex);
    }
}

function playNext() {
    if (currentSongIndex < allSongs.length - 1) {
        currentSongIndex++;
        playSong(allSongs[currentSongIndex], currentSongIndex);
    } else {
        // Voltar para a primeira música
        currentSongIndex = 0;
        playSong(allSongs[currentSongIndex], currentSongIndex);
    }
}

function closePlayer() {
    fullscreenPlayer.classList.remove('active');
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.textContent = '▶';
    updatePlayerStatus('');
}

function toggleCurrentFavorite() {
    if (allSongs.length > 0 && currentSongIndex < allSongs.length) {
        const currentSong = allSongs[currentSongIndex];
        toggleFavorite(currentSong.filename, playerFavoriteBtn);
    }
}

// Barra de progresso
function updateProgress() {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${progress}%`;
    
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
}

function updateDuration() {
    durationEl.textContent = formatTime(audioPlayer.duration);
}

function seekAudio(e) {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    
    audioPlayer.currentTime = percentage * audioPlayer.duration;
}

// Tratamento de erro de áudio
function handleAudioError(e) {
    console.error('🔴 Erro no elemento de áudio:', e);
    console.error('Código do erro:', audioPlayer.error?.code);
    console.error('Mensagem:', audioPlayer.error?.message);
    
    if (allSongs.length > 0 && currentSongIndex < allSongs.length) {
        const currentSong = allSongs[currentSongIndex];
        console.error('Música atual:', currentSong);
    }
    
    updatePlayerStatus('Erro no áudio');
}

// Formatar tempo
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
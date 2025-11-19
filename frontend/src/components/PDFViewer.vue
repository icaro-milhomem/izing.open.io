<template>
  <div class="pdf-viewer-container">
    <div v-if="loading" class="text-center q-pa-md">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-sm text-caption">Carregando PDF...</div>
    </div>
    <div v-else-if="error" class="text-center q-pa-md text-negative">
      <q-icon name="error" size="3em" />
      <div class="q-mt-sm">{{ error }}</div>
      <q-btn
        flat
        dense
        color="primary"
        label="Tentar novamente"
        @click="loadPDF"
        class="q-mt-sm"
      />
    </div>
    <div v-else class="pdf-viewer-wrapper">
      <div class="pdf-controls q-pa-xs bg-grey-2">
        <q-btn
          flat
          dense
          round
          icon="mdi-chevron-left"
          @click="previousPage"
          :disable="pageNumber <= 1"
          size="sm"
        />
        <span class="q-mx-sm text-caption">
          Página {{ pageNumber }} de {{ numPages }}
        </span>
        <q-btn
          flat
          dense
          round
          icon="mdi-chevron-right"
          @click="nextPage"
          :disable="pageNumber >= numPages"
          size="sm"
        />
        <q-btn
          flat
          dense
          round
          icon="mdi-minus"
          @click="zoomOut"
          size="sm"
          class="q-ml-sm"
        />
        <span class="q-mx-sm text-caption">{{ Math.round(scale * 100) }}%</span>
        <q-btn
          flat
          dense
          round
          icon="mdi-plus"
          @click="zoomIn"
          size="sm"
        />
        <q-btn
          flat
          dense
          round
          icon="mdi-fullscreen"
          @click="toggleFullscreen"
          size="sm"
          class="q-ml-sm"
        />
        <q-btn
          flat
          dense
          round
          icon="mdi-download"
          :href="pdfUrl"
          download
          target="_blank"
          size="sm"
          class="q-ml-sm"
        />
      </div>
      <div class="pdf-canvas-container" ref="canvasContainer">
        <canvas ref="canvas" class="pdf-canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
// Carregar PDF.js via CDN para evitar problemas de compatibilidade com Webpack 4
let pdfjsLib = null

// Função para carregar PDF.js dinamicamente
async function loadPDFJS () {
  if (pdfjsLib) return pdfjsLib

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('window is not defined'))
      return
    }

    // Verificar se já está carregado
    if (window.pdfjsLib) {
      pdfjsLib = window.pdfjsLib
      resolve(pdfjsLib)
      return
    }

    // Carregar script do CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js'
    script.onload = () => {
      // Aguardar um pouco para garantir que o script foi totalmente carregado
      setTimeout(() => {
        // PDF.js versão 2.10.377 expõe como window.pdfjsLib
        // Mas também pode ser window.pdfjs ou apenas pdfjsLib no escopo global
        pdfjsLib = window.pdfjsLib || window.pdfjs

        // Se ainda não encontrou, verificar todas as propriedades do window
        if (!pdfjsLib) {
          const pdfKeys = Object.keys(window).filter(k =>
            k.toLowerCase().includes('pdf') ||
            (window[k] && typeof window[k] === 'object' && window[k].getDocument)
          )

          for (const key of pdfKeys) {
            if (window[key] && typeof window[key].getDocument === 'function') {
              pdfjsLib = window[key]
              break
            }
          }
        }

        if (pdfjsLib && pdfjsLib.getDocument) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js'
          console.log('PDF.js carregado com sucesso')
          resolve(pdfjsLib)
        } else {
          console.error('PDF.js não encontrado no window:', {
            pdfjsLib: window.pdfjsLib,
            pdfjs: window.pdfjs,
            allKeys: Object.keys(window).filter(k => k.toLowerCase().includes('pdf'))
          })
          reject(new Error('PDF.js não foi carregado corretamente. Verifique o console para mais detalhes.'))
        }
      }, 100)
    }
    script.onerror = () => {
      console.error('Erro ao carregar script do PDF.js')
      reject(new Error('Erro ao carregar PDF.js'))
    }
    document.head.appendChild(script)
  })
}

export default {
  name: 'PDFViewer',
  props: {
    src: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: 330
    },
    height: {
      type: Number,
      default: 400
    }
  },
  data () {
    return {
      loading: true,
      error: null,
      pdf: null,
      pageNumber: 1,
      numPages: 0,
      scale: 1.0,
      renderTask: null
    }
  },
  computed: {
    pdfUrl () {
      return this.src
    }
  },
  async mounted () {
    // Aguardar o DOM estar pronto antes de carregar o PDF
    await this.$nextTick()
    // Carregar PDF.js antes de tentar carregar o PDF
    try {
      await loadPDFJS()
      // Aguardar mais um tick para garantir que o canvas está disponível
      await this.$nextTick()
      this.loadPDF()
    } catch (err) {
      console.error('Erro ao carregar PDF.js:', err)
      this.error = 'Erro ao carregar visualizador de PDF'
      this.loading = false
    }
  },
  watch: {
    src () {
      this.loadPDF()
    },
    pageNumber () {
      this.renderPage()
    },
    scale () {
      this.renderPage()
    }
  },
  methods: {
    async loadPDF () {
      this.loading = true
      this.error = null

      try {
        // Garantir que PDF.js está carregado
        if (!pdfjsLib) {
          pdfjsLib = await loadPDFJS()
        }

        if (!pdfjsLib || !pdfjsLib.getDocument) {
          throw new Error('PDF.js não está disponível')
        }

        console.log('Carregando PDF:', this.src)

        // Cancelar renderização anterior se existir
        if (this.renderTask) {
          this.renderTask.cancel()
        }

        // Tentar carregar PDF diretamente primeiro
        let loadingTask
        try {
          loadingTask = pdfjsLib.getDocument({
            url: this.src,
            withCredentials: false,
            httpHeaders: {}
          })
          this.pdf = await loadingTask.promise
        } catch (corsError) {
          // Se falhar por CORS, tentar baixar via blob
          console.warn('Erro de CORS ao carregar PDF diretamente, tentando via blob:', corsError)
          try {
            const response = await fetch(this.src, {
              method: 'GET',
              credentials: 'omit'
            })

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)

            loadingTask = pdfjsLib.getDocument({
              url: blobUrl,
              withCredentials: false
            })

            this.pdf = await loadingTask.promise
            console.log('PDF carregado via blob com sucesso')
          } catch (blobError) {
            console.error('Erro ao carregar PDF via blob:', blobError)
            throw corsError // Lança o erro original
          }
        }
        this.numPages = this.pdf.numPages
        this.pageNumber = 1
        this.scale = 1.0

        console.log('PDF carregado com sucesso:', {
          numPages: this.numPages,
          src: this.src
        })

        // Marcar como não loading primeiro para que o canvas apareça no DOM
        this.loading = false
        // Aguardar o DOM atualizar antes de renderizar
        await this.$nextTick()
        await this.renderPage()
      } catch (err) {
        console.error('Erro ao carregar PDF:', err)
        let errorMessage = 'Erro ao carregar PDF. Verifique se o arquivo está acessível.'

        if (err.message) {
          errorMessage = `Erro: ${err.message}`
        } else if (err.name === 'InvalidPDFException') {
          errorMessage = 'Arquivo PDF inválido ou corrompido.'
        } else if (err.name === 'MissingPDFException') {
          errorMessage = 'PDF não encontrado. Verifique a URL.'
        } else if (err.name === 'UnexpectedResponseException') {
          errorMessage = 'Erro ao baixar o PDF. Pode ser um problema de CORS ou rede.'
        }

        this.error = errorMessage
        this.loading = false
      }
    },
    async renderPage () {
      if (!this.pdf) return

      try {
        // Cancelar renderização anterior se existir
        if (this.renderTask) {
          this.renderTask.cancel()
        }

        // Aguardar o DOM estar pronto
        await this.$nextTick()

        // Aguardar até que o canvas esteja disponível (com retry)
        let retries = 0
        const maxRetries = 10
        while (!this.$refs.canvas && retries < maxRetries) {
          await this.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 50))
          retries++
        }

        // Verificar se o canvas está disponível
        if (!this.$refs.canvas) {
          console.error('Canvas não está disponível após múltiplas tentativas')
          this.error = 'Erro ao renderizar PDF: Canvas não encontrado'
          return
        }

        const canvas = this.$refs.canvas
        const page = await this.pdf.getPage(this.pageNumber)
        const viewport = page.getViewport({ scale: this.scale })

        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('Não foi possível obter contexto 2D do canvas')
        }

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        this.renderTask = page.render(renderContext)
        await this.renderTask.promise

        console.log('Página renderizada com sucesso:', this.pageNumber)
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Erro ao renderizar página:', err)
          this.error = `Erro ao renderizar página: ${err.message || 'Erro desconhecido'}`
        }
      }
    },
    previousPage () {
      if (this.pageNumber > 1) {
        this.pageNumber--
      }
    },
    nextPage () {
      if (this.pageNumber < this.numPages) {
        this.pageNumber++
      }
    },
    zoomIn () {
      this.scale = Math.min(this.scale + 0.25, 3.0)
    },
    zoomOut () {
      this.scale = Math.max(this.scale - 0.25, 0.5)
    },
    toggleFullscreen () {
      const container = this.$refs.canvasContainer
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
          console.error('Erro ao entrar em fullscreen:', err)
        })
      } else {
        document.exitFullscreen()
      }
    }
  },
  beforeDestroy () {
    // Cancelar renderização ao destruir componente
    if (this.renderTask) {
      this.renderTask.cancel()
    }
  }
}
</script>

<style scoped>
.pdf-viewer-container {
  width: 100%;
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.pdf-viewer-wrapper {
  display: flex;
  flex-direction: column;
}

.pdf-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #ddd;
}

.pdf-canvas-container {
  overflow: auto;
  max-height: 400px;
  display: flex;
  justify-content: center;
  background: #525252;
  padding: 10px;
}

.pdf-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>

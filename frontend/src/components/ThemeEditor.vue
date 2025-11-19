<template>
  <div class="theme-editor">
    <q-item-label
      header
      class="text-bold text-h6 q-mb-md"
    >
      Personalização de Tema
    </q-item-label>
    <q-item-label
      caption
      class="q-mb-md"
    >
      Personalize as cores do sistema conforme sua preferência
    </q-item-label>

    <q-separator spaced />

    <!-- Cor Primária -->
    <q-item class="q-pa-md">
      <q-item-section>
        <q-item-label class="text-weight-medium">Cor Primária</q-item-label>
        <q-item-label caption>Cor principal usada em botões e elementos destacados</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center q-gutter-sm">
          <q-input
            v-model="themeColors.primary"
            type="color"
            dense
            outlined
            style="width: 80px"
            @input="updateTheme"
          />
          <q-input
            v-model="themeColors.primary"
            dense
            outlined
            style="width: 120px"
            @input="updateTheme"
          />
        </div>
      </q-item-section>
    </q-item>

    <!-- Cor Secundária -->
    <q-item class="q-pa-md">
      <q-item-section>
        <q-item-label class="text-weight-medium">Cor Secundária</q-item-label>
        <q-item-label caption>Cor de fundo e elementos secundários</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center q-gutter-sm">
          <q-input
            v-model="themeColors.secondary"
            type="color"
            dense
            outlined
            style="width: 80px"
            @input="updateTheme"
          />
          <q-input
            v-model="themeColors.secondary"
            dense
            outlined
            style="width: 120px"
            @input="updateTheme"
          />
        </div>
      </q-item-section>
    </q-item>

    <!-- Cor de Destaque -->
    <q-item class="q-pa-md">
      <q-item-section>
        <q-item-label class="text-weight-medium">Cor de Destaque</q-item-label>
        <q-item-label caption>Cor para elementos de destaque e acentos</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center q-gutter-sm">
          <q-input
            v-model="themeColors.accent"
            type="color"
            dense
            outlined
            style="width: 80px"
            @input="updateTheme"
          />
          <q-input
            v-model="themeColors.accent"
            dense
            outlined
            style="width: 120px"
            @input="updateTheme"
          />
        </div>
      </q-item-section>
    </q-item>

    <!-- Preview -->
    <q-card class="q-mt-md q-pa-md" flat bordered>
      <q-item-label class="text-weight-medium q-mb-sm">Preview</q-item-label>
      <div class="row q-gutter-sm">
        <q-btn
          :color="themeColors.primary"
          label="Botão Primário"
          unelevated
        />
        <q-btn
          :color="themeColors.accent"
          label="Botão Destaque"
          outline
        />
        <q-chip
          :color="themeColors.primary"
          text-color="white"
          label="Chip"
        />
      </div>
    </q-card>

    <!-- Presets -->
    <q-item-label
      header
      class="text-bold q-mt-lg q-mb-sm"
    >
      Temas Pré-definidos
    </q-item-label>
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        v-for="preset in presets"
        :key="preset.name"
        :color="preset.primary"
        outline
        size="sm"
        :label="preset.name"
        @click="applyPreset(preset)"
      />
    </div>

    <!-- Botões de ação -->
    <div class="row q-gutter-sm q-mt-md">
      <q-btn
        label="Salvar Tema"
        color="primary"
        unelevated
        @click="saveTheme"
        :loading="saving"
      />
      <q-btn
        label="Resetar"
        outline
        color="grey-7"
        @click="resetTheme"
      />
    </div>
  </div>
</template>

<script>
import { UpdateConfiguracoesUsuarios } from 'src/service/user'

export default {
  name: 'ThemeEditor',
  data () {
    return {
      saving: false,
      themeColors: {
        primary: '#667eea',
        secondary: '#f0f4ff',
        accent: '#764ba2'
      },
      presets: [
        {
          name: 'Azul',
          primary: '#1976d2',
          secondary: '#e3f2fd',
          accent: '#0d47a1'
        },
        {
          name: 'Roxo',
          primary: '#667eea',
          secondary: '#f0f4ff',
          accent: '#764ba2'
        },
        {
          name: 'Verde',
          primary: '#4caf50',
          secondary: '#e8f5e9',
          accent: '#2e7d32'
        },
        {
          name: 'Laranja',
          primary: '#ff9800',
          secondary: '#fff3e0',
          accent: '#f57c00'
        },
        {
          name: 'Vermelho',
          primary: '#f44336',
          secondary: '#ffebee',
          accent: '#c62828'
        },
        {
          name: 'Rosa',
          primary: '#e91e63',
          secondary: '#fce4ec',
          accent: '#ad1457'
        }
      ]
    }
  },
  mounted () {
    this.loadTheme()
  },
  methods: {
    loadTheme () {
      const usuario = JSON.parse(localStorage.getItem('usuario'))
      if (usuario?.configs?.theme) {
        this.themeColors = { ...usuario.configs.theme }
        this.applyTheme()
      }
    },
    updateTheme () {
      this.applyTheme()
    },
    applyTheme () {
      // Aplicar tema usando CSS variables
      const root = document.documentElement
      root.style.setProperty('--q-primary', this.themeColors.primary)
      root.style.setProperty('--q-secondary', this.themeColors.secondary)
      root.style.setProperty('--q-accent', this.themeColors.accent)

      // Atualizar Quasar colors dinamicamente
      if (this.$q.colors && typeof this.$q.colors.setBrand === 'function') {
        this.$q.colors.setBrand('primary', this.themeColors.primary)
        this.$q.colors.setBrand('secondary', this.themeColors.secondary)
        this.$q.colors.setBrand('accent', this.themeColors.accent)
      }
    },
    applyPreset (preset) {
      this.themeColors = { ...preset }
      this.updateTheme()
    },
    async saveTheme () {
      this.saving = true
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario'))
        const configs = {
          ...usuario.configs,
          theme: { ...this.themeColors }
        }

        await UpdateConfiguracoesUsuarios(usuario.userId, configs)
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, configs }))

        this.$q.notify({
          type: 'positive',
          message: 'Tema salvo com sucesso!',
          position: 'top',
          timeout: 2000
        })
      } catch (error) {
        console.error('Erro ao salvar tema:', error)
        this.$q.notify({
          type: 'negative',
          message: 'Erro ao salvar tema',
          position: 'top'
        })
      } finally {
        this.saving = false
      }
    },
    resetTheme () {
      this.$q.dialog({
        title: 'Resetar Tema',
        message: 'Deseja resetar o tema para os valores padrão?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.themeColors = {
          primary: '#667eea',
          secondary: '#f0f4ff',
          accent: '#764ba2'
        }
        this.updateTheme()
        this.saveTheme()
      })
    }
  }
}
</script>

<style lang="sass" scoped>
.theme-editor
  padding: 16px
</style>

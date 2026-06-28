<template>
  <q-dialog :value="abrirModalQR"
    @hide="fecharModalQrModal"
    persistent>
    <q-card style="bg-white">
      <q-card-section>
        <div class="text-h6 text-primary">
          {{ isPairingCode ? 'Código de pareamento' : 'Leia o QrCode para iniciar a sessão' }}
          <q-btn round
            class="q-ml-md"
            color="negative"
            icon="mdi-close"
            @click="fecharModalQrModal" />
        </div>
      </q-card-section>
      <q-card-section class="text-center"
        :style="$q.dark.isActive ? 'background: white !important' : ''">
        <div v-if="isPairingCode && cQrcode" class="q-pa-md">
          <div class="text-h3 text-weight-bold text-primary q-mb-md" style="letter-spacing: 6px">
            {{ cQrcode }}
          </div>
          <div class="text-body2 text-left q-mt-md">
            No celular: WhatsApp → Aparelhos conectados → Conectar com número de telefone → digite o código acima.
          </div>
        </div>
        <QrcodeVue v-else-if="cQrcode"
          :value="cQrcode"
          :size="300"
          level="H" />
        <span v-else>
          Aguardando o código de pareamento...
        </span>
      </q-card-section>
      <q-card-section>
        <div class="row">Caso tenha problema, solicite um novo código </div>
        <div class="row col-12 justify-center">
          <q-btn color="primary"
            glossy
            ripple
            outline
            label="Novo código"
            @click="solicitarQrCode"
            icon="watch_later" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<script>

import QrcodeVue from 'qrcode.vue'

export default {
  name: 'ModalQrCode',
  components: {
    QrcodeVue
  },
  props: {
    abrirModalQR: {
      type: Boolean,
      default: false
    },
    channel: {
      type: Object,
      default: () => ({
        id: null,
        qrcode: ''
      })
    }
  },
  watch: {
    channel: {
      handler (v) {
        if (this.channel.status === 'CONNECTED') {
          this.fecharModalQrModal()
        }
      },
      deep: true
    }
  },
  computed: {
    cQrcode () {
      return this.channel.qrcode
    },
    isPairingCode () {
      const code = this.cQrcode
      return code && code.length <= 12 && !String(code).includes(',')
    }
  },
  methods: {
    solicitarQrCode () {
      this.$emit('gerar-novo-qrcode', this.channel)
      this.fecharModalQrModal()
    },
    fecharModalQrModal () {
      this.$emit('update:abrirModalQR', false)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>

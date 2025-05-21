<template>
  <div>
    <q-select
      borderless
      dense
      rounded
      v-model="usuario.status"
      :options="statusOptions"
      map-options
      emit-value
      @input="updateStatus"
    >
      <template v-slot:selected>
        <div class="row full-width justify-center">
          <q-chip
            color="grey-3"
            text-color="primary"
            class="q-my-none q-ml-sm q-mr-none q-py-md"
          >
            <q-avatar
              :color="cStatus.color"
              text-color="white"
              size="40px"
              :icon="cStatus.icon"
              rounded
            />
            {{ cStatus.label }}
          </q-chip>
        </div>
      </template>

    </q-select>

  </div>

</template>

<script>
import { AtualizarStatusUsuario } from '../service/usuarios'
export default {
  name: 'cUserStatus',
  props: {
    usuario: {
      type: Object,
      default: () => { }
    }
  },
  computed: {
    cStatus () {
      const usuario = this.usuario
      return this.statusOptions.find(s => s.value == usuario.status) || {}
    }
  },
  data () {
    return {
      status: {},
      statusOptions: [
        { label: 'Online', value: 'online', icon: 'mdi-account-check', color: 'positive' },
        { label: 'Offline', value: 'offline', icon: 'mdi-account-off', color: 'negative' }
      ]
    }
  },
  methods: {
    async updateStatus (status) {
      try {
        await AtualizarStatusUsuario(status)
        const usuarioAtual = JSON.parse(localStorage.getItem('usuario')) || {}
        const usuario = {
          ...usuarioAtual,
          ...this.usuario,
          status,
          id: usuarioAtual.id || this.usuario.id,
          name: usuarioAtual.name || this.usuario.name,
          email: usuarioAtual.email || this.usuario.email,
          profile: usuarioAtual.profile || this.usuario.profile,
          tenantId: usuarioAtual.tenantId || this.usuario.tenantId
        }
        localStorage.setItem('usuario', JSON.stringify(usuario))
        this.$emit('update:usuario', usuario)
        console.log('usuario', usuario)
      } catch (err) {
        this.$q.notify({
          type: 'negative',
          message: 'Erro ao atualizar status no servidor!'
        })
      }
    }
  }
}
</script>

<style>
</style>

<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'App',
  data () {
    return {
      IDLE_TIMEOUT: 5, // seconds
      idleSecondsCounter: 0

    }
  },
  methods: {
    CheckIdleTime () {
      this.idleSecondsCounter++
      // var oPanel = document.getElementById('SecondsUntilExpire')
      // if (oPanel) { oPanel.innerHTML = (this.IDLE_TIMEOUT - this.idleSecondsCounter) + '' }
      if (this.idleSecondsCounter >= this.IDLE_TIMEOUT) {
        alert('Time expired!')
        // document.location.href = 'logout.html'
      }
    }
  },
  beforeMount () {
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    if (usuario?.configs?.isDark) {
      this.$q.dark.set(usuario?.configs?.isDark)
    }
    // Aplicar tema personalizado
    if (usuario?.configs?.theme) {
      const root = document.documentElement
      root.style.setProperty('--q-primary', usuario.configs.theme.primary)
      root.style.setProperty('--q-secondary', usuario.configs.theme.secondary)
      root.style.setProperty('--q-accent', usuario.configs.theme.accent)
      if (this.$q.colors && this.$q.colors.setBrand) {
        this.$q.colors.setBrand('primary', usuario.configs.theme.primary)
        this.$q.colors.setBrand('secondary', usuario.configs.theme.secondary)
        this.$q.colors.setBrand('accent', usuario.configs.theme.accent)
      }
    }
    //   document.onclick = function () {
    //     this.idleSecondsCounter = 0
    //   }
    //   document.onmousemove = function () {
    //     this.idleSecondsCounter = 0
    //   }
    //   document.onkeypress = function () {
    //     this.idleSecondsCounter = 0
    //   }
    //   window.setInterval(this.CheckIdleTime, 1000)
  }

}
</script>

<template>
  <div class="text-caption text-center q-pa-sm versao-sistema">
    Versão Sistema:
    <q-badge align="middle"
      color="primary">
      v{{ cVersion }}
    </q-badge>
  </div>
</template>
<script>
import packageEnv from 'src/../package.json'
export default {
  name: 'SystemVersion',
  computed: {
    cVersion () {
      return packageEnv.version
    }
  }
}
</script>
<style>
.versao-sistema {
  color: #222 !important;
}
body.body--dark .versao-sistema {
  color: #fff !important;
}
</style>

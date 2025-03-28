<template>
  <q-item
    clickable
    v-ripple
    :active="routeName == cRouterName"
    active-class="menu-link-active-item-top"
    @click=" () => !(routeName == cRouterName) ? $router.push({ name: routeName }) : ''"
    class="menu-item"
    :class="{'text-negative': color === 'negative'}"
  >
    <q-item-section
      v-if="icon"
      avatar
      class="icon-section"
    >
      <q-icon
        :name="color === 'negative' ? 'mdi-cellphone-nfc-off' : icon"
        :class="{'icon-active': routeName == cRouterName}"
        :color="itemColor"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  name: 'EssentialLink',
  data () {
    return {
      menuAtivo: 'dashboard'
    }
  },
  props: {
    title: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: ''
    },
    routeName: {
      type: String,
      default: 'dashboard'
    },
    icon: {
      type: String,
      default: ''
    }
  },
  computed: {
    cRouterName () {
      return this.$route.name
    },
    itemColor () {
      if (this.color === 'negative') return 'negative'
      return this.color || 'primary'
    }
  }
}
</script>

<style lang="sass">
.menu-item
  transition: all 0.3s ease
  margin: 4px 8px
  border-radius: 8px
  &:hover
    background: rgba(21, 120, 173, 0.1)
    .icon-section
      transform: scale(1.1)
      .q-icon
        transform: rotate(5deg)

.icon-section
  transition: all 0.3s ease
  .q-icon
    transition: all 0.3s ease
    font-size: 24px
    &.icon-active
      transform: scale(1.1) rotate(5deg)

.menu-link-active-item-top
  background: rgba(21, 120, 173, 0.1)
  border-left: 3px solid rgb(21, 120, 173)
  border-right: 3px solid rgb(21, 120, 173)
  border-top-right-radius: 20px
  border-bottom-right-radius: 20px
  position: relative
  height: 100%
</style>

<template>
  <q-layout class="brick-classic-layout">
    <q-page-container>
      <div class="brick-pattern"></div>
      <div class="tetris-game">
        <div v-for="(piece, index) in tetrisPieces" :key="index" class="tetris-piece" :class="piece.color">
          <div v-for="(row, rowIndex) in piece.shape" :key="rowIndex" class="piece-row">
            <div v-for="(cell, cellIndex) in row" :key="cellIndex"
              class="piece-block"
              v-if="cell === 1"
              :style="{
                animationDelay: `${index * 0.5}s`,
                left: `${piece.x + cellIndex * 30}px`,
                top: `${piece.y + rowIndex * 30}px`
              }">
              <div class="piece-inner"></div>
            </div>
          </div>
        </div>
      </div>
      <q-page class="login-page flex flex-center">
        <div class="login-container">
          <div class="login-box">
            <div class="logo-container">
              <q-img
                src="/logo_izing.png"
                spinner-color="primary"
                style="width: 300px; height: auto"
                class="q-mb-lg q-px-md"
              />
              <div class="logo-text">Izing</div>
            </div>

            <q-form @submit="fazerLogin" class="q-gutter-md">
              <q-input
                v-model="form.email"
                label="Email"
                :rules="[val => !!val || 'Email é obrigatório']"
                outlined
                class="input-field"
                @blur="$v.form.email.$touch"
                :error="$v.form.email.$error"
                error-message="Deve ser um e-mail válido."
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-email" color="primary" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                label="Senha"
                :type="isPwd ? 'password' : 'text'"
                :rules="[val => !!val || 'Senha é obrigatória']"
                outlined
                class="input-field"
                @blur="$v.form.password.$touch"
                :error="$v.form.password.$error"
                error-message="Senha é obrigatória"
              >
                <template v-slot:prepend>
                  <q-icon name="mdi-lock" color="primary" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'mdi-eye-off' : 'mdi-eye'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                    color="primary"
                  />
                </template>
              </q-input>

              <div>
                <q-btn
                  label="Entrar"
                  type="submit"
                  color="primary"
                  class="full-width login-button"
                  :loading="loading"
                />
              </div>
            </q-form>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'

export default {
  name: 'Login',
  data () {
    return {
      form: {
        email: null,
        password: null
      },
      isPwd: true,
      loading: false,
      tetrisPieces: [
        {
          shape: [[1, 1, 1], [0, 1, 0]],
          color: 'red',
          x: 50,
          y: -60
        },
        {
          shape: [[1, 1], [1, 1]],
          color: 'green',
          x: 150,
          y: -120
        },
        {
          shape: [[1, 1, 1], [1, 0, 0]],
          color: 'yellow',
          x: 250,
          y: -180
        },
        {
          shape: [[1, 1, 0], [0, 1, 1]],
          color: 'blue',
          x: 350,
          y: -240
        },
        {
          shape: [[1, 1], [0, 1], [0, 1]],
          color: 'purple',
          x: 450,
          y: -300
        }
      ]
    }
  },
  mounted () {
    this.startTetrisAnimation()
  },
  validations: {
    form: {
      email: { required, email },
      password: { required }
    }
  },
  methods: {
    startTetrisAnimation () {
      setInterval(() => {
        this.tetrisPieces.forEach(piece => {
          if (piece.y < window.innerHeight - 150) {
            piece.y += 2
          } else {
            piece.y = -60
          }
        })
      }, 50)
    },
    fazerLogin () {
      this.$v.form.$touch()
      if (this.$v.form.$error) {
        this.$q.notify('Informe usuário e senha corretamente.')
        return
      }
      this.loading = true
      this.$store.dispatch('UserLogin', this.form)
        .then(data => {
          this.loading = false
        })
        .catch(err => {
          console.error('exStore', err)
          this.loading = false
        })
    },
    getBrickColor (row, col) {
      const index = (row + col) % this.brickColors.length
      return this.brickColors[index]
    }
  }
}
</script>

<style lang="sass">
.brick-classic-layout
  background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)
  min-height: 100vh
  position: relative
  overflow: hidden

.brick-pattern
  position: absolute
  top: 0
  left: 0
  right: 0
  bottom: 0
  background-image: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
  background-size: 20px 20px
  opacity: 0.3

.tetris-game
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  z-index: 1
  overflow: hidden

.tetris-piece
  position: absolute
  transition: all 0.05s linear

.piece-block
  position: absolute
  width: 28px
  height: 28px
  border-radius: 4px
  animation: fallDown 2s linear infinite
  transition: all 0.05s linear

.piece-inner
  width: 100%
  height: 100%
  border-radius: 3px
  box-shadow: inset 0 0 8px rgba(255,255,255,0.5)
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)

.red .piece-block
  background-color: #ff4444
  border: 2px solid #ff6666

.green .piece-block
  background-color: #44ff44
  border: 2px solid #66ff66

.blue .piece-block
  background-color: #4444ff
  border: 2px solid #6666ff

.yellow .piece-block
  background-color: #ffff44
  border: 2px solid #ffff66

.purple .piece-block
  background-color: #9944ff
  border: 2px solid #aa66ff

@keyframes fallDown
  0%
    transform: translateY(-100vh) rotate(0deg)
  100%
    transform: translateY(100vh) rotate(360deg)

.login-page
  position: relative
  z-index: 2
  min-height: 100vh
  display: flex
  align-items: center
  justify-content: center

.login-container
  width: 100%
  max-width: 400px
  padding: 20px

.login-box
  background: rgba(255, 255, 255, 0.95)
  border-radius: 16px
  padding: 40px
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
  backdrop-filter: blur(10px)
  animation: fadeIn 0.5s ease-out
  border: 1px solid rgba(255, 255, 255, 0.2)
  transition: all 0.3s ease
  z-index: 2
  position: relative

.login-box:hover
  transform: translateY(-5px)
  box-shadow: 0 15px 30px rgba(0,0,0,0.1)

.logo-container
  text-align: center
  margin-bottom: 40px
  animation: slideDown 0.5s ease-out

.logo-text
  font-size: 32px
  font-weight: bold
  color: #1a237e
  text-transform: uppercase
  letter-spacing: 2px
  margin-top: 16px

.input-field
  margin-bottom: 20px
  animation: slideIn 0.5s ease-out

.login-button
  height: 48px
  font-size: 16px
  font-weight: bold
  text-transform: uppercase
  letter-spacing: 1px
  border-radius: 24px
  margin-top: 20px
  animation: slideUp 0.5s ease-out

@keyframes fadeIn
  from
    opacity: 0
  to
    opacity: 1

@keyframes slideDown
  from
    transform: translateY(-20px)
    opacity: 0
  to
    transform: translateY(0)
    opacity: 1

@keyframes slideIn
  from
    transform: translateX(-20px)
    opacity: 0
  to
    transform: translateX(0)
    opacity: 1

@keyframes slideUp
  from
    transform: translateY(20px)
    opacity: 0
  to
    transform: translateY(0)
    opacity: 1
</style>

<q-item
  v-for="link in links1"
  :key="link.title"
  :to="link.link"
  clickable
  v-ripple
  :active="link.title === 'Home'"
  @click="navigateTo(link.link)"
  class="menu-item"
>
  <q-item-section avatar>
    <img :src="link.icon" class="menu-icon" alt="icon" />
  </q-item-section>

  <q-item-section>
    {{ link.title }}
  </q-item-section>
</q-item>

<style scoped>
.menu-item {
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 4px 8px;
  overflow: hidden;
}

.menu-item:hover {
  background: rgba(62, 114, 175, 0.1);
  transform: translateX(5px);
}

.menu-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon {
  transform: scale(1.2) rotate(5deg);
  filter: brightness(1.2);
}

.menu-item.active {
  background: rgba(62, 114, 175, 0.15);
}

.menu-item.active .menu-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}
</style> 
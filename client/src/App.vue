<template>
  <div id="nav">
    <router-link to="/">Home</router-link> |
    <!-- <router-link to="/about">About</router-link> | -->
    <router-link to="/messages">Posts</router-link>
  </div>
  <div id="content">
    <router-view/>
  </div>
  <Divider />
  <div id="footer" class="p-mt-4 p-mb-4">
    <i class="pi pi-camera p-mr-1"></i>
    <span style="font-variant: small-caps;">Signs Project</span>
    2020–2021
    ●
    Written by <a href="https://yaskevich.com/" target="_blank" class="p-text-bold">Alyaxey Yaskevich</a>
    with
    <i class="pi pi-thumbs-up" title="kek"></i>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

#content {
  display: flex;
  flex-direction: column;
  min-height: 97vh;
  max-width: 100vh;
  /* max-width: 800px; */
  margin: auto;
}
</style>

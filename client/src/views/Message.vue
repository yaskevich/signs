<template>

  <div>
    hello
  </div>
  <!-- <pre class="p-text-left">
      {{message}}
    </pre> -->
  <!-- style="max-width:720px;" -->
  <div class="p-p-4">
    <img  :src="imgSrc" />
  </div>
  <div class="p-mt-4">
    <Button label="Test" class="p-button-outlined p-button-secondary"  />
  </div>

</template>

<script>

  import { defineComponent, ref, reactive, onBeforeMount, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import router from '../router';
  import axios from 'axios';

  export default defineComponent({
    setup() {
      const vuerouter = useRoute();
      const id = vuerouter.params.id;
      const message = ref({});
      const imgSrc = ref('');

      onMounted(async () => {

      });

      onBeforeMount(async () => {
        console.log('router id', id);
        if (id) {
          const { data } = await axios.get('/api/message', { params: { id: id } });
          imgSrc.value = '/api/media/' + data.imagepath;
          message.value = data;
          console.log(data);
        }
      });


      return { message, imgSrc, };
    },
    components: {},
  });

</script>

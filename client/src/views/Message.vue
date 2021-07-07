<template>

  <!-- style="max-width:720px;" -->
  <div class="p-p-4">
    <img ref="imgRef" :src="imgSrc" />
  </div>
  <!-- <div class="p-mt-4">
        <Button label="Test" class="p-button-outlined p-button-secondary" @click="saveAnnotations" />
      </div> -->

  <Divider></Divider>
  <div class=" p-text-left">
    <div class="p-grid">
      <div class="p-col">
        <div class="p-field">
          <label for="drop">Country</label>
          <Dropdown id="drop"
                    v-model="selectedCity1"
                    :options="cities"
                    optionLabel="name"
                    optionValue="code"
                    placeholder="Select a country"
                    style="display:flex;" />
        </div>

      </div>
      <div class="p-col">
        <div class="p-field">
          <label for="opts">Orientation</label>
          <SelectButton v-model="value2" :options="paymentOptions" optionLabel="name" id="opts" />
        </div>

      </div>
    </div>
    <div class="p-grid">
      <div class="p-col">
        <div class="p-field">
          <label for="username1">Source: title</label>
          <InputText id="username1" type="username" aria-describedby="username1-help" />
          <small id="username1-help">Enter text title of the source</small>
        </div>
      </div>

      <div class="p-col">
        <div class="p-field">
          <label for="username2">Source: URL</label>
          <InputText id="username2" type="username" aria-describedby="username2-help" />
          <small id="username2-help">Put URL (web link) of the source</small>
        </div>
      </div>

    </div>
  </div>
  <Divider></Divider>
  <div style="border:1px dashed red;" class="p-p-2" v-if="message?.data?.message">
    <span v-html="message?.data?.message?.split('\n').join('<br/>')"></span>
  </div>

</template>

<script>

  import { defineComponent, ref, reactive, onBeforeMount, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import router from '../router';
  import axios from 'axios';
  import { Annotorious } from '@recogito/annotorious';
  import '@recogito/annotorious/dist/annotorious.min.css';

  export default defineComponent({
    setup() {
      const vuerouter = useRoute();
      const id = vuerouter.params.id;
      const message = ref({});
      const imgSrc = ref('');
      const imgRef = ref();
      const anno = ref();

      const selectedCity1 = ref();
      const cities = [
        { name: 'Belarus', code: 'BY' },
        { name: 'Poland', code: 'PL' },
        { name: 'Great Britain', code: 'GB' },
        { name: 'Germany', code: 'DE' },
        { name: 'France', code: 'FR' },
      ];

      const paymentOptions = ref([
        { name: 'Basic', value: 1 },
        { name: 'Pro', value: 2 },
      ]);
      // const value2 = ref(paymentOptions.value[1]);
      const value2 = ref();

      onMounted(async () => {
        anno.value = new Annotorious(
          {
            image: imgRef.value,
            // disableEditor: true,
            // allowEmpty: true
          },
          {}
        );
        // Annotorious.TiltedBox(anno.value);
        // console.log(Annotorious);
        anno.value.setDrawingTool('rect');
        // anno.setDrawingTool('annotorious-tilted-box');
        anno.value.clearAuthInfo();

        anno.value
          .on('updateAnnotation', function(annotation, previous) {
            console.log('updateAnnotation');
            saveAnnotations();
          })
          .on('createAnnotation', function(annotation) {
            console.log('createAnnotation');
            saveAnnotations();
          })
          .on('deleteAnnotation', function(annotation) {
            console.log('deleteAnnotation');
            saveAnnotations();
          });
        // .on('createSelection', function(selection) {
        //   console.log("create", selection);
        // })
        // .on('selectAnnotation', function(annotation) {
        //   console.log("selected", annotation);
        // });
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

      const saveAnnotations = () => {
        // const annotations =
        console.log('save anno', anno.value.getAnnotations());
      };
      return { message, imgRef, imgSrc, saveAnnotations, selectedCity1, cities, paymentOptions, value2 };
    },
    components: {},
  });

</script>

<style lang="scss" scoped>

  .p-dropdown {
    width: 14rem;
  }

  .country-item {
    img {
      width: 17px;
      margin-right: 0.5rem;
    }
  }
  .p-field * {
    display: block;
  }

</style>

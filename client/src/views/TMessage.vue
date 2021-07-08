<template>

  <!-- style="max-width:720px;" -->
  <div class="p-p-4">
    <img ref="imgRef" :src="imgSrc" />
  </div>

  <Divider></Divider>

  <div class="p-grid">
    <div class="p-col">
      <Button label="Previous" class="p-button-outlined p-button-secondary" @click="getNeighbor('prev')" />
    </div>
    <div class="p-col">
      <Button label="Save" class="" @click="saveAnnotations" />
    </div>
    <div class="p-col">
      <Button label="Next" class="p-button-outlined p-button-secondary" @click="getNeighbor('next')" />
    </div>
  </div>

  <Message severity="warn" v-for="item of errorMessages" >{{item}}</Message>
  <Message severity="success" v-if="ok">Data are saved succesfully!</Message>

  <Divider></Divider>

  <div class=" p-text-left">
    <div class="p-grid">
      <div class="p-col">
        <div class="p-field">
          <label for="drop">Country</label>
          <Dropdown id="drop"
                    v-model="datum.country"
                    :options="countries"
                    optionLabel="name"
                    optionValue="code"
                    placeholder="Select a country"
                    style="display:flex;" />
        </div>
      </div>
      <div class="p-col">
        <div class="p-field">
          <label for="opts">Orientation</label>
          <SelectButton v-model="orientProp" :options="orientOptions" optionLabel="name" id="opts" />
        </div>
      </div>
    </div>
    <div class="p-grid">
      <div class="p-col">
        <div class="p-field">
          <label for="source-title">Source: title</label>
          <InputText id="source-title" type="username" aria-describedby="source-title-help" v-model="datum.src" />
          <small id="source-title-help">Enter text title of the source</small>
        </div>
      </div>
      <div class="p-col">
        <div class="p-field">
          <label for="source-url">Source: URL</label>
          <InputText id="source-url" type="username" aria-describedby="source-url-help" v-model="datum.url" />
          <small id="source-url-help">Put URL (web link) of the source</small>
        </div>
      </div>
    </div>
  </div>

  <Divider></Divider>

  <div style="border:1px dashed orange;" class="p-p-2" v-if="Object.keys(message).length">
    <span v-html="message.data.message.split('\n').join('<br/>')"></span>
  </div>

</template>

<script>

  import { defineComponent, ref, reactive, onBeforeMount, onMounted, toRaw } from 'vue';
  import { useRoute } from 'vue-router';
  import router from '../router';
  import axios from 'axios';
  import { Annotorious } from '@recogito/annotorious';
  import '@recogito/annotorious/dist/annotorious.min.css';

  export default defineComponent({
    setup() {
      const vuerouter = useRoute();
      const id = ref(Number(vuerouter.params.id));
      const message = ref({});
      const imgSrc = ref('');
      const imgRef = ref();
      const anno = ref();
      const errorMessages = ref([]);
      const ok = ref(false);
      const countries = [
        { name: 'Belarus', code: 'BY' },
        { name: 'Poland', code: 'PL' },
        { name: 'Great Britain', code: 'GB' },
        { name: 'Germany', code: 'DE' },
        { name: 'France', code: 'FR' },
      ];

      const orientOptions = [
        { name: 'Basic', value: 1 },
        { name: 'Pro', value: 2 },
      ];
      const orientProp = ref();
      // const orient = ref(orientOptions.value[1]);

      const datum = reactive({ country: null, src: '', url: '' });

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
            // saveAnnotations();
          })
          .on('createAnnotation', function(annotation) {
            console.log('createAnnotation');
            // saveAnnotations();
          })
          .on('deleteAnnotation', function(annotation) {
            console.log('deleteAnnotation');
            // saveAnnotations();
          });
        // .on('createSelection', function(selection) {
        //   console.log("create", selection);
        // })
        // .on('selectAnnotation', function(annotation) {
        //   console.log("selected", annotation);
        // });
      });

      onBeforeMount(async () => {
        console.log('router id', id.value);
        if (id.value) {
          const { data } = await axios.get('/api/message', { params: { id: id.value } });
          imgSrc.value = window.location.origin + '/api/media/' + data.imagepath;
          message.value = data;
          console.log(data);
          datum.country = data.country;
          datum.src = data.src;
          datum.url = data.url;
          if (data.orient) {
            orientProp.value = orientOptions.filter(x => x.value == data.orient)[0];
          }
          if (data.annotations) {
            for (let annotation of data.annotations) {
              anno.value.addAnnotation(annotation);
            }
          }
        }
      });

      const saveAnnotations = async () => {
        // const annotations =
        const params = { ...toRaw(datum) };
        errorMessages.value = [];
        params.orient = orientProp.value?.value || null;
        params.tg_id = id.value;
        params.annotations = anno.value.getAnnotations();
        console.log('save', params);
        if (!params.country) {
          errorMessages.value.push("Country is not set!");
        }
        if (!params.orient) {
          errorMessages.value.push("Orientation is not set!");
        }
        if (!params.src) {
          errorMessages.value.push("Source title is empty!");
        }
        if (!params.url) {
          errorMessages.value.push("Source URL is empty!");
        }
        if (!params.annotations||(params.annotations && !params.annotations.length)) {
          errorMessages.value.push("No anotation is provided!!!");
        }
        // console.log('save anno', imgSrc.value);
        const { data } = await axios.post('/api/anno', { params: params });
        if (data?.[0]["tg_id"] == id.value) {
          ok.value = true;
        }
        // console.log("result", data);
      };

      const getNeighbor = async path => {
        console.log(path, id.value);
        const { data } = await axios.get('/api/' + path, { params: { id: id.value } });
        imgSrc.value = '/api/media/' + data.imagepath;
        message.value = data;
        id.value = Number(data.tg_id);
        console.log(data);
        router.replace('/message/' + data.tg_id);
        // must be rewritten with router.push ans storing data in state!!!
      };
      return {
        message,
        imgRef,
        imgSrc,
        saveAnnotations,
        countries,
        orientOptions,
        orientProp,
        datum,
        getNeighbor,
        errorMessages,
        ok,
      };
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

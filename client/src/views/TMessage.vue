<template>

  <!-- style="max-width:720px;" -->

  <div class="p-pl-4 p-pr-4">
    <img ref="imgRef" :src="imgSrc" />
  </div>

  <div>
    <SelectButton v-model="drawingTool" :options="[{title:'Rectangle', type: 'rect'}, {title: 'Polygon', type: 'polygon'}]" optionLabel="title" optionValue="type" @click="changeTool" />
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
                    :options="scheme.countries"
                    optionLabel="name"
                    optionValue="code"
                    placeholder="Select a country"
                    style="display:flex;" />
        </div>
      </div>
      <div class="p-col">
        <div class="p-field">
          <label for="opts">Orientation</label>
          <SelectButton v-model="orientProp" :options="scheme.orientation" optionLabel="name" id="opts" optionValue="level"/>
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
      const scheme = reactive({languages:[], features: [], countries:[], orientation: [], });
      const message = ref({});
      const imgSrc = ref('');
      const imgRef = ref();
      const anno = ref();
      const drawingTool = ref('rect');
      const errorMessages = ref([]);
      const ok = ref(false);
      const datum = reactive({ country: '', src: '', url: '' });
      const orientProp = ref();

      onBeforeMount(async () => {
        // console.log('router id', id.value);

        const result = await axios.get('/api/scheme');
        Object.assign(scheme, result.data)
        // console.log("scheme", scheme);

        if (id.value) {
          const { data } = await axios.get('/api/message', { params: { id: id.value } });
          imgSrc.value = window.location.origin + '/api/media/' + data.imagepath;
          message.value = data;
          // console.log(data);
          datum.country = data.country || 'by';
          datum.src = data.src;
          datum.url = data.url;
          if (data.orient) {
            orientProp.value = data.orient;
          }
          if (data.annotations) {
            for (let annotation of data.annotations) {
              anno.value.addAnnotation(annotation);
            }
          }
        }
      });

      onMounted(async () => {
        anno.value = new Annotorious(
          {
            image: imgRef.value,
            widgets: [
              'COMMENT',
              { widget: 'TAG', vocabulary:  [ ...scheme.languages, ...scheme.features] }
            ],
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

      const saveAnnotations = async () => {
        // const annotations =
        const params = { ...toRaw(datum) };
        errorMessages.value = [];
        params.orient = orientProp.value;
        params.tg_id = id.value;
        params.annotations = anno.value.getAnnotations();
        console.log('data to save', params);
        if (!params.country) {
          errorMessages.value.push("Country is not set!");
        }
        if (!params.orient) {
          errorMessages.value.push("Orientation is not set!");
        }
        if (!params.src) {
          errorMessages.value.push("Source title is empty!");
        } else {
          params.src = params.src.trim();
        }
        if (!params.url) {
          errorMessages.value.push("Source URL is empty!");
        } else {
          params.url = params.url.trim();
        }
        if (!params.annotations||(params.annotations && !params.annotations.length)) {
          errorMessages.value.push("No anotation is provided!!!");
        } else {
          for (let annotation of params.annotations) {
            if (annotation.type === "Annotation") {
                const tagsList = annotation.body.filter(x => x.purpose == "tagging");
                if (tagsList.length) {
                    if (!tagsList.map(x => x.value).some(x => scheme.languages.includes(x))){
                        errorMessages.value.push("The annotation does not contain any LANGUAGE tags!");
                    }
                } else {
                  errorMessages.value.push("There are no tags in the annotation!");
                }
            }
          }
        }
        // console.log('save anno', imgSrc.value);
        if (errorMessages.value.length) {
          console.log(`not saved – errors: ${errorMessages.value.length}`);
        } else {
          const { data } = await axios.post('/api/anno', { params: params });
          if (data?.tg_id == id.value) {
            ok.value = true;
          } else {
            console.log("post was not saved!");
          }
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
        errorMessages.value = [];
        ok.value = false;
        router.replace('/message/' + data.tg_id);
        // must be rewritten with router.push ans storing data in state!!!
      };

      const changeTool = () => {
        anno.value.setDrawingTool(drawingTool.value)
      }


      return {
        message,
        imgRef,
        imgSrc,
        saveAnnotations,
        scheme,
        orientProp,
        datum,
        getNeighbor,
        errorMessages,
        ok,
        drawingTool,
        changeTool
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

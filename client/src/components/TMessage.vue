<template>
  <n-space vertical>
    <n-space justify="center">
      <img ref="imgRef" :src="imgSrc" style="max-width: 100%" />
    </n-space>

    <n-space justify="space-around" size="small">
      <!-- <n-button @click="getNext(true)">Previous</n-button> -->
      <n-button @click="getNext(true)" :disabled="!msg?.prev" size="small">
        <template #icon>
          <n-icon :component="ArrowLeft" />
        </template>
      </n-button>
      <n-radio-group v-model:value="drawingTool" name="toolsgroup" @update-value="changeTool" size="small">
        <n-radio-button v-for="item in toolsOptions" :key="item.type" :value="item.type" :label="item.title" />
      </n-radio-group>
      <!-- <n-button @click="getNext()">Next</n-button> -->
      <n-button @click="getNext()" :disabled="!msg?.next" size="small">
        <template #icon>
          <n-icon :component="ArrowRight" />
        </template>
      </n-button>
    </n-space>

    <n-alert title="Errors" type="warning" v-if="errorMessages?.length">
      <div v-for="item of errorMessages">{{ item }}</div>
    </n-alert>
    <!-- <n-divider></n-divider> -->
    <n-card title="Image properties">
      <template #header-extra>
        <n-button @click="saveAnnotations" type="primary">Save</n-button>
      </template>
      <n-form>
        <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
          <n-form-item-gi label="Country">
            <n-select
              v-model:value="datum.country"
              :options="scheme.countries"
              label-field="name"
              value-field="code"
              placeholder="Select a country"
            />
          </n-form-item-gi>
          <n-form-item-gi label="Orientation">
            <n-select
              v-model:value="orientProp"
              :options="scheme.orientation"
              label-field="name"
              value-field="level"
              placeholder="Select an attitude"
            />
          </n-form-item-gi>
          <n-form-item-gi label="Source: title" feedback="Enter text title of the source">
            <n-input v-model:value="datum.src" type="text" placeholder="Source" />
          </n-form-item-gi>
          <n-form-item-gi label="Source: URL" feedback="Put URL (web link) of the source">
            <n-input v-model:value="datum.url" type="text" placeholder="URL" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-card>
  </n-space>

  <!-- <n-divider></n-divider> -->

  <div style="border: 1px dashed orange; margin: 1rem; padding: 5px" v-if="Object.keys(msg).length">
    <span v-html="msg.data.message.split('\n').join('<br/>')"></span>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, onMounted, toRaw } from 'vue';
import { useRoute } from 'vue-router';
import router from '../router';
import axios from 'axios';
import { useMessage } from 'naive-ui';
import { Annotorious } from '@recogito/annotorious';
import '@recogito/annotorious/dist/annotorious.min.css';
import TiltedBoxPlugin from '@recogito/annotorious-tilted-box';
import { ArrowLeft, ArrowRight } from '@vicons/fa';

const toolsOptions = [
  { title: 'Rectangle', type: 'rect' },
  { title: 'Polygon', type: 'polygon' },
  { title: 'Tilted Box', type: 'annotorious-tilted-box' },
];
const message = useMessage();
const vuerouter = useRoute();
const id = ref(Number(vuerouter.params.id));
const scheme = reactive({ languages: [], features: [], countries: [], orientation: [] });
const msg = ref({} as IMessage);
const imgSrc = ref('');
const imgRef = ref();
const anno = ref();
const drawingTool = ref('rect');
const errorMessages = ref([] as Array<string>);
const datum = reactive({ country: '', src: '', url: '' });
const orientProp = ref();

const initAnnotorius = () => {
  const vocabulary = [...scheme.languages, ...scheme.features];
  // console.log(vocabulary);
  anno.value = new Annotorious({
    image: imgRef.value,
    widgets: ['COMMENT', { widget: 'TAG', vocabulary }],
    // disableEditor: true,
    // allowEmpty: true
  });
  TiltedBoxPlugin(anno.value);
  // anno.value.setDrawingTool('rect');
  anno.value.clearAuthInfo();
  // anno.value
  //   .on('updateAnnotation', function (annotation, previous) {
  //     console.log('updateAnnotation');
  //     // saveAnnotations();
  //   })
  //   .on('createAnnotation', function (annotation:any) {
  //     console.log('createAnnotation');
  //     // saveAnnotations();
  //   })
  //   .on('deleteAnnotation', function (annotation:any) {
  //     console.log('deleteAnnotation');
  //     // saveAnnotations();
  //   })
  // .on('createSelection', function(selection:any) {
  //   console.log("create", selection);
  // })
  // .on('selectAnnotation', function (annotation:any) {
  //   console.log('selected', annotation);
  // })
  // .on('createSelection', function (selection:any) {
  //   console.log('create selection', selection);
  //   // The user has created a new shape...
  // });
};

// onBeforeMount(async () => {
// });

onMounted(async () => {
  const result = await axios.get('/api/scheme');
  Object.assign(scheme, result.data);
  initAnnotorius();
  if (id.value) {
    const { data } = await axios.get('/api/message', { params: { id: id.value } });
    imgSrc.value = window.location.origin + '/api/media/downloaded/' + data.imagepath;
    msg.value = data;
    // console.log(data);
    datum.country = data.country || 'by';
    datum.src = data.src;
    datum.url = data.url;
    if (data.orient) {
      orientProp.value = data.orient;
    }
    if (data.annotations) {
      for (let annotation of data.annotations) {
        // console.log(annotation);
        anno.value.addAnnotation(annotation);
      }
    }
  }
});

const saveAnnotations = async () => {
  // const annotations =
  const params = { ...toRaw(datum) } as IMessage;
  errorMessages.value = [];
  params.orient = orientProp.value;
  params.tg_id = id.value;
  params.annotations = anno.value.getAnnotations();
  console.log('data to save', params);
  if (!params.country) {
    errorMessages.value.push('Country is not set!');
  }
  if (!params.orient) {
    errorMessages.value.push('Orientation is not set!');
  }
  // if (!params.src) {
  //   errorMessages.value.push("Source title is empty!");
  // } else {
  //   params.src = params.src.trim();
  // }
  // if (!params.url) {
  //   errorMessages.value.push("Source URL is empty!");
  // } else {
  //   params.url = params.url.trim();
  // }
  if (!params.annotations || (params.annotations && !params.annotations.length)) {
    errorMessages.value.push('No anotation is provided!!!');
  } else {
    for (let annotation of params.annotations) {
      if (annotation.type === 'Annotation') {
        const tagsList = annotation.body.filter(x => x.purpose == 'tagging');
        if (tagsList.length) {
          if (!tagsList.map(x => x.value).some(x => (scheme.languages as Array<string>).includes(x))) {
            errorMessages.value.push('The annotation does not contain any LANGUAGE tags!');
          }
        } else {
          errorMessages.value.push('There are no tags in the annotation!');
        }
      }
    }
  }
  // console.log('save anno', imgSrc.value);
  if (errorMessages.value.length) {
    console.log(`not saved – errors: ${errorMessages.value.length}`);
  } else {
    const { data } = await axios.post('/api/anno', { params });
    if (data?.tg_id == id.value) {
      message.success('The data were saved.');
    } else {
      message.error('The data were not saved!');
    }
  }
  // console.log("result", data);
};

const getNext = (isReversed?: boolean) => {
  const newId = msg.value?.[isReversed ? 'prev' : 'next'];
  if (newId) {
    // console.log(`GO TO: /message/${newId}`);
    router.push(`/message/${newId}`);
  }
};

const changeTool = (name: string) => {
  drawingTool.value = name;
  console.log('change tool', name);
  anno.value.setDrawingTool(drawingTool.value);
};
</script>

<style lang="scss" scoped>
.dropdown {
  width: 14rem;
}
.country-item {
  img {
    width: 17px;
    margin-right: 0.5rem;
  }
}

:deep(.r6o-editor) {
  width: 80%;
}
</style>

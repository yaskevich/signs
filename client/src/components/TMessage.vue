<template>
  <n-space vertical>
    <n-space justify="center">
      <img ref="imgRef" :src="imgSrc" style="max-width: 100%" />
    </n-space>

    <n-space justify="space-around" size="small">
      <!-- <n-button @click="getNext(true)">Previous</n-button> -->
      <n-button @click="getNext(true)" :disabled="!photo?.prev" size="small">
        <template #icon>
          <n-icon :component="ArrowLeft" />
        </template>
      </n-button>
      <n-radio-group v-model:value="drawingTool" name="toolsgroup" @update-value="changeTool" size="small">
        <n-radio-button v-for="item in toolsOptions" :key="item.type" :value="item.type" :label="item.title" />
      </n-radio-group>
      <!-- <n-button @click="getNext()">Next</n-button> -->
      <n-button @click="getNext()" :disabled="!photo?.next" size="small">
        <template #icon>
          <n-icon :component="ArrowRight" />
        </template>
      </n-button>
    </n-space>

    <n-card :title="`Object ${selectedObject.id}`" v-if="showObjectForm && selectedObject?.id">
      <template #header-extra>
        <n-space justify="space-between">
          <n-button ghost @click="discardChanges" type="primary">Back to photo</n-button>
          <n-button @click="saveObjectAnnotation" type="info">Save</n-button>
        </n-space>
      </template>

      <n-space vertical size="large">
        <n-card embedded>
          <n-input v-model:value="selectedObject.content" type="textarea" placeholder="Text" />
        </n-card>
        <div v-for="item in scheme.find(x => x.code === 'objects')?.children">
          <n-space justify="start">
            <n-tag type="info">{{ item.title }}</n-tag>
            <template v-for="subitem in item?.children">
              <n-checkbox v-model:checked="selectedObject.features[subitem.id].value">{{ subitem.title }}</n-checkbox>
              <n-input
                autosize
                v-if="selectedObject.features[subitem.id]?.value"
                v-model:value="selectedObject.features[subitem.id].note"
                type="text"
                size="tiny"
                placeholder="Note..."
                style="margin-left: -15px; min-width: 60px" />
              <!-- <n-switch>
                <template #checked> {{ subitem.title }} </template>
                <template #unchecked> {{ subitem.title }} </template>
              </n-switch> -->
            </template>
          </n-space>
        </div>
      </n-space>
    </n-card>
    <n-card title="Photo" v-else>
      <template #header-extra>
        <n-button @click="savePhotoAnnotation" type="primary">Save</n-button>
      </template>
      <n-form>
        <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
          <n-form-item-gi v-for="item in scheme?.[0]?.children" :label="item?.title">
            <n-input
              v-if="item?.type === 'text'"
              type="text"
              :placeholder="item?.title"
              v-model:value="values[item.id]" />

            <n-select
              v-if="item?.type === 'single'"
              :options="item?.children"
              label-field="title"
              value-field="id"
              filterable
              :placeholder="'Select ' + item?.title"
              v-model:value="values[item.id]" />

            <template v-else>
              <template v-for="value in item?.children">
                <template v-if="value?.children?.length">
                  <n-space justify="space-between">
                    <n-tag size="large">{{ value?.title }}</n-tag>
                    <n-select
                      v-if="value?.type === 'single'"
                      :options="value?.children"
                      label-field="title"
                      value-field="id"
                      :placeholder="'Select ' + value?.title"
                      filterable
                      v-model:value="values[value.id]" />
                  </n-space>
                </template>
              </template>
            </template>
          </n-form-item-gi>
        </n-grid>

        <!-- <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
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
        </n-grid> -->
      </n-form>
      <n-card v-if="photo?.data?.message" embedded>
        <span v-html="photo.data.message.split('\n').join('<br/>')"></span>
      </n-card>
    </n-card>
  </n-space>
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
const requestedObjectId = vuerouter.query?.obj;
const photo = ref({} as IMessage);
const imgSrc = ref('');
const imgRef = ref();
const anno = ref();
const drawingTool = ref('rect');
const features = reactive({} as keyable);
const scheme = reactive([] as Array<IFeature>);
const values = reactive({} as keyable);
const objects = reactive([] as Array<keyable>);
const selectedObject = reactive({} as IObject);
const showObjectForm = ref(false);
const matrix = reactive([] as Array<IFeature>);

const initAnnotorius = () => {
  // const vocabulary = [...scheme.languages, ...scheme.features];
  // console.log(vocabulary);
  anno.value = new Annotorious({
    image: imgRef.value,
    // widgets: ['COMMENT', { widget: 'TAG', vocabulary }],
    disableEditor: true,
    allowEmpty: true,
  });
  TiltedBoxPlugin(anno.value);
  // anno.value.setDrawingTool('rect');
  anno.value.clearAuthInfo();
  anno.value
    .on('updateAnnotation', function (annotation: any, previous: any) {
      console.log('updateAnnotation');
      // saveAnnotations();
      return false;
    })
    .on('clickAnnotation', function (annotation: any, element: any) {
      console.log('click!', selectedObject?.id, annotation);
      if (selectedObject?.id) {
        showObjectForm.value = true;
      }
    })
    .on('deleteAnnotation', function (annotation: any) {
      if (showObjectForm.value === true) {
        console.log('ignore DEL press');
        anno.value.addAnnotation(annotation);
      } else {
        console.log('delete', annotation);
        anno.value.addAnnotation(annotation);
      }
    })
    .on('changeSelectionTarget', function (target: any) {
      console.log('change shape');
    })
    .on('createAnnotation', function (annotation: any) {
      console.log('createAnnotation', annotation);
      // saveAnnotations();
    })
    .on('selectAnnotation', function (annotation: any) {
      const featuresFull = Object.fromEntries(
        matrix.map((x: any) => {
          const prop = objects[annotation.id]?.features.find((y: any) => y.id === x.id) || { note: '', value: false };
          return [x.id, { ...x, ...prop }];
        })
      );

      Object.assign(selectedObject, objects[annotation.id], { features: featuresFull });
      console.log('selected', annotation);
    })
    .on('cancelSelected', function (selection: any) {
      Object.assign(selectedObject, { id: null });
      showObjectForm.value = false;
      console.log('cancel selection');
    })
    .on('createSelection', function (selection: any) {
      console.log('create selection', selection);
      // anno.value.updateSelected(selection, true);
      // anno.value.selectAnnotation(selection);

      // anno.value.readOnly = true;
      // const { snippet, transform } = anno.value.getSelectedImageSnippet();
      // console.log(snippet, transform);
    })
    .on('changeSelected', function (selected: any, previous: any) {
      console.log('change selected', selected, previous);
    });
};

const buildWebAnno = (aId: number, shape: string, geometry: string, path: string) => ({
  type: 'Annotation',
  body: [],
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: aId,
  target: {
    source: path,
    selector:
      shape === 'rect'
        ? {
            type: 'FragmentSelector',
            conformsTo: 'http://www.w3.org/TR/media-frags/',
            value: `xywh=pixel:${geometry}`,
          }
        : {
            type: 'SvgSelector',
            value: `<svg><polygon points="${geometry}"></polygon></svg>`,
          },
  },
});

const nest = (items: any, id = 0) =>
  items
    .filter((x: any) => x.parent === id)
    .map((x: any) => {
      const children = nest(items, x.id);
      return { ...x, ...(children?.length && { children }) };
    });

// onBeforeMount(async () => {
// });

onMounted(async () => {
  const fdata = await axios.get('/api/features');
  Object.assign(matrix, fdata.data);
  Object.assign(scheme, nest(fdata.data));

  initAnnotorius();
  if (id.value) {
    let { data } = await axios.get('/api/message', { params: { id: id.value } });
    const imagepath = window.location.origin + '/api/media/downloads/' + data.imagepath;
    imgSrc.value = imagepath;
    photo.value = data;
    // console.log('values scheme', toRaw(formArray));
    // console.log(data.features);

    Object.assign(features, Object.fromEntries(fdata.data.map((x: any) => [x.id, x])));

    for (const unit of photo.value?.features) {
      const rule = features[unit.id];
      const unitId = rule.type ? unit.id : rule.parent;
      const value = rule.type ? unit.value : unit.id;
      values[unitId] = value;
    }
    // datum.country = data.country;
    // datum.src = data.src;
    // datum.url = data.url;

    // if (data.orient) {
    //   orientProp.value = data.orient;
    // }

    const attachedData = await axios.get('/api/attached', { params: { id: id.value } });
    attachedData.data.map((x: any) => anno.value.addAnnotation(buildWebAnno(x.id, x.shape, x.geometry, imagepath)));
    Object.assign(objects, Object.fromEntries(attachedData.data.map((x: any) => [x.id, x])));
    // console.log(objects);
    if (requestedObjectId) {
      anno.value.selectAnnotation(requestedObjectId);
    }
  }
});

const discardChanges = () => {
  anno.value.cancelSelected();
  Object.assign(selectedObject, { id: null });
};

const saveObjectAnnotation = async () => {
  const newFeatures = Object.values(selectedObject.features)
    .filter((x: IFeature) => x.value)
    .map((x: IFeature) => ({ id: x.id, value: x.value, ...(x.note && { note: x.note }) }));
  console.log(newFeatures);
  const datum = { ...toRaw(selectedObject), features: newFeatures };

  const { data } = await axios.post('/api/object', { params: datum });
  if (data?.id === selectedObject.id) {
    Object.assign(objects[selectedObject.id], datum);
    message.success('The object data were saved.');
  } else {
    message.error('The object data were not saved!');
  }
};

const savePhotoAnnotation = async () => {
  // const annotations =
  // const params = { ...toRaw(datum) } as IMessage;
  // const result = values.map((x: any, i: any) =>
  //   formArray[i].type === 'text' ? { id: formArray[i].id, value: x } : { id: x, value: true }
  // );

  // console.log('result', result);

  // console.log(values);
  // console.log(values.map(x => features[]));

  // for (const [key, value] of Object.entries(values)) {
  //   console.log(`${key}: ${value}`);
  // }
  const jsonFeatures = Object.entries(values).map(x =>
    features[x[0]].type === 'text' ? { id: Number(x[0]), value: x[1] } : { id: x[1], value: true }
  );
  console.log(jsonFeatures);
  const params = {
    features: jsonFeatures,
    tg_id: id.value,
  };
  const { data } = await axios.post('/api/meta', { params });
  if (data?.tg_id == id.value) {
    message.success('The photo data were saved.');
  } else {
    message.error('The photo data were not saved!');
  }

  // errorMessages.value = [];
  // params.orient = orientProp.value;
  // params.tg_id = id.value;
  // params.annotations = anno.value.getAnnotations();
  // console.log('data to save', params);
  // if (!params.country) {
  //   errorMessages.value.push('Country is not set!');
  // }
  // if (!params.orient) {
  //   errorMessages.value.push('Orientation is not set!');
  // }

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
  // if (!params.annotations || (params.annotations && !params.annotations.length)) {
  //   errorMessages.value.push('No anotation is provided!!!');
  // } else {
  //   for (let annotation of params.annotations) {
  //     if (annotation.type === 'Annotation') {
  //       const tagsList = annotation.body.filter(x => x.purpose == 'tagging');
  //       if (tagsList.length) {
  //         if (!tagsList.map(x => x.value).some(x => (scheme.languages as Array<string>).includes(x))) {
  //           errorMessages.value.push('The annotation does not contain any LANGUAGE tags!');
  //         }
  //       } else {
  //         errorMessages.value.push('There are no tags in the annotation!');
  //       }
  //     }
  //   }
  // }
  // console.log('save anno', imgSrc.value);
  // if (errorMessages.value.length) {
  //   console.log(`not saved – errors: ${errorMessages.value.length}`);
  // } else {
  // const { data } = await axios.post('/api/meta', { params });
  // if (data?.tg_id == id.value) {
  //   message.success('The data were saved.');
  // } else {
  //   message.error('The data were not saved!');
  // }
  // }
  // console.log("result", data);
};

const getNext = (isReversed?: boolean) => {
  const newId = photo.value?.[isReversed ? 'prev' : 'next'];
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
:deep(.a9s-annotation.selected .a9s-inner) {
  stroke: #ff00e3;
  stroke-width: 5px;
}
:deep(.a9s-selection .a9s-inner) {
  stroke: #ff00e3;
  stroke-width: 5px;
}
</style>

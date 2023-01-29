<template>
  <n-space vertical>
    <n-space justify="center">
      <img ref="imgRef" :src="imgSrc" style="max-width: 100%" @contextmenu.prevent="onRightClick" />
    </n-space>

    <n-space justify="space-around" size="small">
      <!-- <n-button @click="getNext(true)">Previous</n-button> -->
      <n-button @click="getNext(true)" :disabled="!photo?.prev" size="small">
        <template #icon>
          <n-icon :component="ArrowBackOutlined" />
        </template>
      </n-button>
      <n-radio-group v-model:value="drawingTool" name="toolsgroup" @update-value="changeTool" size="small">
        <n-radio-button v-for="item in toolsOptions" :key="item.type" :value="item.type" :label="item.title" />
      </n-radio-group>
      <!-- <n-button @click="getNext()">Next</n-button> -->
      <n-button @click="getNext()" :disabled="!photo?.next" size="small">
        <template #icon>
          <n-icon :component="ArrowForwardOutlined" />
        </template>
      </n-button>
    </n-space>

    <n-card :title="selectedObject?.id ? `Object ${selectedObject.id}` : 'New object'" v-if="showObjectForm">
      <template #header-extra>
        <n-space justify="space-between">
          <n-button ghost @click="discardChanges" type="primary">Cancel</n-button>
          <n-button @click="saveObject" type="info">Save</n-button>
        </n-space>
      </template>

      <n-space vertical size="large">
        <n-card embedded>
          <n-input v-model:value="selectedObject.content" type="textarea" placeholder="Text" />
        </n-card>
        <div v-for="item in featuresTree.find(x => x.code === 'objects')?.children">
          <n-space justify="start">
            <n-tag type="info">{{ item.title }}</n-tag>
            <n-input-group v-if="item?.type === 'single'">
              <n-select
                size="small"
                :options="item?.children"
                label-field="title"
                value-field="id"
                filterable
                :placeholder="'Select ' + item?.title"
                v-model:value="objectValues[item.id]" />
              <n-button size="small" secondary type="warning" @click="objectValues[item.id] = null">Clear</n-button>
            </n-input-group>

            <template v-else>
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
            </template>
          </n-space>
        </div>
        <n-popconfirm @positive-click="deleteObject">
          <template #trigger>
            <n-button type="error">Delete</n-button>
          </template>
          Please confirm removing the object from the database.<br />
          It cannot be restored after that.
        </n-popconfirm>
      </n-space>
    </n-card>
    <n-card title="Photo" v-else>
      <template #header-extra>
        <n-space>
          <n-popconfirm @positive-click="removeImage(photo)" v-if="!photo?.eid">
            <template #trigger>
              <n-button type="error"> Delete </n-button>
            </template>
            <span>
              You are going to remove this image and all its metadata stored in the database. <br />The operation cannot
              be undone.
            </span>
          </n-popconfirm>
          <n-button @click="savePhotoAnnotation" type="primary">Save</n-button>
        </n-space>
      </template>
      <n-form>
        <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
          <n-form-item-gi v-for="item in featuresTree?.[0]?.children" :label="item?.title">
            <n-input
              v-if="item?.type === 'text'"
              type="text"
              :placeholder="item?.title"
              v-model:value="valuesMap[item.id]" />
            <n-input-group v-if="item?.type === 'single'">
              <n-select
                :options="item?.children"
                label-field="title"
                value-field="id"
                filterable
                :placeholder="'Select ' + item?.title"
                v-model:value="valuesMap[item.id]" />
              <n-button secondary type="warning" @click="valuesMap[item.id] = null">Clear</n-button>
            </n-input-group>
            <template v-else>
              <template v-for="value in item?.children">
                <template v-if="value?.children?.length">
                  <n-space justify="space-between">
                    <n-tag size="large">{{ value?.title }}</n-tag>
                    <n-input-group v-if="value?.type === 'single'">
                      <n-select
                        :options="value?.children"
                        label-field="title"
                        value-field="id"
                        placeholder="Choose option"
                        filterable
                        v-model:value="valuesMap[value.id]" />
                      <n-button secondary type="warning" @click="valuesMap[value.id] = null">Clear</n-button>
                    </n-input-group>
                  </n-space>
                </template>
              </template>
            </template>
          </n-form-item-gi>
        </n-grid>
        <n-form-item label="Location">
          <!-- <n-button type="info"> Map </n-button> -->
          <n-input type="textarea" placeholder="Geospatial information" v-model:value="photo.geonote" autosize />
        </n-form-item>
        <n-form-item label="Text note" label-style="font-weight: bold">
          <n-input type="textarea" placeholder="Tips for annotating" v-model:value="photo.note" />
        </n-form-item>
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
    </n-card>
    <n-card v-if="photo?.data?.message" embedded>
      <span v-html="photo.data.message.split('\n').join('<br/>')"></span>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, onMounted, onBeforeUnmount, toRaw } from 'vue';
import { useRoute } from 'vue-router';
import router from '../router';
import store from '../store';
import { useMessage } from 'naive-ui';
import { Annotorious } from '@recogito/annotorious';
import '@recogito/annotorious/dist/annotorious.min.css';
import TiltedBoxPlugin from '@recogito/annotorious-tilted-box';
import { ArrowBackOutlined, ArrowForwardOutlined } from '@vicons/material';

const toolsOptions = [
  { title: 'Rectangle', type: 'rect' },
  { title: 'Polygon', type: 'polygon' },
  { title: 'Tilted Box', type: 'annotorious-tilted-box' },
];
const message = useMessage();
const vuerouter = useRoute();
const id = ref(Number(vuerouter.params.id));
const requestedObjectId = Number(vuerouter.params.object);
const photo = ref({} as IMessage);
const imgSrc = ref('');
const imgRef = ref();
const anno = ref();
const drawingTool = ref('rect');
const featuresMap = reactive({} as keyable);
const featuresTree = reactive([] as Array<IFeature>);
const featuresList = reactive([] as Array<IFeature>);
const valuesMap = reactive({} as keyable);
const objectsMap = reactive({} as keyable);
const selectedObject = reactive({} as IObject);
const showObjectForm = ref(false);
const objectValues = reactive({} as keyable);

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
      // console.log('click!', selectedObject?.id, annotation);
      // if (selectedObject?.id) {
      //   showObjectForm.value = true;
      // }
      router.push(`/datum/${id.value}/${annotation.id}`);
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
      // console.log('change shape', selectedObject?.id);
      if (selectedObject?.id) {
        const [shape, geometry] = parseSelector(target.selector);
        selectedObject.shape = shape;
        selectedObject.geometry = geometry;
        selectedObject.image = photo.value.imagepath;
      }
    })
    .on('createAnnotation', function (annotation: any) {
      // console.log('createAnnotation (& delete)', annotation);
      anno.value.removeAnnotation(annotation);
      showObjectForm.value = false;
      // saveAnnotations();
    })
    .on('selectAnnotation', function (annotation: any) {
      // console.log('selected', annotation);
      selectObject(annotation.id);
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
      const [shape, geometry] = parseSelector(selection.target.selector);
      if (shape && geometry) {
        const newFeatures = Object.fromEntries(featuresList.map(x => [x.id, { ...x, note: '', value: false }]));
        Object.assign(selectedObject, {
          id: null,
          shape,
          geometry,
          content: '',
          features: newFeatures,
          eid: photo.value.eid,
          data_id: photo.value.id,
          image: photo.value.imagepath,
        });
        showObjectForm.value = true;
      } else {
        message.error('Snippet format error');
      }
    })
    .on('changeSelected', function (selected: any, previous: any) {
      console.log('change selected', selected, previous);
    });
};

const selectObject = (oid: number) => {
  const featuresFull = Object.fromEntries(
    featuresList.map((x: any) => {
      const prop = objectsMap[oid]?.features.find((y: any) => y.id === x.id) || {
        note: '',
        value: false,
      };
      return [x.id, { ...x, ...prop }];
    })
  );

  Object.assign(selectedObject, objectsMap[oid], { features: featuresFull });

  const singleIds = objectsMap[oid]?.features
    .filter((x: any) => featuresMap[featuresMap[x?.id].parent].type === 'single')
    .map((x: any) => ({ [featuresMap[x?.id].parent]: x?.id }));

  Object.assign(objectValues, ...singleIds);

  showObjectForm.value = true;
};

const parseSelector = (selectionObject: any) => {
  let shape: string = '';
  let geometry: string = '';

  if (selectionObject.type === 'SvgSelector') {
    [shape, geometry] = ['polygon', selectionObject.value.split('"')[1]];
  } else if (selectionObject.type === 'FragmentSelector') {
    [shape, geometry] = ['rect', selectionObject.value.split(':')[1]];
  }
  return [shape, geometry];
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

const onRightClick = () => {
  console.log('right click');
};

const buildImagePath = (imageName: string) => window.location.origin + '/api/media/downloads/' + imageName;

const removeImage = async (info: IMessage) => {
  if (info?.id) {
    const data = await store.post('unload', { id: info.id });
    // console.log(data);
    if (data?.img === info.imagepath) {
      message.success('Image was removed');
      router.back();
    } else {
      message.error(data?.msg || 'Unknown error');
    }
  } else {
    message.error('ID error');
  }
};

// onBeforeMount(async () => {
// });

onBeforeUnmount(async () => {
  anno.value.destroy();
});

onMounted(async () => {
  const fdata = await store.get('features');
  Object.assign(featuresList, fdata);
  Object.assign(featuresTree, store.nest(fdata));

  initAnnotorius();
  if (id.value) {
    let data = await store.get('message', null, { id: id.value });
    console.log('photo data', data);

    const imagepath = buildImagePath(data.imagepath);
    imgSrc.value = imagepath + '?jwt=' + store?.state?.token;
    photo.value = data;
    // console.log('values scheme', toRaw(formArray));
    // console.log(data.features);
    Object.assign(featuresMap, Object.fromEntries(fdata.map((x: any) => [x.id, x])));
    // console.log(photo.value?.features);
    for (const unit of photo.value?.features) {
      const rule = featuresMap[unit.id];
      const unitId = rule.type ? unit.id : rule.parent;
      const value = rule.type ? unit.value : unit.id;
      valuesMap[unitId] = value;
    }
    // datum.country = data.country;
    // datum.src = data.src;
    // datum.url = data.url;

    // if (data.orient) {
    //   orientProp.value = data.orient;
    // }

    const attachedData = await store.get('attached', null, { id: id.value });
    attachedData.map((x: any) => anno.value.addAnnotation(buildWebAnno(x.id, x.shape, x.geometry, imagepath)));
    Object.assign(objectsMap, Object.fromEntries(attachedData.map((x: any) => [x.id, x])));
    // console.log(objects);
    if (requestedObjectId && objectsMap?.[requestedObjectId]) {
      selectObject(requestedObjectId);
      anno.value.selectAnnotation(requestedObjectId);
    }
  }
});

const discardChanges = () => {
  anno.value.cancelSelected();
  Object.assign(selectedObject, { id: null, content: '' });
  showObjectForm.value = false;
  router.push(`/datum/${id.value}`);
};

const deleteObject = async () => {
  // console.log('delete', selectedObject.id);
  const { data } = await store.deleteById('object', selectedObject.id);
  console.log('delete result', data);
  if (data?.error) {
    message.error('Object removal error!');
  } else {
    showObjectForm.value = false;
    anno.value.removeAnnotation(selectedObject.id);
    message.success(`Object ${selectedObject.id} was removed from the database`);
  }
};

const checkSingleChoice = (fid: number, fvalue: boolean) => {
  const singleId = objectValues[featuresMap[fid]?.parent];
  if (singleId !== undefined) {
    return singleId ? (singleId === fid ? true : false) : false;
  }
  return fvalue;
};

const saveObject = async () => {
  // console.log('n-select', objectValues);

  const newFeatures = Object.values(selectedObject.features)
    .map(x => ({ ...x, value: checkSingleChoice(x.id, Boolean(x?.value)) }))
    .filter((x: IFeature) => x.value)
    .map((x: IFeature) => ({ id: x.id, value: x.value, ...(x.note && { note: x.note }) }));
  // console.log('to save', newFeatures);
  const datum = { ...toRaw(selectedObject), features: newFeatures };
  console.log('save', datum);
  const data = await store.post('object', { params: datum });

  if (data?.id) {
    if (selectedObject?.id) {
      Object.assign(objectsMap[selectedObject.id], datum);
    } else {
      const dataId = Number(data.id);
      selectedObject.id = dataId;
      datum.id = dataId;
      objectsMap[datum.id] = datum;

      anno.value.addAnnotation(
        buildWebAnno(data.id, datum.shape, datum.geometry, buildImagePath(photo.value.imagepath))
      );
    }
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
  // console.log(valuesMap);

  const jsonFeatures = Object.entries(valuesMap)
    .filter(x => x[1])
    .map(x => (featuresMap[x[0]].type === 'text' ? { id: Number(x[0]), value: x[1] } : { id: x[1], value: true }));
  console.log(jsonFeatures);
  const params = {
    features: jsonFeatures,
    id: id.value,
    geonote: photo.value.geonote,
    note: photo.value.note,
  };

  const data = await store.post('meta', { params });
  if (data?.id == id.value) {
    message.success('The photo data were saved.');
  } else {
    message.error('The photo data were not saved!');
  }

  // errorMessages.value = [];
  // params.orient = orientProp.value;
  // params.eid = id.value;
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
  // if (data?.eid == id.value) {
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
    router.push(`/datum/${newId}`);
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

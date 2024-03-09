<template>
  <n-space vertical>
    <n-space justify="center">
      <img ref="imgRef" :src="imgSrc" style="max-width: 100%" @contextmenu.prevent="onRightClick" />
    </n-space>

    <n-space justify="space-around" size="small">
      <!-- <n-button @click="getNext(true)">Previous</n-button> -->
      <n-button @click="getNext(true)" :disabled="!item?.prev" size="small">
        <template #icon>
          <n-icon :component="ArrowBackOutlined" />
        </template>
      </n-button>
      <n-radio-group v-model:value="drawingTool" name="toolsgroup" @update-value="changeTool" size="small">
        <n-radio-button v-for="tool in toolsOptions" :key="tool.type" :value="tool.type" :label="tool.title" />
      </n-radio-group>
      <!-- <n-button @click="getNext()">Next</n-button> -->
      <n-button @click="getNext()" :disabled="!item?.next" size="small">
        <template #icon>
          <n-icon :component="ArrowForwardOutlined" />
        </template>
      </n-button>
    </n-space>

    <n-card :title="selectedObject?.id ? `Object ${selectedObject.id}` : 'New object'" v-if="level">
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

        <n-form>
          <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
            <template v-if="featuresTree[1]?.children && isLoaded">
              <component v-for="prop in featuresTree[1].children" :is="renderFeature(prop, featuresIO[1])" />
            </template>
          </n-grid>
        </n-form>

        <!-- <div v-for="branch in featuresTree.find(x => x.code === 'objects')?.children">
          <n-space justify="start">
            <n-tag type="info">{{ branch.title }}</n-tag>
            <n-input-group v-if="branch?.type === 'single'">
              <n-select
                size="small"
                :options="branch?.children"
                label-field="title"
                value-field="id"
                filterable
                :placeholder="'Select ' + branch?.title"
                v-model:value="objectValues[branch.id]" />
              <n-button size="small" secondary type="warning" @click="objectValues[branch.id] = null">Clear</n-button>
            </n-input-group>

            <template v-else>
              <n-input
                v-if="branch?.type === 'text'"
                type="text"
                :placeholder="branch?.title"
                size="small"
                v-model:value="selectedObject.features[branch.id].note" />
              <template v-else>
                <template v-for="leaf in branch?.children">
                  <n-checkbox v-model:checked="selectedObject.features[leaf.id].value">{{ leaf.title }}</n-checkbox>
                  <n-input
                    autosize
                    v-if="selectedObject.features[leaf.id]?.value"
                    v-model:value="selectedObject.features[leaf.id].note"
                    type="text"
                    size="tiny"
                    placeholder="Note..."
                    style="margin-left: -15px; min-width: 60px" />
                </template>
              </template>
            </template>
          </n-space>
        </div> -->
        <n-popconfirm @positive-click="deleteObject">
          <template #trigger>
            <n-button type="error">Delete</n-button>
          </template>
          Please confirm removing the object from the database.<br />
          It cannot be restored after that.
        </n-popconfirm>
      </n-space>
    </n-card>

    <n-card v-else>
      <template #header>
        <n-space>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" icon-placement="right" @click="showJSONModal = true">
                <template #icon>
                  <n-icon :component="DataObjectOutlined" />
                </template>
              </n-button>
            </template>
            Data JSON
          </n-tooltip>
          Image
        </n-space>
      </template>

      <template #header-extra>
        <n-space>
          <n-popconfirm @positive-click="removeItem(item)" v-if="!item?.eid">
            <template #trigger>
              <n-button type="error"> Delete </n-button>
            </template>
            <span>
              You are going to remove this image and all its metadata stored in the database. <br />The operation cannot
              be undone.
            </span>
          </n-popconfirm>
          <n-button @click="saveItemAnnotation" type="primary">Save</n-button>
        </n-space>
      </template>

      <n-form>
        <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
          <template v-if="featuresTree[0]?.children && isLoaded">
            <component v-for="prop in featuresTree[0].children" :is="renderFeature(prop, featuresIO[0])" />
          </template>
          <!-- <n-form-item-gi v-for="item in featuresTree?.[0]?.children" :label="item?.title">
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
                <template v-else>
                </template>
              </template>
            </template>
          </n-form-item-gi> -->
        </n-grid>
        <n-form-item label="Text note" label-style="font-weight: bold">
          <n-input type="textarea" placeholder="Tips for annotating" v-model:value="item.note" />
        </n-form-item>
        <n-form-item label="Location" v-if="isLoaded">
          <n-input type="text" placeholder="Geospatial information" v-model:value="item.geonote" />
        </n-form-item>

        <n-space justify="space-between">
          <!-- lat lon -->
          <n-tag size="large" v-if="coordinates?.[0] && coordinates?.[1]" type="info">{{ coordinates[1] }} {{
        coordinates[0]
      }}</n-tag>
          <n-button type="warning"> Enable editing </n-button>
        </n-space>
      </n-form>
    </n-card>
    <!-- <div class="map-wrap" v-if="!hideMap">
      <div class="map" ref="mapContainer"></div>
    </div> -->
    <Mapper :datum="coordinates" />
    <n-card v-if="item?.data?.message" embedded>
      <span v-html="item.data.message.split('\n').join('<br/>')"></span>
    </n-card>
  </n-space>
  <n-modal v-model:show="showJSONModal" style="max-width: 600px">
    <div v-if="item?.data">
      <json-viewer :value="item.data"></json-viewer>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { h, ref, reactive, onMounted, onBeforeUnmount, toRaw, onUnmounted, markRaw, shallowRef } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import router from '../router';
import store from '../store';
import Mapper from './Mapper.vue';
import { useMessage, NFormItemGi, NInput, NInputGroup, NSelect, NButton, NTag, NCheckbox, NSpace } from 'naive-ui';
import { Annotorious } from '@recogito/annotorious';
import '@recogito/annotorious/dist/annotorious.min.css';
import TiltedBoxPlugin from '@recogito/annotorious-tilted-box';
import { ArrowBackOutlined, ArrowForwardOutlined } from '@vicons/material';
import { Map, NavigationControl, Marker, Popup, FullscreenControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification, ResourceType, MapOptions } from 'maplibre-gl';
import { isMapboxURL, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer';
import { DataObjectOutlined } from '@vicons/material';

const message = useMessage();
const vuerouter = useRoute();
const id = ref(Number(vuerouter.params.id));
const requestedObjectId = Number(vuerouter.params.object);
const item = ref({} as IMessage);
const imgSrc = ref('');
const imgRef = ref();
const anno = ref();
const drawingTool = ref('polygon');
// const featuresHash = reactive({} as keyable);
const featuresTree = reactive([] as Array<IFeature>);
// const featuresList = reactive([] as Array<IFeature>);
const objectsMap = reactive({} as keyable);
const selectedObject = reactive({} as IObject);
const level = ref(0);
// const objectValues = reactive({} as keyable);
const isLoaded = ref(false);
const coordinates = ref<[number, number]>();
// const mapContainer = ref<HTMLElement>();
// const map = shallowRef<Map>();
// const hideMap = ref(false);
const showJSONModal = ref(false);
const featuresIO = reactive([{} as keyable, {} as keyable]);
// const marker = shallowRef<Marker>();
const toolsOptions = [
  { title: 'Rectangle', type: 'rect' },
  { title: 'Polygon', type: 'polygon' },
  { title: 'Tilted Box', type: 'annotorious-tilted-box' },
];

const updateInput = (userInput: any, key: any) => {
  // console.log('update text input', userInput, key);
  userInput
    ? (featuresIO[level.value][key] = { id: Number(key), value: userInput })
    : delete featuresIO[level.value]?.[key];
};

const updateSelect = (userInput: any, group: Array<string>) => {
  // console.log('update select input', userInput, group);
  group.forEach((y: string) =>
    y !== userInput
      ? delete featuresIO[level.value]?.[y]
      : (featuresIO[level.value][y] = { id: Number(y), value: true })
  );
};

const updateCheckbox = (state: any, id: any) => {
  // console.log('update text input', state, id);
  featuresIO[level.value][id] = {
    id: Number(id),
    value: state,
    note: featuresIO[level.value]?.[id]?.note || '',
  };
};

const updateNote = (userInput: any, key: any) => {
  // console.log('update note', userInput, key);
  featuresIO[level.value][key]['note'] = userInput;
};

const renderFeature = (unit: any, vals: any, deep = false) => {
  if (!Object.keys(vals)?.length) {
    console.log('empty call');
    // return;
  }
  // console.log(unit.title);
  let children: any;

  switch (unit?.type) {
    case 'text':
      const key = String(unit.id);
      children = h(NInput, {
        type: 'text',
        placeholder: unit?.title,
        value: vals[key]?.value,
        onUpdateValue: (x: any) => updateInput(x, key),
      });
      break;
    case 'single':
      if (unit?.children) {
        const siblings = unit.children.map((x: any) => x.id);
        const key = unit.children.find((x: any) => vals[x.id]?.value)?.id;
        children = deep ? [h(NTag, { type: 'default', size: 'large' }, { default: () => unit.title })] : [];
        children.push(
          h(NSelect, {
            options: unit.children,
            labelField: 'title',
            valueField: 'id',
            filterable: true,
            clearable: true,
            value: key,
            placeholder: 'Select ' + unit?.title,
            onUpdateValue: (x: any) => updateSelect(x, siblings),
          })
        );
      }
      break;
    case 'multi':
      if (!unit?.children?.[0]?.type) {
        let children2 = unit?.children
          .map((x: any) => [
            h(
              NCheckbox,
              {
                checked: vals[x.id]?.value,
                type: 'info',
                onUpdateChecked: (val: any) => updateCheckbox(val, x.id),
              },
              { default: () => x.title }
            ),
            h(NInput, {
              type: 'text',
              placeholder: 'Note...',
              autosize: true,
              size: 'tiny',
              disabled: !vals[x.id]?.value,
              class: vals[x.id]?.value ? 'note' : 'hidden',
              value: vals[x.id]?.note,
              onUpdateValue: (val: any) => updateNote(val, x.id),
            }),
          ])
          .flat();

        children = [
          h(
            NSpace,
            {
              justify: 'start',
            },
            // [h(NTag, { type: 'info' }, { default: () => unit.title }), children]
            () => children2
          ),
        ];
      } else {
        console.log('CHECK!', unit.children[0].title);
        children = renderFeature(unit.children[0], vals, true);
      }
    // default:
    //   console.log('kek');
  }

  return deep ? children : h(NFormItemGi, { label: unit.title }, { default: () => children });
};

const cleanFeatures = (lvl: number = 0) => {
  for (let prop in featuresIO[lvl]) delete featuresIO[lvl][prop];
  console.log('clean', lvl);
};

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
  anno.value.setDrawingTool(drawingTool.value);
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
      if (level.value === 1) {
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
        selectedObject.image = item.value.imagepath;
      }
    })
    .on('createAnnotation', function (annotation: any) {
      // console.log('createAnnotation (& delete)', annotation);
      anno.value.removeAnnotation(annotation);
      level.value = 0;
      // saveAnnotations();
    })
    .on('selectAnnotation', function (annotation: any) {
      // console.log('selected', annotation);
      selectObject(annotation.id);
    })
    .on('cancelSelected', function (selection: any) {
      Object.assign(selectedObject, { id: null });
      level.value = 0;
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
        // const newFeatures = Object.fromEntries(featuresList.map(x => [x.id, { ...x, note: '', value: false }]));
        Object.assign(selectedObject, {
          id: null,
          shape,
          geometry,
          content: '',
          features: [], //newFeatures,
          eid: item.value.eid,
          data_id: item.value.id,
          image: item.value.imagepath,
        });
        cleanFeatures(1);
        level.value = 1;
      } else {
        message.error('Snippet format error');
      }
    })
    .on('changeSelected', function (selected: any, previous: any) {
      console.log('change selected', selected, previous);
    });
};

const selectObject = (oid: number) => {
  // const featuresFull = Object.fromEntries(
  //   featuresList.map((x: any) => {
  //     const prop = objectsMap[oid]?.features.find((y: any) => y.id === x.id) || {
  //       note: '',
  //       value: false,
  //     };
  //     return [x.id, { ...x, ...prop }];
  //   })
  // );
  // Object.assign(selectedObject, objectsMap[oid], { features: featuresFull });
  Object.assign(selectedObject, objectsMap[oid]);
  // console.log(objectsMap[oid]);
  cleanFeatures(1);
  Object.assign(featuresIO[1], store.convertArrayToObject(objectsMap[oid]?.features) || {});
  // const singleIds = objectsMap[oid]?.features
  //   .filter((x: any) => featuresHash[featuresHash[x?.id].parent].type === 'single')
  //   .map((x: any) => ({ [featuresHash[x?.id].parent]: x?.id }));
  // Object.assign(objectValues, ...singleIds);
  level.value = 1;
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

const removeItem = async (info: IMessage) => {
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

onBeforeUnmount(async () => {
  anno.value.destroy();
});

onBeforeRouteUpdate(async (to, from) => {
  console.log('update route', from.fullPath, '→', to.fullPath);
});

const buildAnnotationForm = async (init: boolean = false) => {
  console.log('init tools', init);

  const featuresData = await store.get('features');
  Object.assign(featuresTree, store.nest(featuresData));

  if (id.value) {
    let msg = await store.get('message', null, { id: id.value });
    console.log('item data', msg);
    isLoaded.value = true;
    if (store?.state?.user && msg?.location?.x && msg?.location?.y) {
      coordinates.value = [msg.location.y, msg.location.x];
    }

    // if (store?.state?.user && msg?.location?.x && msg?.location?.y) {
    //   coordinates.value = [msg.location.y, msg.location.x];
    //   if (mapContainer.value) {
    //     if (init) {
    //       map.value = initMap(coordinates.value, store?.state?.user?.settings);
    //     } else {
    //       console.log('update coordinates');
    //       if (marker.value && map.value) {
    //         marker.value.setLngLat(coordinates.value);
    //         // map.value.flyTo({ center: coordinates.value });
    //         map.value.setCenter(coordinates.value);
    //       }
    //     }
    //   }
    // } else {
    //   hideMap.value = true;
    // }

    const imagepath = buildImagePath(msg.imagepath);
    imgSrc.value = imagepath + '?jwt=' + store?.state?.token;
    item.value = msg;
    if (init) {
      initAnnotorius();
    }
    // Object.assign(featuresHash, Object.fromEntries(featuresData.map((x: any) => [x.id, x])));
    if (msg?.features?.length) {
      Object.assign(featuresIO[0], store.convertArrayToObject(msg.features));
    }
    // if (item.value?.features) {
    //   for (const unit of item.value.features) {
    //     const rule = featuresHash[unit.id];
    //     const unitId = rule.type ? unit.id : rule.parent;
    //     const value = rule.type ? unit.value : unit.id;
    //     valuesMap[unitId] = value;
    //   }
    // }

    const attachedData = await store.get('attached', null, { id: id.value });

    if (attachedData?.length) {
      const annotations = attachedData.map((x: any) => buildWebAnno(x.id, x.shape, x.geometry, imagepath));
      console.log('set annotations');
      anno.value.setAnnotations(annotations);
      Object.assign(objectsMap, store.convertArrayToObject(attachedData));
      // console.log('objects map', objectsMap);
      if (requestedObjectId && objectsMap?.[requestedObjectId]) {
        selectObject(requestedObjectId);
        setTimeout(() => {
          anno.value.selectAnnotation(requestedObjectId);
        }, 500);
      }
    } else {
      anno.value.setAnnotations([]);
      cleanFeatures();
      level.value = 0;
      Object.assign(selectedObject, { id: null, content: '' });
    }
  }
};

onMounted(async () => {
  await buildAnnotationForm(true);
});

const getNext = async (isReversed?: boolean) => {
  const newId = item.value?.[isReversed ? 'prev' : 'next'];
  if (newId) {
    // console.log(`GO TO: /message/${newId}`);
    router.push(`/datum/${newId}`);
    id.value = newId;
    cleanFeatures();
    await buildAnnotationForm();
  }
};

const discardChanges = () => {
  anno.value.cancelSelected();
  Object.assign(selectedObject, { id: null, content: '' });
  level.value = 0;
  router.push(`/datum/${id.value}`);
};

const deleteObject = async () => {
  // console.log('delete', selectedObject.id);
  const { data } = await store.deleteById('object', selectedObject.id);
  console.log('delete result', data);
  if (data?.error) {
    message.error('Object removal error!');
  } else {
    level.value = 0;
    anno.value.removeAnnotation(selectedObject.id);
    message.success(`Object ${selectedObject.id} was removed from the database`);
  }
};

// const checkSingleChoice = (fid: number, fvalue: boolean) => {
//   const singleId = objectValues[featuresHash[fid]?.parent];
//   if (singleId !== undefined) {
//     return singleId ? (singleId === fid ? true : false) : false;
//   }
//   return fvalue;
// };

const saveObject = async () => {
  // console.log('n-select', objectValues);
  // const newFeatures = Object.values(selectedObject.features)
  //   .map(x => ({ ...x, value: checkSingleChoice(x.id, Boolean(x?.value)) }))
  //   .filter((x: IFeature) => x.value)
  //   .map((x: IFeature) => ({ id: x.id, value: x.value, ...(x.note && { note: x.note }) }));
  // console.log('to save', newFeatures);
  const datum = { ...toRaw(selectedObject), features: Object.values(featuresIO[1]) };
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
        buildWebAnno(data.id, datum.shape, datum.geometry, buildImagePath(item.value.imagepath))
      );
    }
    message.success('The object data were saved.');
  } else {
    message.error('The object data were not saved!');
  }
};

const saveItemAnnotation = async () => {
  const params = {
    features: Object.values(featuresIO[0]),
    id: id.value,
    geonote: item.value.geonote,
    note: item.value.note,
  };

  const data = await store.post('meta', { params });
  if (data?.id == id.value) {
    message.success('The item data were saved.');
  } else {
    message.error('The item data were not saved!');
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

.note {
  margin-left: -15px;
  min-width: 60px;
}

.hidden {
  display: none;
}
</style>

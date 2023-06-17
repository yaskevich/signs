<template>
  <div class="map-wrap" v-if="!hideMap">
    <div class="map" ref="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch, onUnmounted, markRaw, shallowRef } from 'vue';
import { Map, NavigationControl, Marker, Popup, FullscreenControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification, ResourceTypeEnum, MapOptions } from 'maplibre-gl';
import { isMapboxURL, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer';
import store from '../store';

const mapContainer = ref<HTMLElement>();
const map = shallowRef<Map>();
const hideMap = ref(false);
const marker = shallowRef<Marker>();

const initMap = (lngLat: [number, number], opts: IUser['settings']) => {
  const {
    map_vector: isVector,
    map_tile: tilePath,
    map_style: stylePath,
    map_mapbox: isMapbox,
    map_mapbox_key: mapboxKey,
  } = opts;

  const tileServer = !isVector && tilePath ? tilePath : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const rasterStyle = {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [tileServer],
        tileSize: 256,
        attribution:
          '© <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  } as StyleSpecification;

  const style = isVector ? stylePath : rasterStyle;

  if (style) {
    const mapSetup = {
      container: mapContainer.value,
      style,
      center: lngLat,
      zoom: 12,
    } as MapOptions;

    if (isMapbox && mapboxKey) {
      mapSetup.transformRequest = (url: string, rt?: ResourceTypeEnum) =>
        isMapboxURL(url) ? transformMapboxUrl(url, String(rt), mapboxKey) : { url };
    }

    const mapInstance = markRaw(new Map(mapSetup));
    mapInstance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    mapInstance.addControl(new FullscreenControl({ container: mapContainer.value }));
    // draggable: true
    marker.value = new Marker({ color: '#FF0000' });
    marker.value
      .setLngLat(lngLat)
      // .setPopup(new Popup().setText('test'))
      .addTo(mapInstance);

    return mapInstance;
  }
};

const props = withDefaults(
  defineProps<{
    datum: Array<[number, number]>;
    editable?: Boolean;
  }>(),
  {}
);

watch(props, () => {
  console.log('props', props);
  renderMap(props.datum);
});

const init = ref(false);

const renderMap = (datum: any) => {
  if (datum?.length && store?.state?.user?.settings) {
    if (mapContainer.value) {
      const coordinates = datum[0];
      if (init) {
        map.value = initMap(coordinates, store.state.user.settings);
        init.value = true;
      } else {
        console.log('update coordinates');
        if (marker.value && map.value) {
          marker.value.setLngLat(coordinates);
          // map.value.flyTo({ center: coordinates.value });
          map.value.setCenter(coordinates);
        }
      }
    }
  } else {
    hideMap.value = true;
  }
};

onUnmounted(() => {
  map.value?.remove();
});
</script>

<style lang="scss" scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 400px;
}

.map {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>

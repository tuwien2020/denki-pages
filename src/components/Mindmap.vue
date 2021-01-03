<template>
  <div class="mindmap-container-wrapper">
    <div ref="mindmapElement"></div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect, watch, computed } from "vue";
import panzoom from "panzoom";
import "./../../public/libs/jsmind-master/style/jsmind.css";

export default defineComponent({
  components: {},
  props: {
    theme: String,
    data: Object,
  },
  setup(props, context) {
    const mindmapElement = ref<HTMLElement>();
    const theme = computed(() => props.theme || "belizehole");
    let mindmap = ref();

    watch(mindmapElement, (value, oldValue) => {
      if (oldValue) {
        oldValue.innerHTML = "";
      }
      if (value) {
        // @ts-ignore
        mindmap.value = jsMind.show({
          container: value,
          theme: theme.value,
          editable: false,
          support_html: true,
          view: {
            engine: "svg",
          },
        });
        panzoom(value);
      }
    });

    watchEffect(() => mindmap.value?.set_theme(theme.value));

    watchEffect(() => {
      if (mindmap.value) {
        mindmap.value.show(props.data);
        mindmap.value.resize();
      }
    });

    return {
      mindmapElement,
    };
  },
});
</script>

<style scoped>
.mindmap-container-wrapper {
  overflow: hidden;
  height: 100%;
  border: 2px solid darkgrey;
}

.mindmap-container-wrapper:hover {
  cursor: move;
}

#mindmap-container {
  height: 100%;
}
</style>
<style>
.jsmind-inner {
  overflow: initial !important;
  width: initial;
  height: initial;
}
</style>
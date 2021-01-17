<template>
  <nav class="navbar header" role="navigation" aria-label="main navigation">
    <div class="navbar-brand no-min-height">
      <a class="navbar-item" href="/"> DENKI Pages - {{ version }} </a>

      <a
        role="button"
        class="navbar-burger"
        aria-label="menu"
        aria-expanded="false"
        data-target="navbarBasicExample"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>
  </nav>

  <div class="section is-full-height">
    <div class="columns is-full-height">
      <div class="column is-one-fifth menu">
        <textarea
          v-model="inputText"
          placeholder="Type Markdown here"
          id="input-text-element"
          class="textarea"
        ></textarea>

        <br />

        <div class="group">
          <div class="group-item controls">
            <button @click="takeScreenshot()" class="button group-btn">
              Take screenshot
            </button>
            <button @click="getShareableLink()" class="button group-btn">
              Share Link
              <div
                class="button-message"
                :class="{ show: showCopyToClipboard }"
              >
                Copied to clipboard
              </div>
            </button>
          </div>

          <br />

          <div class="group-item">
            <label>
              Theme:
              <select v-model="mindmapTheme" class="dropDown">
                <option value="">default</option>
                <option value="primary">primary</option>
                <option value="warning">warning</option>
                <option value="danger">danger</option>
                <option value="success">success</option>
                <option value="info">info</option>
                <option value="greensea">greensea</option>
                <option value="nephrite">nephrite</option>
                <option value="belizehole">belizehole</option>
                <option value="wisteria">wisteria</option>
                <option value="asphalt">asphalt</option>
                <option value="orange">orange</option>
                <option value="pumpkin">pumpkin</option>
                <option value="pomegranate">pomegranate</option>
                <option value="clouds">clouds</option>
                <option value="asbestos">asbestos</option>
              </select>
            </label>
          </div>

          <br />

          <div class="group-item">
            <label>
              <input type="color" v-model="colorsTopic" class="group-picker" />
              Topic Color
            </label>
          </div>

          <br />

          <div class="group-item">
            <label>
              <input type="color" v-model="colorsSub" class="group-picker" />
              Subtopic Color
            </label>
          </div>

          <br />

          <div class="group-item">
            <label>
              <input type="color" v-model="colorsSubSub" class="group-picker" />
              Sub-Subtopic Color
            </label>
          </div>

          <br />

          <div class="group-item">
            <label>
              <input type="color" v-model="colorsLink" class="group-picker" />
              Link Color
            </label>
          </div>
        </div>
      </div>
      <div
        class="column is-four-fifths mindmap"
        :class="{ 'full-height': isReadonly }"
      >
        <Mindmap :theme="mindmapTheme" :data="mindmapData"></Mindmap>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  watchEffect,
  watch,
  computed,
  onMounted,
} from "vue";
import { version } from "./../package.json";
import { Store, useStore } from "./store";
import Mindmap from "./components/Mindmap.vue";
// @ts-ignore
import marked from "marked";
import { toSvg, toJpeg } from "html-to-image";
//import { documentToSVG, elementToSVG, inlineResources } from "dom-to-svg";

interface MindmapNode {
  id: string;
  topic: string;
  depth: number;
  parent?: MindmapNode;
  children: MindmapNode[];
  "background-color"?: string;
  direction?: string;
}

function useMarkdownToMindmap() {
  marked.setOptions({
    pedantic: false,
  });

  function markdownToMindmap(text: string, store: Store) {
    const parsed = marked.lexer(text);

    let data: MindmapNode = {
      id: "fake-root",
      topic: "DENKI-Mindmap",
      depth: 0,
      parent: null as any,
      children: [] as any[],
    };
    let current = data;
    let counter = 0;

    function tokensToString(tokens: any[]): string {
      return tokens
        .map((t) => {
          if (t.type == "text") {
            if (t.tokens) {
              return tokensToString(t.tokens);
            } else {
              return t.text;
            }
          } else if (t.type == "link") {
            return `<a href="${t.href.replace(/"/g, "%22")}">${t.text}</a>`;
          } else if (t.type == "strong") {
            return `<b>${tokensToString(t.tokens)}</b>`;
          } else if (t.type == "em") {
            return `<em>${tokensToString(t.tokens)}</em>`;
          } else if (t.type == "del") {
            return `<del>${tokensToString(t.tokens)}</del>`;
          } else if (t.type == "codespan") {
            return `<code style="white-space:pre-wrap;">${t.text}</code>`;
          } else if (t.type == "html") {
            return t.raw;
          }
        })
        .join("");
    }

    function hasLink(tokens: any[]): boolean {
      return (
        tokens?.some((t) => t.type == "link" || hasLink(t.tokens)) ?? false
      );
    }

    function colorLink(tokens: any[], node: MindmapNode) {
      if (hasLink(tokens)) {
        node["background-color"] = store.colors.link.value;
      }
    }

    function convertListRecursive(value: any, parent: MindmapNode) {
      if (value.type == "list") {
        return value.items.map((v: any) => {
          let newNode: MindmapNode = {
            id: `id-${counter++}`,
            topic: tokensToString(
              v.tokens.filter((t: any) => t.type != "list")
            ),
            depth: parent.depth + 1,
            parent: parent,
            children: [],
          };

          colorLink(v.tokens, newNode);

          newNode.children.push(
            ...v.tokens
              .filter((t: any) => t.type == "list")
              .flatMap((t: any) => convertListRecursive(t, newNode))
          );
          return newNode;
        });
      }
    }

    parsed.forEach((value: any) => {
      if (value.type == "heading") {
        if (value.depth > current.depth) {
          let newNode: MindmapNode = {
            id: `id-${counter++}`,
            topic: tokensToString(value.tokens),
            depth: value.depth,
            parent: current,
            children: [],
          };

          colorLink(value.tokens, newNode);

          current.children.push(newNode);
          current = newNode;
        } else if (value.depth == current.depth) {
          let newNode: MindmapNode = {
            id: `id-${counter++}`,
            topic: tokensToString(value.tokens),
            depth: value.depth,
            parent: current.parent,
            children: [],
          };

          colorLink(value.tokens, newNode);

          current.parent!.children.push(newNode);
          current = newNode;
        } else if (value.depth < current.depth) {
          let parent = current.parent!;
          while (value.depth <= parent.depth) {
            parent = parent.parent!;
          }

          let newNode = {
            id: `id-${counter++}`,
            topic: tokensToString(value.tokens),
            depth: value.depth,
            parent: parent,
            children: [],
          };

          colorLink(value.tokens, newNode);

          parent.children.push(newNode);
          current = newNode;
        }
      } else if (value.type == "paragraph") {
        let newNode = {
          id: `id-${counter++}`,
          topic: tokensToString(value.tokens),
          depth: current.depth + 1,
          parent: current,
          children: [],
        };

        colorLink(value.tokens, newNode);

        current.children.push(newNode);
      } else if (value.type == "list") {
        current.children.push(...convertListRecursive(value, current));
      }
    });

    if (data.children.length == 1) {
      data = data.children[0];
    }

    // Move half of the tree to the right
    for (
      let i = Math.ceil(data.children.length / 2);
      i < data.children.length;
      i++
    ) {
      data.children[i].direction = "left";
    }

    // Color the top node
    data["background-color"] = store.colors.topic.value;
    data.children.forEach((c) => {
      c["background-color"] = store.colors.sub.value;
      c.children.forEach(
        (cc) =>
          (cc["background-color"] =
            cc["background-color"] ?? store.colors.subsub.value)
      );
    });

    return {
      meta: {
        name: "DENKI-Mindmap",
      },
      format: "node_tree",
      data: data,
    };
  }

  return {
    markdownToMindmap,
  };
}

export default defineComponent({
  components: {
    Mindmap,
  },
  setup() {
    const { markdownToMindmap } = useMarkdownToMindmap();
    const store = useStore();

    const mindmapData = computed(() =>
      markdownToMindmap(store.inputText.value, store)
    );

    async function takeScreenshot() {
      const mindmapElement = document.querySelector<HTMLElement>(
        ".jsmind-inner"
      );
      if (!mindmapElement) return;
      toJpeg(mindmapElement, {
        quality: 0.95,
        backgroundColor: "white",
        pixelRatio: window.devicePixelRatio,
      }).then(function (dataUrl) {
        var link = document.createElement("a");
        link.download = `mindmap-${Date.now()}.jpeg`;
        link.href = dataUrl;
        link.click();
      });

      /*
      const svgDocument = elementToSVG(mindmapElement);
      await inlineResources(svgDocument.documentElement);
      const svgString = new XMLSerializer().serializeToString(svgDocument);
      console.log(svgString);*/
    }

    onMounted(async () => {
      /*
      const editor = new toastui.Editor({
        el: document.querySelector('#editor'),
        previewStyle: 'tab',
        height: '500px',
        initialValue: content
      });*/
    });

    const showCopyToClipboard = ref(false);

    return {
      version,
      mindmapData,

      mindmapTheme: store.colors.theme,
      inputText: store.inputText,
      isReadonly: store.isReadonly,
      takeScreenshot,
      getShareableLink: () => {
        navigator.clipboard.writeText(store.getShareableLink());
        showCopyToClipboard.value = true;
        setTimeout(() => (showCopyToClipboard.value = false), 1000);
      },
      colorsTopic: store.colors.topic,
      colorsSub: store.colors.sub,
      colorsSubSub: store.colors.subsub,
      colorsLink: store.colors.link,
      colorsTheme: store.colors.theme,
      showCopyToClipboard,
    };
  },
});
</script>

<style scoped>
.columns {
  display: flex;
  align-items: stretch;
}

.is-full-height {
  height: 100%;
}

.header {
  height: 1em;
  padding: 12px 24px;
  background: #f5f5f5;
  box-shadow: 0 1px 5px -1px rgba(0, 0, 0, 0.2);
}

.no-min-height {
  min-height: 0px;
}

.controls {
  display: flex;
  justify-content: space-around;
}

.group-picker {
  height: 21px;
  width: 21px;
  padding: 0;
  border: none;
  background: none;
}

.dropDown {
  background: none;
  padding: 5px 15px;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
}

.mindmap-container-wrapper {
  border-radius: 4px;
}

.hidden {
  display: none;
}

.full-height {
  min-height: 90vh;
}

.button-message {
  position: absolute;
  bottom: -10px;
  left: 5px;
  font-size: 0.8em;
  transition: bottom 0.1s ease-out;
  opacity: 0;
  pointer-events: none;
}

.button-message.show {
  bottom: -20px;
  opacity: 1;
}
</style>

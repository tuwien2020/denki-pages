import { computed, ComputedRef, ref, Ref, watch } from "vue";
import { JSONUncrush, JSONCrush } from "./libs/jsoncrush/JSONCrush";

export interface Store {
  readonly colors: {
    topic: Ref<string>;
    sub: Ref<string>;
    subsub: Ref<string>;
    link: Ref<string>;
    theme: Ref<string>;
  };
  readonly inputText: Ref<string>;
  readonly isReadonly: ComputedRef<boolean>;

  getShareableLink(): string;
}

export function useStore(): Store {
  const searchParameters = new URL(document.URL).searchParams;
  const isReadonly = computed(() => !!searchParameters.get("readonly"));
  const hasData = computed(() => !!searchParameters.get("data"));

  let mindmapName = "";
  if (hasData.value) {
    mindmapName = "url-mindmap-";
  }

  const colors = {
    topic: localStorageRef("colors-topic", "#0b5394"),
    sub: localStorageRef("colors-sub", "#9900ff"),
    subsub: localStorageRef("colors-sub-sub", "#9900ff"),
    link: localStorageRef("colors-link", "#f1c232"),
    theme: localStorageRef("colors-theme", "belizehole"),
  };

  const inputText = localStorageRef(
    "input-text",
    `# Themengebiet
## Unterthema A
- [Markdown Tutorial](https://commonmark.org/help/)

## Unterthema B
- Liste

## Unterthema C
- Liste
- mit 
  - mehreren
    - verschachtelten
- Elementen

## Unterthema D
- Liste
`
  );

  if (hasData.value) {
    let data: { [key: string]: any } = {};
    try {
      const searchParamData = searchParameters.get("data");
      data =
        searchParamData != null
          ? JSON.parse(JSONUncrush(decodeURIComponent(searchParamData)))
          : {};
    } catch (e) {
      console.error(e);
    }

    colors.theme.value = data?.colors?.theme;
    colors.topic.value = data?.colors?.topic;
    colors.sub.value = data?.colors?.sub;
    colors.subsub.value = data?.colors?.subsub;
    colors.link.value = data?.colors?.link;
    inputText.value = data?.text;
  }

  function localStorageRef(key: string, defaultValue: string): Ref<string> {
    const valueRef = ref(
      localStorage.getItem(mindmapName + key) ?? defaultValue
    );
    watch(valueRef, (value) => {
      if (value !== undefined) {
        localStorage.setItem(mindmapName + key, value);
      } else {
        localStorage.removeItem(mindmapName + key);
      }
    });
    return valueRef;
  }

  function getShareableLink(): string {
    const url = new URL(document.URL);
    url.searchParams.set("readonly", "true");
    url.searchParams.set(
      "data",
      JSONCrush(
        JSON.stringify({
          colors: {
            theme: colors.theme.value,
            topic: colors.topic.value,
            sub: colors.sub.value,
            subsub: colors.subsub.value,
            link: colors.link.value,
          },
          text: inputText.value,
        })
      )
    );

    return url + "";
  }

  return {
    colors,
    inputText,
    isReadonly,
    getShareableLink,
  };
}

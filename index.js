/**
 * @type {HTMLTextAreaElement}
 */
const inputTextareaElement = document.getElementById("input-area");
const inputColorMain = document.getElementById("colorPickerMain");
const inputColorSub = document.getElementById("colorPickerSub");
const inputColorLink = document.getElementById("colorPickerLink");

let options = {
  container: "mindmap-container",
  theme: "belizehole",
  editable: false,
  support_html: true,
};
let mindmap = jsMind.show(options);

marked.setOptions({
  pedantic: false,
});

/**
 *
 * @param {string} text
 */
function editedText(text) {
  // TODO: Url support
  // (Read only URL and stuff)
  localStorage["input-text"] = text;

  const parsed = marked.lexer(text);
  // console.log(parsed);

  let data = {
    id: "fake-root",
    topic: "DENKI-Mindmap",
    depth: 0,
    parent: null,
    children: [],
  };
  let current = data;
  let counter = 0;

  function tokensToString(tokens) {
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
        }
      })
      .join("");
  }

  function hasLink(tokens) {
    return tokens?.some((t) => t.type == "link" || hasLink(t.tokens));
  }

  function colorLink(tokens, node) {
    if (hasLink(tokens)) {
      node["background-color"] = localStorage["color-link"] ? localStorage["color-link"] :  "#f1c232";
    }
  }

  function convertListRecursive(value, parent) {
    if (value.type == "list") {
      return value.items.map((v) => {
        let newNode = {
          id: `id-${counter++}`,
          topic: tokensToString(v.tokens.filter((t) => t.type != "list")),
          depth: parent.depth + 1,
          parent: parent,
          children: [],
        };

        colorLink(v.tokens, newNode);

        newNode.children.push(
          ...v.tokens
            .filter((t) => t.type == "list")
            .flatMap((t) => convertListRecursive(t, newNode))
        );
        return newNode;
      });
    }
  }

  parsed.forEach((value) => {
    if (value.type == "heading") {
      if (value.depth > current.depth) {
        let newNode = {
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
        let newNode = {
          id: `id-${counter++}`,
          topic: tokensToString(value.tokens),
          depth: value.depth,
          parent: current.parent,
          children: [],
        };

        colorLink(value.tokens, newNode);

        current.parent.children.push(newNode);
        current = newNode;
      } else if (value.depth < current.depth) {
        let parent = current.parent;
        while (value.depth <= parent.depth) {
          parent = parent.parent;
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
  if (data.length == 0) {
    data.push({ id: "root", topic: "cat", children: [] });
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
  data["background-color"] = localStorage["color-main"] ? localStorage["color-main"] : "#0b5394";
  data.children.forEach((c) => (c["background-color"] = localStorage["color-sub"] ? localStorage["color-sub"] : "#9900ff"));  
  
  let mindmapJson = {
    meta: {
      name: "DENKI-Mindmap",
    },
    format: "node_tree",
    data: data,
  };

  mindmap.show(mindmapJson);
}

function takeScreenshot() {
  if (mindmap) {
    mindmap.screenshot.shootDownload();
  }
}

function pickColor(event, type){
  // Picker-Main: Themengebiet
  // Picker-Sub: Unterthemen
  // Picker-Link: Links
  if(event && event.target && type){
    let {value} = event.target;

    if(type === "main") localStorage["color-main"] = value;
    if(type === "sub") localStorage["color-sub"] = value;
    if(type === "link") localStorage["color-link"] = value;

    editedText(inputTextareaElement.value);
  }
}

inputTextareaElement.value =
  localStorage["input-text"] ??
  `# Themengebiet
## Unterthema A
- Liste
- mit 
  - mehreren
    - verschachtelten
- Elementen

## Unterthema B
- Liste
- [Link](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

## Unterthema C
- Liste

## Unterthema D
- Liste
`;

inputTextareaElement.addEventListener("input", () =>
  editedText(inputTextareaElement.value)
);

editedText(inputTextareaElement.value);
inputColorMain.value = localStorage["color-main"];
inputColorSub.value = localStorage["color-sub"];
inputColorLink.value = localStorage["color-link"];

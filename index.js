/**
 * @type {HTMLTextAreaElement}
 */
const inputTextareaElement = document.getElementById("input-area");

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
  console.log(parsed);

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
        if (t.type == "text") return t.text;
        else if (t.type == "link")
          return `<a href="${t.href.replace(/"/g, "%22")}">${t.text}</a>`;
      })
      .join("");
  }

  function colorLink(tokens, node) {
    if (tokens.some((t) => t.type == "link")) {
      node["background-color"] = "#f1c232";
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
  data["background-color"] = "#0b5394";
  data.children.forEach((c) => (c["background-color"] = "#9900ff"));

  console.log(data);

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

inputTextareaElement.value = localStorage["input-text"];

inputTextareaElement.addEventListener("input", () =>
  editedText(inputTextareaElement.value)
);

editedText(inputTextareaElement.value);

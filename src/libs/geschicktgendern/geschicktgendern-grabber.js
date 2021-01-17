// A little script to execute on the https://geschicktgendern.de/ Site

[
  ...(document.querySelector("#tablepress-1 tbody")?.querySelectorAll("tr") ??
    []),
]
  .map((v) => {
    let [wordElement, definitionElement] = v.querySelectorAll("td");

    let word = wordElement.innerText
      .replace(/\.\.\./g, "")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\([^\)]+\)/g, "")
      .trim();

    let definition = definitionElement.innerText.replace(
      /\[themify_icon[^\]]+\]/g,
      ""
    );

    return [word, definition];
  })
  .filter((v) => v[0].split(" ").length == 1 && !!v[1]);

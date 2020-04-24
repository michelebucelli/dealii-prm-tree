'use babel';

export default class DealiiPrmTreeView {
  // Constructor.
  constructor() {
    // Root element: just a div, for the moment.
    this.rootElement = document.createElement("div");
    this.rootElement.classList.add("dealii-prm-tree");
  }

  // Returns the text to be shown in tab.
  getTitle() { return "deal.II prm tree"; }

  // Get URI.
  getURI() { return 'atom://dealii-tree-view'; }

  // Default location: right.
  getDefaultLocation() { return "right"; }

  // Allowed locations: left, right.
  getAllowedLocations() { return [ "left", "right" ]; }

  // Preferred width.
  getPreferredWidth() { return 300; }

  // Get element.
  getElement() { return this.rootElement; }

  // Clear all elements but the root.
  clear() {
    while (this.rootElement.hasChildNodes())
      this.rootElement.removeChild(this.rootElement.firstChild);
  }

  // Updates the tree with given structure.
  update(tree) {
    this.clear();

    // Function to recursively process a single section/subsection.
    let processSection = function(root, section) {
      let sectionNode = document.createElement("li");
      sectionNode.classList.add("list-nested-item");

      let sectionName = document.createElement("div");
      sectionName.classList.add("list-item");
      sectionName.textContent = section.name;
      sectionName.targetLine = section.line;
      sectionName.onclick =
          function() { this.parentElement.classList.toggle("collapsed"); };
      sectionNode.appendChild(sectionName);

      let sectionList = document.createElement("ul");
      sectionList.classList.add("list-tree", "has-collapsable-children");

      // Add parameters.
      if (section.params)
        for (let i = 0; i < section.params.length; ++i) {
          let paramNode = document.createElement("li");
          paramNode.classList.add("list-item");
          paramNode.textContent = section.params[i].name;
          paramNode.targetLine = section.params[i].line;
          paramNode.onclick = function(e) {
            let editor;
            if (editor = atom.workspace.getActiveTextEditor())
              editor.setCursorBufferPosition([ this.targetLine, 0 ]);
          };
          sectionList.appendChild(paramNode);
        }

      // Add subsections.
      if (section.subsections)
        for (let i = 0; i < section.subsections.length; ++i)
          processSection(sectionList, section.subsections[i]);

      sectionNode.appendChild(sectionList);

      root.appendChild(sectionNode);
    };

    // Process all sections in the tree.
    let root = document.createElement("ul");
    root.classList.add("list-tree", "has-collapsable-children");
    if (tree.subsections)
      for (let i = 0; i < tree.subsections.length; ++i)
        processSection(root, tree.subsections[i]);

    this.rootElement.appendChild(root);
  }
}

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
      sectionNode.classList.add("dealii-prm-tree-section-node");
      sectionNode.classList.add("open");
      {
        let sectionWrapper = document.createElement("div");
        sectionWrapper.classList.add("dealii-prm-tree-section-wrapper");
        {
          let sectionToggle = document.createElement("span");
          sectionToggle.id = "toggle";
          sectionToggle.onclick = function(e) {
            this.parentElement.parentElement.classList.toggle("open");
            this.parentElement.parentElement.classList.toggle("closed");
          };
          sectionWrapper.appendChild(sectionToggle);

          let sectionName = document.createElement("span");
          sectionName.id = "name";
          sectionName.textContent = section.name;
          sectionName.targetLine = section.line;
          sectionName.onclick = function(e) {
            let editor;
            if (editor = atom.workspace.getActiveTextEditor())
              editor.setCursorBufferPosition([ this.targetLine, 0 ]);
          };
          sectionWrapper.appendChild(sectionName);
        }
        sectionNode.appendChild(sectionWrapper);

        let sectionList = document.createElement("ul");
        sectionList.classList.add("dealii-prm-tree-list");

        // Add parameters.
        if (section.params)
          for (let i = 0; i < section.params.length; ++i) {
            let paramNode = document.createElement("li");
            paramNode.classList.add("dealii-prm-tree-param-node");
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
      }

      root.appendChild(sectionNode);
    };

    // Process all sections in the tree.
    let root = document.createElement("ul");
    root.classList.add("dealii-prm-tree-list");
    if (tree.subsections)
      for (let i = 0; i < tree.subsections.length; ++i)
        processSection(root, tree.subsections[i]);

    this.rootElement.appendChild(root);
  }
}

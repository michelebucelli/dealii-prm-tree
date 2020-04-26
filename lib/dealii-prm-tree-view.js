'use babel';

export default class DealiiPrmTreeView {
  // Constructor.
  constructor() {
    // Stored tree.
    this.tree = null;

    // Registered tooltips.
    this.tooltips = [];

    // Root element: just a div.
    this.rootElement = document.createElement("div");
    this.rootElement.classList.add("dealii-prm-root");

    // Buttons at top.
    this.buttons = document.createElement("div");
    this.buttons.classList.add("btn-group");
    this.rootElement.appendChild(this.buttons);

    // Collapse all.
    this.btnCollapseAll = document.createElement("button");
    this.btnCollapseAll.textContent = "Collapse all";
    this.btnCollapseAll.classList.add("btn", "icon", "icon-fold");
    this.btnCollapseAll.onclick = () => { this.collapseAll(); };
    this.buttons.appendChild(this.btnCollapseAll);

    // Expand all.
    this.btnExpandAll = document.createElement("button");
    this.btnExpandAll.textContent = "Expand all";
    this.btnExpandAll.classList.add("btn", "icon", "icon-unfold");
    this.btnExpandAll.onclick = () => { this.expandAll(); };
    this.buttons.appendChild(this.btnExpandAll);

    // Element for the tree.
    this.treeElement = document.createElement("div");
    this.treeElement.classList.add("dealii-prm-tree");
    this.treeElement.classList.add("block");
    this.rootElement.appendChild(this.treeElement);

    // Fold status.
    this.foldStatus = {};
  }

  // Returns the text to be shown in tab.
  getTitle() { return "deal.II prm tree"; }

  // Get URI.
  getURI() { return 'atom://dealii-prm-tree-view'; }

  // Default location: right.
  getDefaultLocation() { return "right"; }

  // Allowed locations: left, right.
  getAllowedLocations() { return [ "left", "right" ]; }

  // Preferred width.
  getPreferredWidth() { return 300; }

  // Get element.
  getElement() { return this.rootElement; }

  // Clear all elements in the tree.
  clear() {
    for (let i = 0; i < this.tooltips.length; ++i)
      this.tooltips[i].dispose();
    this.tooltips = [];

    while (this.treeElement.hasChildNodes())
      this.treeElement.removeChild(this.treeElement.firstChild);
  }

  // Updates the tree with given structure.
  update(tree) {
    this.tree = tree;
    this.clear();

    if (!tree || !tree.subsections || tree.subsections.length == 0) {
      let message = document.createElement("div");
      message.textContent =
          "This ain't no prm file! Please open a prm file to view its content here.";
      message.classList.add("text-subtle");
      this.treeElement.appendChild(message);
      return;
    }

    // Function to recursively process a single section/subsection.
    let processSection = function(root, name, section, path, tooltips) {
      let sectionNode = document.createElement("li");
      sectionNode.classList.add("list-nested-item");

      if (section.collapsed)
        sectionNode.classList.add("collapsed");

      let sectionNameDiv = document.createElement("div");
      sectionNameDiv.classList.add("list-item");
      sectionNameDiv.section = section;
      sectionNameDiv.onclick = function() {
        this.parentElement.classList.toggle("collapsed");
        this.section.collapsed = !this.section.collapsed;
      };

      let sectionName = document.createElement("span");
      sectionName.classList.add("icon", "icon-file-directory");
      sectionName.textContent = name;
      if (atom.config.get("dealii-prm-tree.pathTooltipsOnHover"))
        sectionName.setAttribute("title", path);
      sectionNameDiv.appendChild(sectionName);
      sectionNode.appendChild(sectionNameDiv);

      let sectionList = document.createElement("ul");
      sectionList.classList.add("list-tree", "has-collapsable-children");

      // Add parameters.
      if (section.params)
        for (let i = 0; i < section.params.length; ++i) {
          let paramNode = document.createElement("li");
          paramNode.classList.add("list-item");
          if (atom.config.get("dealii-prm-tree.pathTooltipsOnHover"))
            paramNode.setAttribute("title",
                                   path + "/" + section.params[i].name);
          paramNode.id = "param";

          let paramName = document.createElement("span");
          paramName.textContent = section.params[i].name;
          paramName.id = "name";
          paramNode.appendChild(paramName);

          if (atom.config.get("dealii-prm-tree.showParameterValues")) {
            let paramValue = document.createElement("span");
            paramValue.textContent = section.params[i].value;
            paramValue.classList.add("text-subtle");
            paramValue.id = "value";
            paramNode.appendChild(paramValue);
          }

          paramNode.targetLine = section.params[i].line;
          paramNode.onclick = function(e) {
            let editor;
            if (editor = atom.workspace.getActiveTextEditor()) {
              editor.setCursorBufferPosition([ this.targetLine, 0 ]);
              if (atom.config.get("dealii-prm-tree.focusEditorOnClick"))
                atom.workspace.paneForItem(editor).activate();
            }
          };
          sectionList.appendChild(paramNode);
        }

      // Add subsections.
      if (section.subsections)
        for (let [key, value] of section.subsections)
          processSection(sectionList, key, value, path + "/" + key, tooltips);

      sectionNode.appendChild(sectionList);

      root.appendChild(sectionNode);
    };

    // Process all sections in the tree.
    let root = document.createElement("ul");
    root.classList.add("list-tree", "has-collapsable-children");

    if (tree.subsections)
      for (let [key, value] of tree.subsections)
        processSection(root, key, value, key, this.tooltips);

    this.treeElement.appendChild(root);
  }

  collapseAll() {
    let collapseSection = function(section) {
      section.collapsed = 1;
      if (section.subsections)
        for (let [key, value] of section.subsections)
          collapseSection(value);
    };

    if (this.tree && this.tree.subsections) {
      for (let [key, value] of this.tree.subsections)
        collapseSection(value);
      this.update(this.tree);
    }
  }

  expandAll() {
    let expandSection = function(section) {
      section.collapsed = 0;
      if (section.subsections)
        for (let [key, value] of section.subsections)
          expandSection(value);
    };

    if (this.tree && this.tree.subsections) {
      for (let [key, value] of this.tree.subsections)
        expandSection(value);
      this.update(this.tree);
    }
  }
}

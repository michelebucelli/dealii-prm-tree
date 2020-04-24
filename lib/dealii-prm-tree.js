'use babel';

import {CompositeDisposable} from 'atom';
import DealiiPrmTreeView from './dealii-prm-tree-view.js';

export default {

  subscriptions: null,
  prmTreeView: null,

  // Stores the pair filename-tree for each file
  trees: new Map(),

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.updateSubscription = new CompositeDisposable();

    // Create prm-tree view.
    this.prmTreeView = new DealiiPrmTreeView();

    // Register command that toggles this view.
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'dealii-prm-tree:toggle' : () => {
        atom.workspace.toggle('atom://dealii-prm-tree-view');
        this.update();
      }
    }));

    // Open panel for toggle commands
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === 'atom://dealii-prm-tree-view')
        return this.prmTreeView;
    }));

    // Update when tabs stop changing
    this.subscriptions.add(
        atom.workspace.onDidStopChangingActivePaneItem(() => {
          this.update();
          this.updateSubscription.dispose();
          let editor = atom.workspace.getActiveTextEditor();
          if (editor)
            this.updateSubscription =
                editor.onDidStopChanging(() => { this.update(); });
        }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.updateSubscription.dispose();
    this.prmTreeView.destroy();
  },

  serialize() {},

  update() { this.prmTreeView.update(this.readPrmFile());},

  readPrmFile() {
    // Retrieve text editor.
    let editor = atom.workspace.getActiveTextEditor();
    if (!editor)
      return {subsections : []};

    // Check that the file ends with the extension .prm before parsing.
    let filename = editor.getTitle();
    if (filename.substr(filename.length - 4, 4) != ".prm")
      return {subsections : []};

    // See if a tree for current file has already been computed. If so, we use
    // that tree to preserve the collapsed state of subsections.
    let oldTree = this.trees.get(filename);
    let oldTreePath = oldTree;

    let text = editor.getText();  // Get text editor content for parsing.
    let lines = text.split("\n"); // Split lines.
    let treeRoot = {subsections : new Map()};
    let currentPath = [ treeRoot ];

    let pattern_subsection = /\s*subsection\s*([\w\s-:]*)/;
    let pattern_parameter = /\s*set\s*([\w\s-:]*)\s*=/;
    let pattern_end = /^(\s*)end(\s*)$/;

    for (let i = 0; i < lines.length; ++i) {
      let match;

      // Subsection keyword: create a new subsection object, add it to the tree,
      // than move down to that subsection.
      if (match = pattern_subsection.exec(lines[i] + "\n")) {
        let newSection =
            {line : i, params : [], subsections : new Map(), collapsed : 0};
        currentPath[currentPath.length - 1].subsections.set(match[1],
                                                            newSection);
        currentPath.push(newSection);
      }

      // Parameter: create a new parameter object and add it to the tree.
      else if (match = pattern_parameter.exec(lines[i] + "\n")) {
        let newParam = {name : match[1], line : i};
        currentPath[currentPath.length - 1].params.push(newParam);
      }

      // End keyword: move up the tree.
      else if (match = pattern_end.exec(lines[i] + "\n"))
        currentPath.pop();
    }

    this.trees.set(filename, treeRoot);
    return treeRoot;
  }
}

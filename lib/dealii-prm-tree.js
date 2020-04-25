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

  update() {
    let tree = this.readPrmFile();
    this.prmTreeView.update(tree);
  },

  readPrmFile() {
    // Retrieve text editor.
    let editor = atom.workspace.getActiveTextEditor();
    if (!editor)
      return {subsections : []};

    // Check that the file ends with the extension .prm before parsing.
    let filename = editor.getTitle();
    if (filename.substr(filename.length - 4, 4) != ".prm")
      return {subsections : []};

    let text = editor.getText();  // Get text editor content for parsing.
    let lines = text.split("\n"); // Split lines.

    let treeRoot = {subsections : new Map()};
    let currentPath = [ treeRoot ];
    let oldTree = this.trees.get(filename);
    let oldTreePath = [ oldTree ];

    // Regex patterns for matching subsections, parameters, section ends.
    let pattern_subsection = /\s*subsection\s*([\w\s-:]*)/;
    let pattern_parameter = /\s*set\s*([\w\s-:]*)\s*=\s*([\w\s./\\:-]*)/;
    let pattern_end = /^(\s*)end(\s*)$/;

    for (let i = 0; i < lines.length; ++i) {
      let match;

      // Subsection keyword: create a new subsection object, add it to the tree,
      // than move down to that subsection.
      if (match = pattern_subsection.exec(lines[i] + "\n")) {
        let oldTreeSection =
            oldTree && oldTreePath[oldTreePath.length - 1] &&
                    oldTreePath[oldTreePath.length - 1].subsections
                ? oldTreePath[oldTreePath.length - 1].subsections.get(match[1])
                : undefined;

        let newSection = {
          line : i,
          params : [],
          subsections : new Map(),
          collapsed : oldTreeSection ? oldTreeSection.collapsed : 0
        };

        currentPath[currentPath.length - 1].subsections.set(match[1],
                                                            newSection);
        currentPath.push(newSection);
        oldTreePath.push(oldTreeSection);
      }

      // Parameter: create a new parameter object and add it to the tree.
      else if (match = pattern_parameter.exec(lines[i] + "\n")) {
        let newParam = {name : match[1], line : i, value : match[2]};
        currentPath[currentPath.length - 1].params.push(newParam);
      }

      // End keyword: move up the tree.
      else if (match = pattern_end.exec(lines[i] + "\n")) {
        currentPath.pop();
        oldTreePath.pop();
      }
    }

    this.trees.set(filename, treeRoot);
    return treeRoot;
  }
}

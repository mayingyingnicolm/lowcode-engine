import { computed, makeObservable, obx } from '@alilc/lowcode-editor-core';
import { Designer, isLocationChildrenDetail, isPageSchema } from '@alilc/lowcode-designer';
import TreeNode from './tree-node';
import { Tree } from './tree';
import { Backup } from './views/backup-pane';
import { Schema } from 'inspector';

export interface ITreeBoard {
  readonly visible: boolean;
  readonly at: string | symbol;
  scrollToNode(treeNode: TreeNode, detail?: any): void;
}

export class TreeMaster {
  readonly designer: Designer;
  constructor(designer: Designer) {
    makeObservable(this);
    this.designer = designer;
    let startTime: any;
    designer.dragon.onDragstart(() => {
      startTime = Date.now() / 1000;
      // needs?
      this.toVision();
    });
    designer.activeTracker.onChange(({ node, detail }) => {
      const tree = this.currentTree;
      if (!tree || node.document !== tree.document) {
        return;
      }

      const treeNode = tree.getTreeNode(node);
      if (detail && isLocationChildrenDetail(detail)) {
        treeNode.expand(true);
      } else {
        treeNode.expandParents();
      }

      this.boards.forEach((board) => {
        board.scrollToNode(treeNode, detail);
      });
    });
    designer.dragon.onDragend(() => {
      const endTime: any = Date.now() / 1000;
      const editor = designer?.editor;
      const nodes = designer.currentSelection?.getNodes();
      editor?.emit('outlinePane.drag', {
        selected: nodes
          ?.map((n) => {
            if (!n) {
              return;
            }
            const npm = n?.componentMeta?.npm;
            return (
              [npm?.package, npm?.componentName].filter((item) => !!item).join('-') || n?.componentMeta?.componentName
            );
          })
          .join('&'),
        time: (endTime - startTime).toFixed(2),
      });
    });
    designer.editor.on('designer.document.remove', ({ id }) => {
      this.treeMap.delete(id);
    });
    let name = window.localStorage.getItem('name');
    let json = window.localStorage.getItem('json');
    console.log(name + ' ' + json);

    fetch('/noone/ul/system/ctrl/ComponentController/detail.uli?name=' + name + '&json=' + encodeURIComponent(json != null ? json : ''), { method: 'GET', mode: 'cors' })
      .then(res => { return res.json(); })
      .then(json => {
        console.log('获取的结果', json.data);
        const doc1 = this.designer?.currentDocument;
        let schema = JSON.parse(json.data.schema);
        console.log('schema');
        console.log(schema);
        if (this.designer.project.documents.length <= 1) {
          this.designer.project.createDocument(schema);
          console.log(this.designer.project.documents);
        }

      });
  }

  private toVision() {
    const tree = this.currentTree;
    if (tree) {
      tree.document.selection.getTopNodes().forEach((node) => {
        tree.getTreeNode(node).setExpanded(false);
      });
    }
  }

  @obx.shallow private boards = new Set<ITreeBoard>();

  addBoard(board: ITreeBoard) {
    this.boards.add(board);
  }

  removeBoard(board: ITreeBoard) {
    this.boards.delete(board);
  }

  hasVisibleTreeBoard() {
    for (const item of this.boards) {
      if (item.visible && item.at !== Backup) {
        return true;
      }
    }
    return false;
  }

  async purge() {
    // todo others purge
  }

  private treeMap = new Map<string, Tree>();

  @computed get currentTree(): Tree | null {
    const doc = this.designer?.currentDocument;
    if (doc) {
      const { id } = doc;
      if (this.treeMap.has(id)) {
        return this.treeMap.get(id)!;
      }
      const tree = new Tree(doc);
      this.treeMap.set(id, tree);
      return tree;
    }
    return null;
  }

  @computed get myTree(): Tree | null {

      const doc = this.designer.project.documents[1];
      console.log('1111');
      console.log(doc);
      if (doc) {
        const { id } = doc;
        if (this.treeMap.has(id)) {
          return this.treeMap.get(id)!;
        }
        const tree = new Tree(doc);
        this.treeMap.set(id, tree);
        return tree;
      }
      return null;
  }
}

const mastersMap = new Map<Designer, TreeMaster>();
export function getTreeMaster(designer: Designer): TreeMaster {
  let master = mastersMap.get(designer);
  if (!master) {
    master = new TreeMaster(designer);
    mastersMap.set(designer, master);
  }
  return master;
}

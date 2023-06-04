import React, { Component } from 'react';
import { observer, globalContext } from '@alilc/lowcode-editor-core';
import { intl } from '../locale';
import { OutlineMain } from '../main';
import TreeView from './tree';
import './style.less';
import { IEditor } from '@alilc/lowcode-types';

@observer
export class MyPane extends Component<{ config: any; editor: IEditor }> {
  private main = new OutlineMain(globalContext.get('editor'), this.props.config.name || this.props.config.pluginKey);

  componentWillUnmount() {
    this.main.purge();
  }

  render() {
    const myTree = this.main.myTree;
    console.log('myTree');
    console.log(myTree);
    if (!myTree) {
      return (
        <div className="lc-outline-pane">
          <p className="lc-outline-notice">{intl('Initializing')}</p>
        </div>
      );
    }

    return (
      <div className="lc-outline-pane">
        <div ref={(shell) => this.main.mount(shell)} className="lc-outline-tree-container">
          <TreeView key={myTree.id} tree={myTree} />
        </div>
      </div>
    );
  }
}

import {
  window as Win,
} from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import { Telemetry } from '@sqltools/core/utils';

export default class AutoInstaller {
  constructor(public client: LanguageClient, public telemetry: Telemetry) {}

  async requestToInstall({ moduleName, moduleVersion, conn }) {
    const installNow = 'Install now';
    const readMore = 'Read more';
    const options = [readMore, installNow];
    const r = await Win.showInformationMessage(
      `You need "${moduleName}@${moduleVersion}" to connect to ${conn.name}.`,
      ...options,
    );
    switch (r) {
      case installNow:
      break;
      case readMore:
        // @TODO: link to the wiki and create docs
        require('opn')('https://mtxr.gitbook.io/vscode-sqltools/-----------');
        break;
    }
  }
}
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/

'use strict';

import vscode = require('vscode');
import {LuaFileSymbles} from './utils/luaFileSymbles'

export class LuaDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.SymbolInformation[]> {
        return new Promise<vscode.SymbolInformation[]>((resolve, reject) => {
            resolve(new LuaFileSymbles(document).parseFile(document.getText()));
        });
    }
}
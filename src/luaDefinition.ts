'use strict';

import vscode = require('vscode');
import {LuaFileSymbles} from './utils/luaFileSymbles'
var parser = require('luaparse');

export interface LuaDefinitionInformtation {
	file: string;
    range: vscode.Range
}

export function definitionLocation(document: vscode.TextDocument, position: vscode.Position, includeDocs = true): Promise<LuaDefinitionInformtation> {
	return new Promise<LuaDefinitionInformtation>((resolve, reject) => {
        let text = document.getText(document.getWordRangeAtPosition(position));
        let line:vscode.TextLine = document.lineAt(position);
        let range:vscode.Range = document.getWordRangeAtPosition(position);
        let start = range.start.character;
        let end = range.end.character;
        for (var i = range.start.character; i >= line.firstNonWhitespaceCharacterIndex; i--) {
            var char = line.text.charAt(i);
            if (! /[\w\.]/.test(char)) {
                break
            }
            start = i;
        }
        
        let prefer_text:string = line.text.substring(start, end); 
        let symbles:vscode.SymbolInformation[] = new LuaFileSymbles(document).parseFile(document.getText());

        for (var index = 0; index < symbles.length; index++) {
            var element:vscode.SymbolInformation = symbles[index];
            if (element.name.startsWith(prefer_text)) {
                let definition:LuaDefinitionInformtation = {
                    file: document.fileName,
                    range: element.location.range
                };
                resolve(definition)
            }
        }

        resolve(null);
	});
}

export class LuaDefinitionProvider implements vscode.DefinitionProvider{
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location> {
            return definitionLocation(document, position, false).then(definitionInfo => {
                if (definitionInfo == null) return null;
                let definitionResource = vscode.Uri.file(definitionInfo.file);
                return new vscode.Location(definitionResource, definitionInfo.range);
            });
        }    
}
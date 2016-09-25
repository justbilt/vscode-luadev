import vscode = require('vscode');
var parser = require('luaparse');

export class LuaFileSymbles {
    private _document: vscode.TextDocument;

    constructor(document: vscode.TextDocument){
        this._document = document;
    }

    public parseFile(filedata: string): vscode.SymbolInformation[] {
        var ast = parser.parse(filedata, { "ranges": true });
        let symbols: vscode.SymbolInformation[] = [];

        if (ast["body"]) {
            this.parseBody(1, ast["body"], symbols);
        }

        return symbols;
    }    

    private parseSymbleName(identifier:any): string{
        if (identifier["type"] == "Identifier") {
            return identifier["name"]
        }
        else if (identifier["type"] == "MemberExpression") {
            return this.parseSymbleName(identifier["base"]) + identifier["indexer"] + identifier["identifier"]["name"]
        }
        return "unknown"
    }
    private convertFunc(identifier:any, parameters:any, range:any, parent?:any):vscode.SymbolInformation {
        var name = this.parseSymbleName(identifier)
        if (parent) {
            name = this.parseSymbleName(parent) + "." + name
        }
        var params = [];
        for (var i = 0; i < parameters.length; i++) {
            var element = parameters[i];
            if (element["type"] == "Identifier") {
                params.push(element["name"])
            }
        }
        let params_text = params.join(",")
        var label = `${name}(${params_text})`
        return new vscode.SymbolInformation(label, vscode.SymbolKind.Function, new vscode.Range(this._document.positionAt(range[0]), this._document.positionAt(range[1])));
    };
    private convertVar(identifier:any, range:any):vscode.SymbolInformation {
        return new vscode.SymbolInformation(this.parseSymbleName(identifier), vscode.SymbolKind.Variable, new vscode.Range(this._document.positionAt(range[0]), this._document.positionAt(range[1])));
    };
    private parseBody(level:number, body:any, symbols:vscode.SymbolInformation[]) {
        for (var i = 0; i < body.length; i++) {
            var element = body[i];
            switch (element["type"]) {
                case "FunctionDeclaration":{
                    var id = element["identifier"];
                    switch (id["type"]) {
                        case "MemberExpression":
                        case "Identifier":
                            symbols.push(this.convertFunc(id, element["parameters"], element["range"]));
                            break;
                        default:
                            break;
                    };
                    break;
                }
                case "AssignmentStatement":
                case "LocalStatement":{
                    for (var ii = 0; ii < element["init"].length; ii++) {
                        var vv = element["init"][ii];
                        if (vv["type"] == "TableConstructorExpression") {
                            for (var iii = 0; iii < vv["fields"].length; iii++) {
                                var vvv = vv["fields"][iii];
                                if (vvv["value"]["type"] == "FunctionDeclaration"){
                                    symbols.push(this.convertFunc(vvv["key"], vvv["value"]["parameters"], vvv["value"]["range"], element["variables"][ii]));
                                } 
                            }
                        }
                        else if (vv["type"] == "FunctionDeclaration") {
                            symbols.push(this.convertFunc(element["variables"][ii], vv["parameters"], vv["range"]));   
                        }
                        else {
                            symbols.push(this.convertVar(element["variables"][ii], vv["range"]));
                        }
                    }
                }
                default:
                    break;
            };
        };
    };
}
const _ = require('lodash');
const vscode = require('vscode');
const {
    getAST,
    getNodesByType,
    getNodeRange,
    findMatchingNode,
} = require('./babel');

const defaultDecoartionRenderOptions = {
	backgroundColor: 'green',
	border: '2px solid white',
};

const decorateActiveEditor = habits => {
    const editor = vscode.window.activeTextEditor;
    const code = editor.document.getText();
    const ast = getAST(code);
    
    _.forEach(habits, ({babelNodeType, structure, mrkdwn, decorationRenderOptions = defaultDecoartionRenderOptions}) => {
        const roots = getNodesByType(ast, babelNodeType);

        const decorationOptions = _.reduce(roots, (res, root) => {
            const matchingNode = findMatchingNode(root, structure);

            if (!matchingNode) {
                return res;
            }

            return [
                ...res,
                {
                    range: getNodeRange(matchingNode),
                    hoverMessage: new vscode.MarkdownString(mrkdwn),
                }
            ];
        }, []);

        const decorationType = vscode.window.createTextEditorDecorationType(decorationRenderOptions);
        editor.setDecorations(decorationType, decorationOptions);
    });
};

module.exports = {
    decorateActiveEditor,
};

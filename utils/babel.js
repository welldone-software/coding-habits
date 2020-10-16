const _ = require('lodash');
const babel = require('@babel/core');
const babelPresetReact = require('@babel/preset-react');
const babelPluginProposalOptionalChaining = require('@babel/plugin-proposal-optional-chaining');
const traverse = require('@babel/traverse').default;
const vscode = require('vscode');
const { matchAll } = require('match-index');
const { nodeTypeToUnicodeMap } = require('./mapping');

const getAST = code => babel.parseSync(code, {
    presets: [babelPresetReact],
    plugins: [[babelPluginProposalOptionalChaining, { loose: true }]],
});

const getNodesByType = (ast, nodeType) => {
    const nodes = [];

    traverse(ast, {
        enter(path) {
            if (path.node.type === nodeType) {
                nodes.push(path.node);
            }
        }
    });

    return nodes;
};

const getNodeRange = node => {
    const { loc: { start, end } } = node;

    return new vscode.Range(
        new vscode.Position(start.line - 1, start.column),
        new vscode.Position(end.line - 1, end.column),
    );
};

const convertNodeBodyToShrinkedBabelString = nodeBody => {
    if (!Array.isArray(nodeBody)) {
        return nodeTypeToUnicodeMap[`{${nodeBody.type}}`];
    }

    return _.reduce(nodeBody, (res, node) =>
        `${res}${nodeTypeToUnicodeMap[`{${node.type}}`]}`, '');
};

const shrinkBabelExpression = babelExpression => {
    const uniqueNodeTypeKeys = [...new Set(babelExpression.match(/({[^}]+})/g))];
    
    return _.reduce(uniqueNodeTypeKeys, (res, nodeTypeKey) =>
        res.replace(new RegExp(nodeTypeKey, 'g'), nodeTypeToUnicodeMap[nodeTypeKey]), babelExpression);
}

const findMatchingNode = (root, structure) => {

    const recurse = (node, structure) => {
        const { body: nodeBody } = node;

        if (!nodeBody) {
            return;
        }
        
        const { babelExpression, structure: subStructure } = structure;
        const shrinkedBabelStringOfNodeBody = convertNodeBodyToShrinkedBabelString(nodeBody);
        const shrinkedBabelExpression = shrinkBabelExpression(babelExpression);
        const match = matchAll(shrinkedBabelStringOfNodeBody, new RegExp(shrinkedBabelExpression, 'g'));

        if (_.isEmpty(match)) {
            return false;
        }

        if (_.isEmpty(match[0].captureGroups)) {
            return false;
        }

        if (Array.isArray(nodeBody)) {
            const firstGroupMatchIndex = match[0].captureGroups[0].index;
            const matchingNode = nodeBody[firstGroupMatchIndex];

            return matchingNode;
        }

        if (!subStructure) {
            return nodeBody;
        }

        return recurse(nodeBody, subStructure);
    }
    
    return recurse(root, structure);
};

module.exports = {
    getAST,
    getNodesByType,
    getNodeRange,
    findMatchingNode,
};

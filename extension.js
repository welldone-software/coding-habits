const vscode = require('vscode');
const { decorateActiveEditor } = require('./utils/decorator');

const activate = async () => {
	const config = vscode.workspace.getConfiguration('codingHabits');
	const habits = config.get('habits');
	
	vscode.workspace.onWillSaveTextDocument(() => decorateActiveEditor(habits));
	decorateActiveEditor(habits);
};

exports.activate = activate;

module.exports = {
	activate,
};

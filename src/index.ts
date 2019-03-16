import * as Babel from '@babel/core';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getWithDefault } from 'get-optional';
import publicComponentApi from './public-component-api';

type RenameConfig = {
	newName: string;
};

type OriginalPropertyName = string;

type VisitorState = {
	className: undefined | string;
	renames: Map<OriginalPropertyName, RenameConfig>;
};

type ClassExprDecl = t.ClassDeclaration | t.ClassExpression;

function VisitMehtod(path: NodePath<t.ClassMethod>, state: VisitorState) {
	const { key } = path.node;
	if (key.type !== 'Identifier' || publicComponentApi.has(key.name)) {
		return;
	}
	const id = path.scope.generateUidIdentifier('a');
	state.renames.set(key.name, {
		newName: id.name,
	});
	path.node.key = id;
}

function VisitClass(path: NodePath<ClassExprDecl>) {
	const state: VisitorState = {
		className: getWithDefault('unknown', path.node.id, 'name'),
		renames: new Map(),
	};
	path.traverse(classVisitor, state);
}

const classVisitor: Babel.Visitor<VisitorState> = {
	ClassMethod: VisitMehtod,
};

export default function(): Babel.PluginObj<VisitorState> {
	return {
		visitor: {
			ClassDeclaration: VisitClass,
			ClassExpression: VisitClass,
		},
	};
}

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
type Member = t.ClassMethod | t.ClassProperty;

function VisitMember(path: NodePath<Member>, state: VisitorState) {
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
	if (!isReactClass(path.node)) {
		return;
	}

	const state: VisitorState = {
		className: getWithDefault('unknown', path.node.id, 'name'),
		renames: new Map(),
	};
	path.traverse(classVisitor, state);
}

function isReactClass({ superClass }: ClassExprDecl) {
	// TODO: More robust check for "extends React.Component"
	return (
		!!superClass &&
		superClass.type === 'Identifier' &&
		superClass.name === 'Component'
	);
}

function VisitMemberExpr(
	path: NodePath<t.MemberExpression>,
	state: VisitorState
) {
	const { node } = path;
	const property: t.Identifier = node.property;
	// TODO: Handle string literal expressions.
	// TODO: Handle expressions where LHS is a variable that points to `this`.
	// TODO: Bail here if there's an ambiguous this[computed] call?
	if (node.object.type !== 'ThisExpression' || property.type !== 'Identifier') {
		return;
	}
	const rename = state.renames.get(property.name);
	console.log('member expr', property.name, rename);
	// TODO: Allow properties to be declared in methods.
	if (!rename) {
		return;
	}
	property.name = rename.newName;
}

const classVisitor: Babel.Visitor<VisitorState> = {
	ClassMethod: VisitMember,
	ClassProperty: VisitMember,
	MemberExpression: VisitMemberExpr,
};

export default function(): Babel.PluginObj<VisitorState> {
	return {
		visitor: {
			ClassDeclaration: VisitClass,
			ClassExpression: VisitClass,
		},
	};
}

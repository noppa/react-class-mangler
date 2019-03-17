import * as Babel from '@babel/core';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { get } from 'get-optional';
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

	const id = path.scope.generateUid('c').replace('_', '');
	state.renames.set(key.name, {
		newName: id,
	});
	key.name = id;
}

function VisitClass(path: NodePath<ClassExprDecl>) {
	if (!isReactClass(path.node)) {
		return;
	}

	const state: VisitorState = {
		className: get(path.node.id, 'name'),
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

function renameIdentifier(property: t.Identifier, state: VisitorState) {
	const rename = state.renames.get(property.name);
	// TODO: Allow properties to be declared in methods.
	if (!rename) {
		return;
	}
	console.log(
		`Renaming ${state.className}.${property.name} to ${rename.newName}`
	);
	property.name = rename.newName;
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
	renameIdentifier(property, state);
}

function VisitVarDecl(
	path: NodePath<t.VariableDeclarator>,
	state: VisitorState
) {
	const { node } = path;
	if (
		!node.init ||
		node.init.type !== 'ThisExpression' ||
		node.id.type !== 'ObjectPattern'
	) {
		return;
	}

	for (const prop of node.id.properties) {
		// TODO: Handle RestElement
		if (prop.type === 'RestElement') {
			continue;
		}
		renameIdentifier(prop.key, state);
		if (prop.value.type === 'Identifier' && prop.shorthand) {
			// TODO: Handle (bail?) other types
			// const newName = path.scope.generateUid(prop.key.name);
			const newName = prop.key.name;
			path.scope.rename(prop.value.name, newName);
		}
	}
}

const classVisitor: Babel.Visitor<VisitorState> = {
	ClassMethod: VisitMember,
	ClassProperty: VisitMember,
	MemberExpression: VisitMemberExpr,
	VariableDeclarator: VisitVarDecl,
};

export default function(): Babel.PluginObj<VisitorState> {
	return {
		visitor: {
			ClassDeclaration: VisitClass,
			// TODO: Don't change property names twice
			// ClassExpression: VisitClass,
		},
	};
}

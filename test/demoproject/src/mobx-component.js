import React, { Component } from 'react';
import { observable, coputed, action } from 'mobx';
import { observer } from 'mobx-react';

@observer
class BasicComponent extends Component {
	/** @type{Person} */
	@observable.deep person;
	@coputed get greetings() {
		return `Hello ${this.person.getName()}!`;
	}

	@action setName = val => {
		const [firstName, lastName] = val.split(' ');
		Object.assign(this.person, { firstName, lastName });
	};

	render() {
		return (
			<div>
				<h1>{this.greetings}</h1>
				<div>
					<input value={this.person.getName()} onChange={this.setName} />
				</div>
			</div>
		);
	}
}

export const Person = class {
	constructor(firstName, lastName) {
		this.firstName = firstName;
		this.lastName = lastName;
	}

	getName() {
		return `${this.firstName} ${this.lastName}`;
	}
};

export default BasicComponent;

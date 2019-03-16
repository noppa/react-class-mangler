import React, { Component } from 'react';

class BasicComponent extends Component {
	greetings() {
		return 'Hello';
	}
	render() {
		return <div>{this.greetings()}</div>;
	}
}

export const FooClass = class {
	foo() {}
};

export default BasicComponent;

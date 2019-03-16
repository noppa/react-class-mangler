import React, { Component } from 'react';

class BasicComponent extends Component {
	greetings(i) {
		return 'Hello' + (--i ? this.greetings(i) : '');
	}
	render() {
		return <div>{this.greetings(5)}</div>;
	}
}

export const FooClass = class {
	foo() {}
};

export default BasicComponent;

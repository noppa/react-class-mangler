import React, { Component } from 'react';

class BasicComponent extends Component {
	foo = 5;
	greetings(i) {
		return 'Hello' + (--i ? this.greetings(i) : '');
	}
	render() {
		const { foo } = this;
		return (
			<div>
				{this.greetings(5)} {foo}
			</div>
		);
	}
}

export const FooClass = class {
	foo() {}
};

export default BasicComponent;

# virtual-scope
A library for manipulating scopes without having to worry about conflicting names

### Usage
```js
import Scope from 'virtual-scope';

// Create a new top-level scope.
const top = new Scope();

// Create two virtual scopes within the top scope.
const a = top.virtual();
const b = top.virtual();

// Define names...
a.define( 'foo' );

// ... that appear within only the expected scopes.
a.defines( 'foo' ); // true
b.defines( 'foo' ); // false

b.define( 'foo' );

b.bind( 'bar', a.reference( 'foo' ) );

assert.equal( b.lookup( 'bar' ), a.lookup( 'foo' ) ); // true

// With two virtual scopes both defining 'foo', we must
// deconflict names within the the scope.
top.deconflict();

// When we now lookup the actual names, we get:
a.lookup( 'foo' ).name; // 'foo'
b.lookup( 'foo' ).name; // '_foo'

// The names that are used in the scope are, unsurprisingly:
top.usedNames(); // [ '_foo', 'foo' ]
```

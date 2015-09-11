import assert from 'assert';

import Scope from '../src/Scope';
import unique from '../src/unique';

const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const letters = alphabet + alphabet.toUpperCase();

describe( 'Scope', function () {
	it( 'can define and bind names', function () {
		const scope = new Scope();

		// If I define 'a'...
		scope.define( 'a' );

		// ... and bind 'b' to a reference to 'a'...
		scope.bind( 'b', scope.reference( 'a' ) );

		// ... lookups for 'a' and 'b' should both
		// resolve to the same identifier.
		assert.equal( scope.lookup( 'b' ), scope.lookup( 'a' ) );
	});

	describe( 'parent:', function () {
		const parent = new Scope();
		const child = new Scope( parent );

		it( 'allows children access to its names', function () {
			// A name defined in a parent scope...
			parent.define( 'a' );

			// ... should yield the same identifier, regardless of where it's looked up.
			assert.equal( child.lookup( 'a' ), parent.lookup( 'a' ) );
		});

		it( 'can tell what names are in scope', function () {
			// Names defined in a scope should be considered to be in that scope,
			assert.equal( parent.inScope( 'a' ), true );

			// as well as any child scopes,
			assert.equal( child.inScope( 'a' ), true );

			// but not in other scopes.
			assert.equal( new Scope().inScope( 'a' ), false );
		});

		it( 'names in the child scope shadows the parent', function () {
			// If a child defines the same name as it's parent...
			child.define( 'a' );

			// ... it shadows lookups for that name.
			assert.notEqual( child.lookup( 'a' ), parent.lookup( 'a' ) );

			// Names defined by a child...
			child.define( 'b' );

			// ... aren't accessible from parents.
			assert.equal( parent.lookup( 'b' ), undefined );
		});

		it( 'can tell if a name is defined in this scope', function () {
			// Both parent and child define 'a'...
			assert.equal( parent.defines( 'a' ), true );
			assert.equal( child.defines( 'a' ), true );

			// ... but only child defines 'b'.
			assert.equal( parent.defines( 'b' ), false );
			assert.equal( child.defines( 'b' ), true );
		});

		it( 'can return the list of referenced names', function () {
			assert.deepEqual( parent.getNames(), [ 'a' ] );
			assert.deepEqual( child.getNames(), [ 'a', 'b' ] );
		});
	});

	describe( 'virtual scope:', function () {
		let real, a, b;

		beforeEach(function () {
			real = new Scope();
			a = real.virtual();
			b = real.virtual();
		});

		it( 'is created within another scope', function () {
			// The actual ids are the same.
			assert.equal( real.ids, a.ids );
			assert.equal( real.ids, b.ids );
		});

		it( 'lookups different identifiers', function () {
			// If I define 'a' in both scopes...
			a.define( 'a' );
			b.define( 'a' );

			// ... the name 'a' should lookup different identifiers.
			assert.notEqual( a.lookup( 'a' ), b.lookup( 'a' ) );
		});

		it( 'can deconflict names', function () {
			a.define( 'a' );
			b.define( 'a' );

			// Deconflicting the actual scope should make all identifiers unique.
			real.deconflict();

			assert.deepEqual( real.usedNames(), [ '_a', 'a' ] );
		});

		it( 'deconflicts with a custom function, if provided', function () {
			for (var i = 0; i < 26; i++) {
				// Create 26 scopes, all of which define 'a'.
				real.virtual().define( 'a' );
			}

			// Custom deconfliction function which ignores the current name.
			var num = 10;
			real.deconflict( function () {
				return (num++).toString(36);
			});

			assert.deepEqual( real.usedNames(), alphabet );

			// Deconflicting twice has no additional effect.
			real.deconflict();
			assert.deepEqual( real.usedNames(), alphabet );
		});

		it( 'mangling deconfliction', function () {
			for (let i = 0; i < 10000; i++) {
				// Maximal conflicts: Create 10,000 scopes, all of which define 'a'.
				real.virtual().define( 'a' );
			}

			real.deconflict( unique() );

			const names = Object.keys( real.used );

			// It starts out with the alphabet.
			assert.deepEqual( names.slice( 0, 52 ), letters );

			assert.equal( names[ 52 ] , '$' );
			assert.equal( names[ 106 ] , '$1' );
			assert.equal( names[ 5398 ] , '$z1' );
		});
	});

	it( 'dedupes-external-imports', function () {
		var real = new Scope();

		var external = real.virtual(),
			locals = real.virtual(),
			exports = real.virtual();

		external.define( 'Component' );

		locals.bind( 'Comp', external.reference( 'Component' ) );

		exports.bind( 'default', locals.reference( 'Foo' ) );

		try {
			real.deconflict();
			assert.ok( false, 'Scope.deconflict should throw with "Foo" undefined' );
		} catch ( ignore ) {
			// as expected
		}

		locals.define( 'Foo' );

		real.deconflict();
	});
});

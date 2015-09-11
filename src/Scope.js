const create = Object.create;
const keys = Object.keys;
const isArray = Array.isArray;

// A minimal `Identifier` implementation. Anything that has an `originalName`,
// and a mutable `name` property can be used as an `Identifier`.
function Identifier ( name ) {
	this.originalName = this.name = name;
}

// A reference to an `Identifier`.
function Reference ( ids, index ) {
	this.ids = ids;
	this.index = index;
}

// Dereferences a `Reference`.
function dereference ( scope, [ depth, index ] ) {
	while ( depth-- ) scope = scope.parent;

	return scope.ids[ index ];
}

function isntReference ( id ) {
	return !isArray( id );
}

// Prefix the argument with '_'.
function underscorePrefix ( x ) {
	return '_' + x;
}

// ## Scope
// A Scope is a mapping from string names to `Identifiers`.
export default class Scope {
	constructor ( parent ) {
		this.ids = [];
		this.names = create(null);

		this.parent = parent || null;
		this.used = create(null);

		this.isDeconflicted = false;
	}

	// Binds the `name` to the given reference `ref`.
	bind ( name, ref ) {
		let scope = this;
		let depth = 0;

		while ( ref.ids !== scope.ids ) {
			if ( !scope.parent ) throw new Error( `Reference not in scope!` );

			scope = scope.parent;
			depth += 1;
		}

		this.ids[ this.index( name ) ] = [ depth, ref.index ];
	}

	// Deconflict all names within the scope,
	// using the given renaming function.
	// If no function is supplied, `underscorePrefix` is used.
	deconflict ( rename = underscorePrefix ) {
		if ( this.isDeconflicted ) return;
		this.isDeconflicted = true;

		const names = this.used;

		this.ids.filter( isArray ).forEach( ref => {
			const [ depth ] = ref;

			// Same scope.
			if ( !depth ) return;

			// Another scope!
			do {
				ref = dereference( ref );
			} while ( isArray( ref ) );

			names[ ref.name ] = ref;
		});

		this.ids.filter( isntReference ).forEach( id => {
			if ( typeof id === 'string' ) {
				throw new Error( `Required name "${id}" is undefined!` );
			}

			let name = id.name;

			while ( name in names && names[ name ] !== id ) {
				name = rename( name );
			}
			names[ name ] = id;

			id.name = name;
		});
	}

	// Defines `name` in the scope to be `id`.
	// If no `id` is supplied, a plain `Identifier` is created.
	define ( name, id ) {
		this.ids[ this.index( name ) ] = id || new Identifier( name );
	}

	// TODO: rename! Too similar to `define`.
	defines ( name ) {
		return name in this.names;
	}

	// Returns the list of `identifier`s referenced in this scope.
	getIds () {
		return keys( this.names ).map( name => this.lookup( name ) );
	}

	// Return the list of names referenced in the scope.
	getNames () {
		return keys( this.names );
	}

	// *private, don't use*
	//
	// Return `name`'s index in the `ids` array if it exists,
	// otherwise returns the index to a new placeholder slot.
	index ( name ) {
		if ( !( name in this.names ) ) {
			return this.names[ name ] = this.ids.push( name ) - 1;
		}

		return this.names[ name ];
	}

	// Returns true if `name` is in Scope.
	inScope ( name ) {
		if ( name in this.names ) return true;

		return this.parent ? this.parent.inScope( name ) : false;
	}

	// Lookup the identifier referred to by `name`.
	lookup ( name ) {
		if ( !( name in this.names ) && this.parent ) {
			return this.parent.lookup( name );
		}

		let id = this.ids[ this.names[ name ] ];

		if ( isArray( id ) ) {
			id = dereference( this, id );
		}

		return id;
	}

	// Get a reference to the identifier `name` in this scope.
	reference ( name ) {
		return new Reference( this.ids, this.index( name ) );
	}

	// Return the used names of the scope.
	// Names aren't considered used unless they're deconflicted.
	usedNames () {
		return keys( this.used ).sort();
	}

	// Create and return a virtual `Scope` instance, bound to
	// the actual scope of `this`, optionally inherit the parent scope.
	virtual ( inheritParent ) {
		const scope = new Scope( inheritParent ? this.parent : null );
		scope.ids = this.ids;
		return scope;
	}
}

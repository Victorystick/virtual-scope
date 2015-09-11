
const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const letters = alphabet + alphabet.toUpperCase();

const first = letters + '$_';
const others = '0123456789' + first;

export default function () {
	let i = -1;

	// Ignore the current name, and return the next available name.
	return function namer () {
		i += 1;
		return first[ i % first.length ] + rest( idiv( i , first.length ), '' );
	};
}

function idiv ( x, y ) {
	return ( x / y )|0;
}

function rest ( n, str ) {
	if ( n > 0 ) {
		return rest( idiv( n, others.length ), str + others[ n % others.length ] );
	}

	return str;
}

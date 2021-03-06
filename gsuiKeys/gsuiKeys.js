"use strict";

function gsuiKeys() {
	var root = document.createElement( "div" );

	this._init();
	this.rootElement = root;
	this.rowElements = [];
	this._nlKeys = root.childNodes;
	this._nbOct = 0;
	root.className = "gsuiKeys";
	root.onmousedown = this._evmdRoot.bind( this );
}

gsuiKeys.keyIds = {
	"b":  11,
	"a#": 10,
	"a":   9,
	"g#":  8,
	"g":   7,
	"f#":  6,
	"f":   5,
	"e":   4,
	"d#":  3,
	"d":   2,
	"c#":  1,
	"c":   0
};

gsuiKeys.prototype = {
	remove() {
		this.rootElement.remove();
		this.rowElements.forEach( function( el ) {
			el.remove();
		} );
		this.rowElements.length = 0;
	},
	octaves( start, nbOct ) {
		var id,
			root = this.rootElement,
			nbDiff = nbOct - this._nbOct;

		if ( nbDiff || this._octStart !== start ) {
			this._octStart = start;
			root.style.counterReset = "octave " + ( start + nbOct );
		}
		if ( nbDiff ) {
			if ( nbDiff > 0 ) {
				while ( nbDiff-- > 0 ) {
					root.append( document.importNode( gsuiKeys.octaveTemplate.content, true ) );
				}
				id = this._nbOct * 12;
				this.newRowElements = root.querySelectorAll( ".gsui-row" );
				this.newRowElements.forEach( function( el ) {
					el.remove();
					el.dataset.rowid = id++;
				} );
				Array.prototype.push.apply( this.rowElements, this.newRowElements );
			} else {
				for ( nbDiff *= 12; nbDiff < 0; ++nbDiff ) {
					root.lastChild.remove();
					this.rowElements[ this.rowElements.length - 1 ].remove();
					this.rowElements.pop();
				}
			}
			this._nbOct = nbOct;
		}
	},
	keyToIndex( keyStr ) {
		var key = keyStr.substr( 0, keyStr[ 1 ] !== "#" ? 1 : 2 );

		return keyStr.substr( key.length ) * 12 +
			gsuiKeys.keyIds[ key ] - ( this._octStart * 12 );
	},

	// private:
	_init() {
		if ( !gsuiKeys.octaveTemplate ) {
			gsuiKeys.octaveTemplate = document.getElementById( "gsuiKeys-octave" );
			document.body.addEventListener( "mousemove", function( e ) {
				gsuiKeys._focused && gsuiKeys._focused._evmmRoot( e );
			} );
			document.body.addEventListener( "mouseup", function( e ) {
				gsuiKeys._focused && gsuiKeys._focused._evmuRoot( e );
			} );
		}
	},
	_isBlack( keyInd ) {
		return keyInd === 1 || keyInd === 3 || keyInd === 5 || keyInd === 8 || keyInd === 10;
	},
	_keydown( keyInd ) {
		var elKey = this._nlKeys[ keyInd ];

		if ( elKey ) {
			this._keyup();
			this._keyInd = keyInd;
			this._elKey = elKey;
			this._octNum = this._octStart + this._nbOct - 1 - ~~( keyInd / 12 );
			elKey.classList.add( "gsui-active" );
			this.onkeydown && this.onkeydown( elKey.dataset.key, this._octNum, this._gain );
		}
	},
	_keyup() {
		if ( this._elKey ) {
			this._elKey.classList.remove( "gsui-active" );
			this.onkeyup && this.onkeyup( this._elKey.dataset.key, this._octNum, this._gain );
		}
	},

	// events:
	_evmdRoot( e ) {
		if ( this._nbOct ) {
			var blackKeyBCR = this.rootElement.childNodes[ 1 ].getBoundingClientRect();

			this._rootTop = this.rootElement.getBoundingClientRect().top;
			this._blackKeyR = blackKeyBCR.right;
			this._blackKeyH = blackKeyBCR.height;
			this._gain = Math.min( e.layerX / ( e.target.clientWidth - 1 ), 1 );
			gsuiKeys._focused = this;
			this._evmmRoot( e );
		}
	},
	_evmuRoot( e ) {
		this._keyup();
		delete this._elKey;
		delete this._keyInd;
		delete gsuiKeys._focused;
	},
	_evmmRoot( e ) {
		var fKeyInd = ( e.clientY - this._rootTop ) / this._blackKeyH,
			iKeyInd = ~~fKeyInd;

		if ( e.clientX > this._blackKeyR && this._isBlack( ~~( iKeyInd % 12 ) ) ) {
			iKeyInd += fKeyInd - iKeyInd < .5 ? -1 : 1;
		}
		if ( this._keyInd !== iKeyInd ) {
			this._keydown( iKeyInd );
		}
	}
};

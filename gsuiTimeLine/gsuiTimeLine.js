"use strict";

function gsuiTimeLine() {
	var root = this._clone(),
		elCurrentTime = root.querySelector( ".gsui-currentTime" ),
		elLoopBg = root.querySelector( ".gsui-loopBg" );

	this.rootElement = root;
	this._elTime = root.querySelector( ".gsui-cursor" );
	this._elTimeLine = root.querySelector( ".gsui-cursorLine" );
	this._elLoop = root.querySelector( ".gsui-loop" );
	this._elLoopBgCL = elLoopBg.classList;
	this._elLoopBrdACL = root.querySelector( ".gsui-loopBrdA" ).classList;
	this._elLoopBrdBCL = root.querySelector( ".gsui-loopBrdB" ).classList;
	this._offset = 0;
	this._pxPerBeat = 32;
	this._beatsPerMeasure =
	this._stepsPerBeat = 4;
	this._steps = [];
	this.stepRound = 1;
	this.currentTime( 0 );
	this.loop( 0, 0 );

	elCurrentTime.onmousedown = this._mousedownTime.bind( this );
	elCurrentTime.onmousemove = this._mousemoveTime.bind( this );
	elLoopBg.onmousedown = this._mousedownLoop.bind( this, "ab" );
	root.querySelector( ".gsui-loopA" ).onmousedown = this._mousedownLoop.bind( this, "a" );
	root.querySelector( ".gsui-loopB" ).onmousedown = this._mousedownLoop.bind( this, "b" );
	root.querySelector( ".gsui-loopLine" ).onmousedown = this._mousedownLoopLine.bind( this );
}

gsuiTimeLine.prototype = {
	resized() {
		var rc = this.rootElement.getBoundingClientRect();

		this.width = rc.width;
		this.height = rc.height;
	},
	currentTime( beat, isUserAction ) {
		this._currentTime = beat;
		this._updateTime( isUserAction );
		if ( isUserAction && this.onchangeCurrentTime ) {
			this.onchangeCurrentTime( beat );
		}
	},
	offset( beat, pxBeat ) {
		this._offset = Math.max( 0, +beat || 0 );
		this._pxPerBeat = +pxBeat;
		this._render();
	},
	timeSignature( a, b ) {
		this._beatsPerMeasure = Math.max( 1, ~~a );
		this._stepsPerBeat = Math.min( Math.max( 1, ~~b ), 16 );
		this._render();
	},
	loop( a, b, isUserAction ) {
		var serial, la, lb, loopWas = this._loop;

		if ( a === false ) {
			this._loop = a;
		} else {
			this._loopA = Math.max( 0, Math.min( a, b ) );
			this._loopB = Math.max( 0, a, b );
		}
		la = this._round( this._loopA );
		lb = this._round( this._loopB );
		this._loop = lb - la > 1 / this._stepsPerBeat / 8;
		if ( isUserAction ) {
			if ( this.oninputLoop ) {
				if ( loopWas && this._loop ) {
					serial = this._serialAB( la, lb );
				}
				if ( loopWas !== this._loop || this._loopSerialInp !== serial ) {
					this._loopSerialInp = serial;
					this.oninputLoop( this._loop, la, lb );
				}
			}
		} else {
			this._loopWas = this._loop;
			this._loopSerial = this._serialAB(
				this._loopAWas = la,
				this._loopBWas = lb );
		}
		this._updateLoop();
	},

	// private:
	_clone() {
		var div = document.createElement( "div" );

		gsuiTimeLine.template = gsuiTimeLine.template || this._init();
		div.appendChild( document.importNode( gsuiTimeLine.template.content, true ) );
		return div.removeChild( div.querySelector( "*" ) );
	},
	_init() {
		document.body.addEventListener( "mousemove", function( e ) {
			gsuiTimeLine._focused && gsuiTimeLine._focused._mousemove( e );
		} );
		document.body.addEventListener( "mouseup", function( e ) {
			gsuiTimeLine._focused && gsuiTimeLine._focused._mouseup( e );
		} );
		return document.getElementById( "gsuiTimeLine" );
	},
	_round( bt ) {
		if ( this.stepRound ) {
			var mod = 1 / this._stepsPerBeat * this.stepRound;

			bt = Math.round( bt / mod ) * mod;
		}
		return bt;
	},
	_layerX( e ) {
		return e.pageX - this.rootElement.getBoundingClientRect().left;
	},
	_serialAB( a, b ) {
		return a.toFixed( 4 ) + " " + b.toFixed( 4 );
	},
	_mousemove( e ) {
		if ( this._lock ) {
			var la = this._lockA,
				lb = this._lockB,
				a = this._loopA,
				b = this._loopB,
				bt = e.movementX / this._pxPerBeat;

			if ( la || lb ) {
				la ? a += bt : b += bt;
				if ( a > b ) {
					this._lockA = lb;
					this._lockB = la;
					this._elLoopBrdACL.toggle( "gsui-hover", lb );
					this._elLoopBrdBCL.toggle( "gsui-hover", la );
				}
			} else {
				if ( a + bt < 0 ) {
					bt = -a;
				}
				a += bt;
				b += bt;
			}
			this.loop( a, b, true );
		}
	},
	_mouseup( e ) {
		var serial,
			l = this._loop,
			la = this._round( this._loopA ),
			lb = this._round( this._loopB );

		this._loopA = la;
		this._loopB = lb;
		this._lock =
		this._lockA =
		this._lockB = false;
		this._elLoopBgCL.remove( "gsui-hover" );
		this._elLoopBrdACL.remove( "gsui-hover" );
		this._elLoopBrdBCL.remove( "gsui-hover" );
		delete gsuiTimeLine._focused;
		if ( this.onchangeLoop ) {
			if ( !l ) {
				if ( this._loopWas ) {
					this.onchangeLoop( this._loopWas = l,
						this._loopAWas, this._loopBWas );
				}
			} else {
				serial = this._serialAB( la, lb );
				if ( this._loopWas !== this._loop || this._loopSerial !== serial ) {
					this._loopSerial = serial;
					this.onchangeLoop( this._loopWas = l,
						this._loopAWas = la, this._loopBWas = lb );
				}
			}
		}
	},
	_mousedownTime( e ) {
		this.currentTime( this._round( this._offset +
			this._layerX( e ) / this._pxPerBeat ), true );
	},
	_mousemoveTime( e ) {
		var x = this._layerX( e ) / this.width * 100;

		this._elTimeLine.style.backgroundImage =
			"linear-gradient(90deg,transparent " + ( x - 15 ) +
			"%,currentColor " + x + "%,transparent " + ( x + 15 ) + "%)";
	},
	_mousedownLoop( side ) {
		this._lock = true;
		this._lockA = side === "a";
		this._lockB = side === "b";
		this._elLoopBgCL.toggle( "gsui-hover", side === "ab" );
		this._elLoopBrdACL.toggle( "gsui-hover", this._lockA );
		this._elLoopBrdBCL.toggle( "gsui-hover", this._lockB );
		gsuiTimeLine._focused = this;
	},
	_mousedownLoopLine( e ) {
		var now = Date.now(),
			bt = this._offset + this._layerX( e ) / this._pxPerBeat;

		if ( !this._loopClick || now - this._loopClick > 500 ) {
			this._loopClick = now;
		} else {
			this.loop( false, 0, true );
			this.loop( bt, bt, true );
			this._mousedownLoop( "b" );
		}
	},
	_updateTime( isUserAction ) {
		this._elTime.classList.toggle( "gsui-trans", !!isUserAction );
		this._elTime.style.left =
			( this._currentTime - this._offset ) * this._pxPerBeat + "px";
	},
	_updateLoop() {
		var s = this._elLoop.style;

		if ( this._loop ) {
			var px = this._pxPerBeat,
				off = this._offset,
				la = this._round( this._loopA ),
				lb = this._round( this._loopB );

			s.left = ( la - off ) * px + "px";
			s.right = this.width - ( lb - off ) * px + "px";
		}
		s.display = this._loop ? "block" : "none";
	},
	_render() {
		var stepRel,
			elStep,
			rootCL = this.rootElement.classList,
			elSteps = this._steps,
			beatPx = this._pxPerBeat,
			stepsBeat = this._stepsPerBeat,
			stepsMeasure = stepsBeat * this._beatsPerMeasure,
			stepPx = beatPx / stepsBeat,
			stepEm = 1 / stepsBeat,
			stepId = 0,
			stepsDuration = Math.ceil( this.width / stepPx + 2 ),
			beatsDuration = this.width / beatPx,
			step = ~~( this._offset * stepsBeat ),
			em = -this._offset % stepEm;

		rootCL.remove( "gsui-step", "gsui-beat", "gsui-measure" );
		rootCL.add( "gsui-" + ( beatPx > 24 ? beatPx > 72 ?
				"step" : "beat" : "measure" ) );
		while ( elSteps.length < stepsDuration ) {
			elStep = document.createElement( "div" );
			elSteps.push( elStep );
		}
		for ( ; stepId < stepsDuration; ++stepId ) {
			stepRel = step % stepsBeat;
			elStep = elSteps[ stepId ];
			elStep.style.left = em * beatPx + "px";
			elStep.className = "gsui-" + ( step % stepsMeasure ? stepRel ?
				"step" : "beat" : "measure" );
			elStep.textContent = elStep.className !== "gsui-step"
				? ~~( 1 + step / stepsBeat ) : "." ;
			if ( !elStep.parentNode ) {
				this.rootElement.append( elStep );
			}
			++step;
			em += stepEm;
		}
		for ( ; stepId < elSteps.length; ++stepId ) {
			elStep = elSteps[ stepId ];
			if ( !elStep.parentNode ) {
				break;
			}
			elStep.remove();
		}
		this._updateTime();
		this._updateLoop();
	}
};

/**
 * Comparison of various FT methods.
 */

var test = require('tst');


var N = 4096;
var real = new Float32Array(N);
var im = new Float32Array(N);

for (var i = 0; i < N; i++) {
	// real[i] = Math.sin(2000 * (i / N) / (Math.PI * 2) )/3
	real[i] = Math.random() * 2 - 0.5;
	im[i] = Math.random() * 2 - 0.5;
}

var max = 10e2;


test('aureooms-js-fft', function () {
	var fft = require( "aureooms-js-fft" );
	var array = require( "aureooms-js-array" ) ;
	var random = require( "aureooms-js-random" ) ;
	var number = require( "aureooms-js-number" ) ;
	var complex = require( "aureooms-js-complex" ) ;

	var kernel = complex.cartesian.kernel.compile( number , "i" ) ;
	var cartesian = complex.cartesian.array.compile( kernel ) ;

	var $ = fft.compile( cartesian ) ;
	var _ = cartesian.complex ;

	var n = N;//Math.pow( 2 , 10 ) | 0 ;
	var l = Math.log2( n ) | 0 ;
	var m = n >>> 1 ;

	var u = array.alloc( n ) ;
	var v = array.alloc( n ) ;
	var w = array.alloc( n ) ;

	for ( var i = 0 ; i < n ; ++i ) {
		u[i] = _( random.randfloat( -1000 , 1000 ) , random.randfloat( -1000 , 1000 ) ) ;
	}

	array.copy( u , 0 , n , w , 0 ) ;

	test('run 10 ×', function () {
		for (var i = 0; i < max/10; i++ ) {
			$.fft( l , m , u , 0 , n  , v , 0 , n ) ;
		}
	});
});


var STFT = require('stft');
test('stft', function () {
	test('run', function (done) {
		var count = 0;
		var onfreq = function () {
			count++;
			if (count >= 10) done();
		};
		var stft = STFT(1, N, onfreq);
		for (var i = 0; i < max; i++ ) {
			stft(real);
		}
	});
});


test('frequencyjs', function () {
	var fjs = require('frequencyjs');

	test('dft ' + max + ' ×', function () {
		for (var i = 0; i < 1; i++ ) {
			fjs.Transform.toSpectrum(real,{sampling: N, method: 'dft'});
		}
	});

	test('fft', function () {
		for (var i = 0; i < max; i++ ) {
			fjs.Transform.toSpectrum(real,{method: 'fft'});
		}
	});
});



test('fourier', function () {
	var fourier = require('fourier');
	var fourierFFTRun = fourier.fft();
	test('fft', function () {
		for (var i = 0; i < max; i++) {
			fourierFFTRun(real, im);
		}
	});

	var fourierDFTRun = fourier.dft;
	test('dft: ' + max/10 + ' ×', function () {
		for (var i = 0; i < 10; i++) {
			fourierDFTRun(real, im);
		}
	});

	var fourierFFTDitRadix2Run = fourier.fftDitRadix2();
	test('ditRadix2', function () {
		for (var i = 0; i < max; i++) {
			fourierFFTDitRadix2Run(real, im);
		}
	});

	var fourierFFTDitRadix2SimpleRun = fourier.fftDitRadix2Simple;
	test('ditRadix2simple', function () {
		for (var i = 0; i < max; i++) {
			fourierFFTDitRadix2SimpleRun(real, im);
		}
	});


	//some tough guys
	stdlib = {
		Math: Math,
		Float64Array: Float64Array,
		Float32Array: Float32Array
	};
	refReal = new Float32Array(N);
	refImag = new Float32Array(N);
	_real = new Float32Array(N);
	_imag = new Float32Array(N);

	for (i = 0; i < N; i++) {
		_real[i] = refReal[i] = real[i];
		_imag[i] = refImag[i] = im[i];
	}

	heap = fourier.custom.alloc(N, 3);

	var raw = fourier.custom['fft_f32_' + N + '_raw'](stdlib, null, heap);
	raw.init();

	test('fft-32-raw', function () {
		for (var i = 0; i < max; i++) {
			fourier.custom.array2heap(_real, new Float32Array(heap), N, 0);
			fourier.custom.array2heap(_imag, new Float32Array(heap), N, N);
			raw.transform();
			fourier.custom.heap2array(new Float32Array(heap), _real, N, 0);
			fourier.custom.heap2array(new Float32Array(heap), _imag, N, N);
		}
	});

	var asm = fourier.custom['fft_f32_' + N + '_asm'](stdlib, null, heap);
	asm.init();

	test('fft-32-asm', function () {
		for (var i = 0; i < max; i++) {
			fourier.custom.array2heap(_real, new Float32Array(heap), N, 0);
			fourier.custom.array2heap(_imag, new Float32Array(heap), N, N);
			asm.transform();
			fourier.custom.heap2array(new Float32Array(heap), _real, N, 0);
			fourier.custom.heap2array(new Float32Array(heap), _imag, N, N);
		}
	});
});
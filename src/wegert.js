(function (root) {
  'use strict';

  const L = root.L = root.L || {};
  const TWO_PI = 2 * Math.PI;

  function hsvToRgb(hue, saturation, value) {
    const h = ((hue % 1) + 1) % 1 * 6;
    const sector = Math.floor(h);
    const fraction = h - sector;
    const p = value * (1 - saturation);
    const q = value * (1 - saturation * fraction);
    const t = value * (1 - saturation * (1 - fraction));

    switch (sector % 6) {
      case 0: return [value, t, p];
      case 1: return [q, value, p];
      case 2: return [p, value, t];
      case 3: return [p, q, value];
      case 4: return [t, p, value];
      default: return [value, p, q];
    }
  }

  function evaluateQSeries(coefficients, real, imaginary) {
    const radius = Math.exp(-TWO_PI * imaginary);
    const angle = TWO_PI * real;
    const qReal = radius * Math.cos(angle);
    const qImaginary = radius * Math.sin(angle);

    let powerReal = 1;
    let powerImaginary = 0;
    let sumReal = coefficients[0];
    let sumImaginary = 0;

    for (let n = 1; n < coefficients.length; n += 1) {
      const nextReal = powerReal * qReal - powerImaginary * qImaginary;
      const nextImaginary = powerReal * qImaginary + powerImaginary * qReal;
      powerReal = nextReal;
      powerImaginary = nextImaginary;
      const coefficient = coefficients[n];
      sumReal += coefficient * powerReal;
      sumImaginary += coefficient * powerImaginary;
    }

    return [sumReal, sumImaginary];
  }

  function colorFor(valueReal, valueImaginary) {
    const argument = Math.atan2(valueImaginary, valueReal);
    const hue = argument / TWO_PI + 0.5;
    const magnitude = Math.max(Math.hypot(valueReal, valueImaginary), 1e-30);
    const logMagnitude = Math.log(magnitude);
    const broad = 1 / (1 + Math.exp(-0.5 * logMagnitude));
    const rings = 0.5 + 0.5 * Math.cos(TWO_PI * logMagnitude / Math.log(2));
    const value = Math.max(0.08, Math.min(1, (0.25 + 0.70 * broad) * (0.84 + 0.16 * rings)));
    return hsvToRgb(hue, 0.88, value);
  }

  function paintRows(canvas, form, startRow, endRow, imageData) {
    const width = canvas.width;
    const height = canvas.height;
    const data = imageData.data;
    const xMin = -1.1;
    const xMax = 1.1;
    const yMin = 0.10;
    const yMax = 1.25;

    for (let row = startRow; row < endRow; row += 1) {
      const imaginary = yMax - (row / Math.max(1, height - 1)) * (yMax - yMin);
      for (let column = 0; column < width; column += 1) {
        const real = xMin + (column / Math.max(1, width - 1)) * (xMax - xMin);
        const sample = evaluateQSeries(form.coefficients, real, imaginary);
        const rgb = colorFor(sample[0], sample[1]);
        const offset = (row * width + column) * 4;
        data[offset] = Math.round(rgb[0] * 255);
        data[offset + 1] = Math.round(rgb[1] * 255);
        data[offset + 2] = Math.round(rgb[2] * 255);
        data[offset + 3] = 255;
      }
    }
  }

  L.renderWegert = function renderWegert(canvas, form, options) {
    const settings = Object.assign({ width: 160, height: 116, rowsPerChunk: 8, onDone: null }, options);
    canvas.width = settings.width;
    canvas.height = settings.height;
    const context = canvas.getContext('2d', { alpha: false });
    const imageData = context.createImageData(canvas.width, canvas.height);
    let row = 0;
    let cancelled = false;

    function nextChunk() {
      if (cancelled) return;
      const endRow = Math.min(canvas.height, row + settings.rowsPerChunk);
      paintRows(canvas, form, row, endRow, imageData);
      context.putImageData(imageData, 0, 0);
      row = endRow;
      if (row < canvas.height) {
        setTimeout(nextChunk, 0);
      } else if (typeof settings.onDone === 'function') {
        settings.onDone();
      }
    }

    nextChunk();
    return function cancel() { cancelled = true; };
  };
})(window);

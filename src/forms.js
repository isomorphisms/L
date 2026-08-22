(function (root) {
  'use strict';

  const L = root.L = root.L || {};
  const TERM_COUNT = 72;

  function divisorPowerSum(n, power) {
    let sum = 0;
    for (let divisor = 1; divisor <= n; divisor += 1) {
      if (n % divisor === 0) sum += divisor ** power;
    }
    return sum;
  }

  function eisensteinCoefficients(weight) {
    const coefficients = new Float32Array(TERM_COUNT + 1);
    coefficients[0] = 1;
    const multiplier = weight === 4 ? 240 : -504;
    const divisorPower = weight === 4 ? 3 : 5;

    for (let n = 1; n <= TERM_COUNT; n += 1) {
      coefficients[n] = multiplier * divisorPowerSum(n, divisorPower);
    }
    return coefficients;
  }

  function etaProductCoefficients(scale, power) {
    const coefficients = new Float32Array(TERM_COUNT + 1);
    coefficients[1] = 1;

    for (let n = 1; scale * n <= TERM_COUNT; n += 1) {
      const step = scale * n;
      for (let repeat = 0; repeat < power; repeat += 1) {
        for (let exponent = TERM_COUNT; exponent >= step; exponent -= 1) {
          coefficients[exponent] -= coefficients[exponent - step];
        }
      }
    }
    return coefficients;
  }

  L.forms = [
    {
      id: 'e4',
      shortLabel: 'E₄',
      label: 'level 1 · weight 4',
      source: 'classical Eisenstein series',
      coefficients: eisensteinCoefficients(4),
    },
    {
      id: 'e6',
      shortLabel: 'E₆',
      label: 'level 1 · weight 6',
      source: 'classical Eisenstein series',
      coefficients: eisensteinCoefficients(6),
    },
    {
      id: '9.4.a.a',
      shortLabel: '9.4.a.a',
      label: 'level 9 · weight 4 · CM',
      source: 'LMFDB newform 9.4.a.a = η(3z)⁸',
      coefficients: etaProductCoefficients(3, 8),
    },
  ];
})(window);

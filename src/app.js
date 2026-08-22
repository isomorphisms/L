(function (root) {
  'use strict';

  const L = root.L;
  const canvas = document.querySelector('#portrait');
  const current = document.querySelector('#current');
  const status = document.querySelector('#status');
  const questionButtons = Array.from(document.querySelectorAll('[data-form]'));
  let cancelRender = null;
  let activeId = 'e4';

  function findForm(id) {
    return L.forms.find((form) => form.id === id) || L.forms[0];
  }

  function draw(id) {
    const form = findForm(id);
    activeId = form.id;
    if (cancelRender) cancelRender();
    current.textContent = form.shortLabel;
    status.textContent = 'drawing…';

    cancelRender = L.renderWegert(canvas, form, {
      width: 160,
      height: 116,
      rowsPerChunk: 12,
      onDone: function () {
        status.textContent = form.label;
        requestAnimationFrame(function () {
          if (activeId !== form.id) return;
          cancelRender = L.renderWegert(canvas, form, {
            width: 480,
            height: 348,
            rowsPerChunk: 6,
            onDone: function () {
              if (activeId === form.id) status.textContent = form.label;
            },
          });
        });
      },
    });
  }

  questionButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      draw(button.dataset.form);
    });
  });

  draw(activeId);
})(window);

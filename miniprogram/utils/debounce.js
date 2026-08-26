function debounce(fn, wait = 250) {
  let timer = null;
  return function debounced(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}

function onceDuring(fn, wait = 450) {
  let locked = false;
  return function guarded(...args) {
    if (locked) return undefined;
    locked = true;
    const result = fn.apply(this, args);
    setTimeout(() => {
      locked = false;
    }, wait);
    return result;
  };
}

module.exports = { debounce, onceDuring };

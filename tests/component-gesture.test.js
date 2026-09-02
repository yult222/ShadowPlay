const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

function loadComponent(relativePath) {
  let definition;
  const filename = path.resolve(__dirname, relativePath);
  const previous = global.Component;
  global.Component = (config) => { definition = config; };
  delete require.cache[filename];
  require(filename);
  global.Component = previous;
  return definition;
}

function setAtPath(target, key, value) {
  const parts = key.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) cursor = cursor[parts[index]];
  cursor[parts[parts.length - 1]] = value;
}

function instanceOf(definition, properties = {}) {
  const events = [];
  const instance = {
    data: JSON.parse(JSON.stringify(definition.data || {})),
    properties,
    events,
    setData(patch) { Object.entries(patch).forEach(([key, value]) => setAtPath(this.data, key, value)); },
    triggerEvent(name, detail) { events.push({ name, detail }); },
  };
  Object.assign(instance, definition.methods || {});
  return instance;
}

test("free-drag turns a real touch sequence into a normalized drop event", () => {
  const definition = loadComponent("../miniprogram/experiencegame/components/free-drag/index.js");
  const item = { id: "piece", x: 10, y: 20, startX: 10, startY: 20, width: 44, height: 44 };
  const target = { id: "target", x: 120, y: 160, width: 80, height: 80 };
  const component = instanceOf(definition, { width: 320, height: 480, targets: [target] });
  component.data.rect = { left: 8, top: 12, width: 320, height: 480 };
  component.data.localItems = [{ ...item }];

  component.start({ currentTarget: { dataset: { index: 0 } }, touches: [{ clientX: 30, clientY: 50 }] });
  component.move({ touches: [{ clientX: 166, clientY: 198 }] });
  component.end();

  const drop = component.events.find((event) => event.name === "drop");
  assert.equal(drop.detail.itemId, "piece");
  assert.equal(drop.detail.targetId, "target");
  assert.ok(drop.detail.x > 0 && drop.detail.x < 1);
  assert.ok(drop.detail.y > 0 && drop.detail.y < 1);
});

test("free-drag touch cancellation restores the piece and never completes a drop", () => {
  const definition = loadComponent("../miniprogram/experiencegame/components/free-drag/index.js");
  const component = instanceOf(definition, { width: 320, height: 480, targets: [] });
  component.data.rect = { left: 0, top: 0, width: 320, height: 480 };
  component.data.localItems = [{ id: "piece", x: 24, y: 30, startX: 24, startY: 30, width: 44, height: 44 }];

  component.start({ currentTarget: { dataset: { index: 0 } }, touches: [{ clientX: 40, clientY: 50 }] });
  component.move({ touches: [{ clientX: 190, clientY: 260 }] });
  component.cancel();

  assert.equal(component.data.localItems[0].x, 24);
  assert.equal(component.data.localItems[0].y, 30);
  assert.equal(component.events.some((event) => event.name === "drop"), false);
});

test("craft-canvas maps a phone touch to the puppet image before emitting select", () => {
  const definition = loadComponent("../miniprogram/experiencegame/components/craft-canvas/index.js");
  const component = instanceOf(definition, { baseWidth: 768, baseHeight: 1152 });
  component.data.rect = { left: 20, top: 100, width: 360, height: 520 };

  component.select({ touches: [{ clientX: 200, clientY: 360 }] });

  const selected = component.events.find((event) => event.name === "select");
  assert.ok(selected);
  assert.ok(selected.detail.x >= 0 && selected.detail.x <= 1);
  assert.ok(selected.detail.y >= 0 && selected.detail.y <= 1);
});

test("craft-canvas visible hint is a real tap target", () => {
  const definition = loadComponent("../miniprogram/experiencegame/components/craft-canvas/index.js");
  const hints = [{ id: "yellow", x: 0.5, y: 0.17, completed: false }];
  const component = instanceOf(definition, { baseWidth: 768, baseHeight: 1152, hints });
  component.data.imageFrame = { left: 20, top: 30, width: 240, height: 360 };
  component.updateHitHints(hints);

  component.selectHint({ currentTarget: { dataset: { index: 0 } } });

  assert.deepEqual(component.events.find((event) => event.name === "select"), {
    name: "select",
    detail: { x: 0.5, y: 0.17, source: "hint" },
  });
});

test("craft-canvas completed hint cannot be triggered twice", () => {
  const definition = loadComponent("../miniprogram/experiencegame/components/craft-canvas/index.js");
  const hints = [{ id: "red", x: 0.5, y: 0.4, completed: true }];
  const component = instanceOf(definition, { hints });
  component.data.imageFrame = { left: 0, top: 0, width: 200, height: 300 };
  component.updateHitHints(hints);

  component.selectHint({ currentTarget: { dataset: { index: 0 } } });

  assert.equal(component.events.some((event) => event.name === "select"), false);
});

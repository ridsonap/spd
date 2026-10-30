// Format 1 output must stay byte-identical (content streams) to the pre-refactor app.
const test = require('node:test');
const assert = require('node:assert');
const golden = require('./fixtures/golden-f1.json');
const Core = require('../core.js');
const Render = require('../render.js');
const { loadTemplates, rawStream } = require('./helpers.js');

const templates = loadTemplates();

for (const [name, fx] of Object.entries(golden)) {
  test(`Format 1 identik dengan versi lama: ${name}`, async () => {
    const { data, errors } = Core.buildSpdData(Object.assign({ format: 1 }, fx.input));
    assert.deepStrictEqual(errors, []);
    const bundle = await Render.buildBundle(data, templates);
    assert.strictEqual(bundle.pageCount, 3);
    assert.strictEqual(rawStream(bundle.st), fx.st, 'ST');
    assert.strictEqual(rawStream(bundle.spd), fx.spd, 'SPD lampiran');
    assert.strictEqual(rawStream(bundle.super), fx.super, 'Surat Pernyataan');
  });
}

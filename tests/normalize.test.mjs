import test from 'node:test';
import assert from 'node:assert/strict';
import { roundValue, normalizeMeasurement } from '../src/normalize.mjs';
test('rounds decimal metrics',()=>assert.equal(roundValue(99.800003051758,1),99.8));
test('normalizes and skips zero HR',()=>{
  const x=normalizeMeasurement({id:1,uid:2,suid:3,weight_kg:99.800003,bmi:31.5,hr:0,measured_time:1786679324,is_deleted:0});
  assert.equal(x.values.Gewicht,99.8); assert.equal(x.values.BMI,31.5); assert.equal(x.values.Herzfrequenz,undefined); assert.equal(x.suid,'3');
});
test('deleted measurements are ignored',()=>assert.equal(normalizeMeasurement({measured_time:1,is_deleted:1}),null));

import assert from 'node:assert/strict';
import test from 'node:test';
import environment from './test-environment.cjs';
const { restartTestGateway } = environment;
const config = 'project_id = "QuanLyVayCaNhan-C20-test"\n';
function mockExec(label = 'QuanLyVayCaNhan-C20-test') {
  const calls = [];
  return { calls, exec(command, args) { calls.push({command,args}); return label; } };
}
test('gateway refresh touches only the verified isolated container and requires routed Auth health', () => {
  const mock = mockExec();
  restartTestGateway({ apiUrl:'http://127.0.0.1:55321',config,ci:false,exec:mock.exec });
  assert.equal(mock.calls.length,3);
  assert.ok(mock.calls.every(c=>c.command==='docker'&&c.args.includes('supabase_kong_QuanLyVayCaNhan-C20-test')));
  assert.equal(mock.calls[1].args[0],'restart');
  assert.match(mock.calls[2].args.at(-1),/127\.0\.0\.1:8000\/auth\/v1\/health/);
  assert.match(mock.calls[2].args.at(-1),/done; exit 1$/);
});
test('gateway refresh refuses remote hosts, wrong ports or project before invoking Docker', () => {
  for (const input of [
    {apiUrl:'https://project.supabase.co'}, {apiUrl:'http://localhost:54321'},
    {apiUrl:'http://localhost:55321',config:'project_id = "QuanLyVayCaNhan"'},
    {apiUrl:'http://localhost:55321',config:'project_id = "sibling"'},
  ]) {
    const mock=mockExec();
    assert.throws(()=>restartTestGateway({config,ci:false,exec:mock.exec,...input}),/Refusing gateway/);
    assert.equal(mock.calls.length,0);
  }
});
test('gateway refresh refuses a mismatched Docker project label before restart', () => {
  const mock=mockExec('sibling');
  assert.throws(()=>restartTestGateway({apiUrl:'http://localhost:55321',config,ci:false,exec:mock.exec}),/unexpected test gateway/);
  assert.equal(mock.calls.length,1);
});
test('CI gateway refresh uses the guarded runner project and never the local test suffix', () => {
  const mock=mockExec('QuanLyVayCaNhan');
  restartTestGateway({apiUrl:'http://127.0.0.1:54321',config:'project_id = "QuanLyVayCaNhan"',ci:true,exec:mock.exec});
  assert.ok(mock.calls.every(c=>c.args.includes('supabase_kong_QuanLyVayCaNhan')));
});
test('restart or routed health failure stays a hard gate failure', () => {
  for(const failingOperation of ['restart','exec']) {
    assert.throws(()=>restartTestGateway({apiUrl:'http://localhost:55321',config,ci:false,
      exec(command,args){if(args[0]===failingOperation)throw Error('diagnostic failure');return 'QuanLyVayCaNhan-C20-test';},
    }),/diagnostic failure/);
  }
});

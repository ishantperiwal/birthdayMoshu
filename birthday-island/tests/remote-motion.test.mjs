import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRemoteMotion} from '../remote-motion.js';
const pose=(time,x,extra={})=>({time,position:[x,2,0],yaw:0,pitch:0,moving:true,running:false,lying:false,...extra});
test('uneven packet arrivals produce constant-speed render frames',()=>{
 const motion=createRemoteMotion();
 const packets=Array.from({length:30},(_,i)=>({p:pose(i*66,i*.33),arrival:i*66+[10,45,5,55,20][i%5]}));
 let cursor=0;const samples=[];
 for(let now=0;now<1800;now+=10){
  while(cursor<packets.length&&packets[cursor].arrival<=now){const {p,arrival}=packets[cursor++];motion.push(p,arrival);}
  const p=motion.sample(now);if(now>=250&&p)samples.push(p.position[0]);
 }
 for(let i=1;i<samples.length;i++)assert.ok(Math.abs(samples[i]-samples[i-1]-.05)<1e-9);
});
test('turns take the short path across the -PI/PI boundary and pitch interpolates',()=>{
 const m=createRemoteMotion({delay:100});
 m.push(pose(0,0,{yaw:3.1,pitch:0}),0);m.push(pose(100,1,{yaw:-3.1,pitch:.6}),100);
 const p=m.sample(150);assert.ok(Math.abs(p.yaw-Math.PI)<1e-9);assert.equal(p.pitch,.3);
});
test('a stopped sender stays put and eventually stops walking',()=>{
 const m=createRemoteMotion();m.push(pose(0,0),0);m.push(pose(66,.33),66);
 assert.equal(m.sample(5000).position[0],.33);assert.equal(m.sample(5000).moving,false);
});
test('teleports, lying down and a restarted sender do not sweep through the island',()=>{
 const m=createRemoteMotion();m.push(pose(1000,1),0);m.push(pose(1066,40),66);assert.equal(m.sample(70).position[0],40);
 m.push(pose(1132,40,{lying:true}),132);assert.equal(m.sample(133).lying,true);
 m.push(pose(10,2),200);assert.equal(m.sample(201).position[0],2);
});
test('reset discards old human motion before autopilot or reconnect',()=>{
 const m=createRemoteMotion();m.push(pose(0,0),0);m.push(pose(66,1),66);
 m.reset(pose(1000,3));assert.equal(m.sample(1000).position[0],3);
 m.reset();assert.equal(m.sample(2000),null);
});

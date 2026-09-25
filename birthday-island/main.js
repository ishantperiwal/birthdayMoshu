import {buildChatBubbles} from './chat-bubbles.js?v=chat-log-6';
import {buildChatLog} from './chat-log.js';
import {clampWalkPitch} from './look-limits.js?v=down-46';
import {createPreviewFollower} from './preview-follower.js?v=follow-orig';
import {buildGestureWheel} from './gesture-wheel.js';
import {buildExpressionControls} from './expression-controls.js?v=minimal-chat-5';
import {EXPRESSIONS,EXPRESSION_MS,expressionRemaining} from './expressions.js?v=kiss-4';
import { buildCashRewards } from './cash-rewards.js?v=coin-1';
import {buildCashDash} from './cash-dash.js?v=coin-1';
import {CASH_SITES,formatCash} from './cash-dash-state.js?v=coin-1';
import {DATE_OUTFIT,SUIT_COLOR} from './date-suit.js?v=1';
import {BIRTHDAY_ROSE,BIRTHDAY_SKIN} from './birthday-dress.js?v=back-seam-12';
import {companionMode} from './control-mode.js?v=companion-1';
import {createRemoteMotion} from './remote-motion.js?v=1';
const remoteMotion=createRemoteMotion();
const ownMotion=createRemoteMotion({delay:180}),lookMotion=createRemoteMotion({delay:140});
let ownPose=null,passengerLying=false,passengerPointing=false,pointBlend=0;
let remoteWasOnline=false;
import {connectIsland,islandUser,isIshiee,isPassenger,multiplayerRequested,roleUI} from './multiplayer.js?v=role-preview-2';
if(roleUI){document.body.classList.add('role-ui');document.body.dataset.role=isIshiee?'ishie':'moshie';}
let network=null,applyingNetwork=false,networkReady=!multiplayerRequested,remotePose=null,lastNetworkFrame=0,wasAutopilot=false;
import { buildStargazing, STARGAZING_SPOTS } from './stargazing.js?v=coin-1';
import { buildStoneSkipping } from './stone-skipping.js?v=three-rounds-2';
import { SHORE } from './skipping-physics.js?v=more-skips-7';
import { moveAroundRocks } from './rock-collision.js?v=props-players-1';
import { createPlayerJump } from './player-jump.js';
import { buildLovePlane } from './love-plane.js?v=night-blue-5';
import { insectVisibility, insectRank } from './insect-density.js';
import {makeWingGeometry,makeWingTexture} from './butterfly-wings.js?v=1';
import { buildHandPose } from './hand-pose.js?v=arms-1';
import {buildBouquetControls} from './bouquet-controls.js?v=down-46';
import { buildDistantIsland } from './distant-island.js?v=neighbours-5';
import { buildCompanion, legPace } from './companion.js?v=follow-orig';
import { buildGiftFinish, giftBox, addGiftDetails } from './gift-finish.js?v=softer-shine-11';
import { buildDandelions } from './dandelions.js?v=2';
import { buildOceanLife } from './ocean-life.js?v=buoy-beacons-5';
import {buildJumpingFish} from './jumping-fish.js?v=water-ripples-2';
import { MONEY_TIERS, LEGENDARY_RESERVE, rupees } from './money-gifts.js?v=coin-1';
import { STAGE_HEIGHT, STAGE_RADIUS } from './celebration-stage.js';
import { addBirthdayCentrepiece } from './birthday-centrepiece.js?v=heart-message-1';
import {buildStageConfetti} from './stage-confetti.js?v=round-wider-4';
import { buildShootingStars } from './shooting-stars.js?v=msaa-tail-fix-5';
import { auroraGLSL } from './aurora.js?v=4';
import { buildCharacter, HER_ARM_THICKNESS } from './character.js?v=slow-follow-1';
import { buildFireside } from './fireside.js?v=restored-bark-9';
import * as THREE from 'three';
import { referenceTreeGeometry } from './reference-trees.js?v=solid-bases-2';
import { GL_HASH, GL_NOISE } from './reference-noise.js';
import { buildCelebration } from './celebration.js?v=stage-2';
import { cakeTableMaterials } from './cake-details.js?v=ambient-1';
import { buildStars, buildPaintedClouds } from './painted-sky.js?v=github-minus-01-16';
import { buildSceneContext } from './scene-context.js?v=2';
import { buildFireworks } from './fireworks.js?v=festival-5';
import { buildSkyMessage } from './sky-message.js?v=2';
import { createSoundscape } from './soundscape.js?v=cash-sound-1';
import { createRadio } from './radio-player.js?v=prewarm-1';
import { COIN_MODE, DASH_NAME } from './coin-mode.js';
import { buildMeadowLife } from './meadow-life.js?v=colorful-caps-1';
import { buildCandleSmoke } from './candle-smoke.js';
// Count every texture the island requests, so the welcome screen can wait for them.
const assetLoad={loaded:0,total:0};
THREE.DefaultLoadingManager.onStart=THREE.DefaultLoadingManager.onProgress=(url,loaded,total)=>{assetLoad.loaded=loaded;assetLoad.total=total;};

/*
  OUR LITTLE ISLAND
  -----------------
  Kept deliberately asset-free: every shape, color, movement and sound is made
  here. The camera lives inside playerRig so a third-person character can later
  be attached to the same rig without rewriting movement or interactions.
*/

const CONFIG = {
  // Optional: add your names here. Leave blank to keep the universal wording.
  herName: '',
  fromName: '',
  eyeHeight: 1.86,
  hisEyeHeight: 1.70, // ISHIEE's eyes in every mode (online companion view, manual walking, local His POV): level with her brows.
  flowerGrassTints: false, // Preserved flower-linked moss/sage palette; opt back in here.
  thirdPerson: false, // Set true to restore the character and follow camera.
  walkSpeed: 5.0,
  giftReach: 3.2,
  radioMusicUrl: '', // Add a local audio file URL when the music is ready.
  // The welcome countdown is set by WELCOME_TIMER at the top of index.html's welcome script.
  sunset: false, // Night scenes only for now: hides every way to switch to the sunset sky.
  skyMessage: ['Happy Birthday', 'Moshie Pie!!'], // Written in the sky by the candle fireworks (two lines).
  musicVolume: 1, // Happy Birthday until the wish, then a barely audible radio bed. 0 disables background music.
  startingMood: 'night', // Night preview while refining the celebration lighting.
  gifts: [
    { pos: [1.5, 8], title: 'A pocket of sunshine', icon: '☀', color: 0xf2bd6b,
      note: 'For every morning when I wish I could be there beside you. Keep this little bit of warmth for me.' },
    { pos: [25, 21], title: 'One very long hug', icon: '♡', color: 0xe997a0,
      note: 'It has been folded very carefully so it can travel any distance. Open whenever you need it.' },
    { pos: [39, -12], title: 'A slow afternoon', icon: '☕', color: 0x9fc3ad,
      note: 'No rushing, no clocks—just us talking about everything and nothing for as long as we like.' },
    { pos: [-14, 35], title: 'A tiny adventure', icon: '✦', color: 0x84abc2,
      note: 'A promise that we still have so many streets, skies, meals and silly detours to discover together.' },
    { pos: [7, -34], title: 'Your favorite song', icon: '♪', color: 0xa995c8,
      note: 'The one that makes an ordinary room feel like a place worth dancing in.' },
    { pos: [-44, 17], title: 'A wish at sunset', icon: '☆', color: 0xed9f78,
      note: 'I saved the prettiest horizon I could make. Sit on the bench and watch it with me.' },
    { pos: [15, 38], title: 'Breakfast in bed', icon: '♨', color: 0xe8c687,
      note: 'Redeemable on a wonderfully lazy morning—with extra snacks and absolutely no alarms.' },
    { pos: [43, 17], title: 'A reason to smile', icon: '☺', color: 0xe9ad73,
      note: 'You already give me so many. This is one small reason being sent back to you.' },
    { pos: [-38, -24], title: 'A little envelope', icon: '✉', color: 0xd58f93,
      note: 'Choose something you truly love. Until I can bring a present to your door, this one is on me.' },
    { pos: [-20, 18], title: 'The best one', icon: '♥', color: 0xed858e,
      note: 'For something that makes you smile—a little treat, a new adventure, or a wish you have been saving. You are deeply loved, today and every ordinary day too.' }
  ]
};

// Optional inspection only; the normal experience remains first person.
if(new URLSearchParams(location.search).has('inspect')&&new URLSearchParams(location.search).has('thirdPerson'))CONFIG.thirdPerson=true;
if(isPassenger)CONFIG.thirdPerson=false;

// Ten regular presents total ₹20,000. Legendary rewards remain unplaced.
const giftTiers=['small','medium','large','medium','medium','medium','small','medium','large','medium'];
CONFIG.gifts.forEach((gift,i)=>Object.assign(gift,{tier:giftTiers[i],...MONEY_TIERS[giftTiers[i]]}));
CONFIG.legendaryReserve=LEGENDARY_RESERVE;
if(CONFIG.gifts.reduce((sum,g)=>sum+g.amount,0)!==20000)throw new Error('Gift budget must total ₹20,000');

// The source valley's actual color script, reused here rather than approximated.
const P = {
  skyZenith:'#4E80B4', skyUpper:'#7BA9CE', skyMid:'#A8CAE0', skyHorizon:'#E4DAC2',
  skyHorizonSun:'#FBE2AE', sunGlow:'#FFF1CE', sunDisc:'#FFFAEA', skyAnti:'#C8D4D6',
  haze:'#A9BCC7', mist:'#D6DDD4',
  cloudTop:'#FFF8EC', cloudBody:'#F6E7D2', cloudTerm:'#E8CFB4', cloudUnder:'#B7ACC3',
  gTip:'#C6D46B', gUpper:'#93B84E', gMid:'#6C9A47', gLow:'#436E4F', gBase:'#2B564F',
  gTrans:'#E9EE7C', gSheen:'#EDF0C8', gDry:'#D9C079',
  gPatchA:'#87AC4B', gPatchB:'#6C9A56', gPatchC:'#9DBC5E', gPatchD:'#5F8A5A',
  tLit:'#93B159', tMid:'#6A924F', tShade:'#456A54', tHollow:'#33564F',
  pathLit:'#C9AD80', pathShade:'#7A664D', rockLit:'#B4A794', rockShade:'#5F5C58',
  wShallow:'#A5CBBE', wMid:'#5F9CA0', wDeep:'#2F5F6C', wSpark:'#FFFCEC',
  cLit:'#84A94C', cMid:'#5A8148', cShade:'#2F5546', cDeep:'#254A44', cTrans:'#BED063',
  cVarA:'#98AC43', cVarB:'#6E9440', cVarC:'#A9B65C', moss:'#6F8C4E', ambSky:'#9EC6E6', ambGround:'#AA9C64',
  trunkLit:'#8E7659', trunkShade:'#4C3F34', shadowTint:'#5C6E9E'
};

const $ = (selector) => document.querySelector(selector);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
function mulberry32(seed) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(14021996);
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const dummy = new THREE.Object3D();

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(.24, 'rgba(255,255,255,.92)');
  gradient.addColorStop(.62, 'rgba(255,255,255,.24)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const glowTexture = makeGlowTexture();

window.addEventListener('error', (event) => {
  const error = $('#error');
  error.style.display = 'block';
  error.textContent += `${event.error?.stack || event.message}\n`;
});

/* -------------------------------------------------------------------------- */
/* Scene and light                                                            */
/* -------------------------------------------------------------------------- */

const world = $('#world');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.08, 700);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
world.appendChild(renderer.domElement);

scene.fog = new THREE.FogExp2(0x9caeb0, 0.0044);

const hemi = new THREE.HemisphereLight(0xc2deff, 0x476855, 1.15);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffd5a2, 3.2);
sunLight.position.set(-85, 58, -72);
sunLight.castShadow = true;
const shadowMapSize=Math.min(4096,renderer.capabilities.maxTextureSize);
sunLight.shadow.mapSize.set(shadowMapSize,shadowMapSize);
sunLight.shadow.camera.left = -75;
sunLight.shadow.camera.right = 75;
sunLight.shadow.camera.top = 75;
sunLight.shadow.camera.bottom = -75;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 220;
sunLight.shadow.bias = -0.00012;
sunLight.shadow.normalBias = .008;
scene.add(sunLight);

const MOODS = {
  day: {
    top: P.skyZenith, upper:P.skyUpper, mid:P.skyMid, horizon:P.skyHorizon,
    horizonSun:P.skyHorizonSun, anti:P.skyAnti, glow:P.sunGlow, disc:P.sunDisc, fog:P.haze,
    oceanA: 0x155a91, oceanB: 0x3984b7, sun: 0xfff1d5, sunPower: 2.8,
    hemi: 1.42, exposure: 0.97, stars: 0, ambient: 0.96, elevation: 0.48
  },
  sunset: {
    top: 0x415f8c, upper:0x718eae, mid:0xb5b4bd, horizon:0xe9c4ad,
    horizonSun:0xffd59f, anti:0xaebfc9, glow:0xffd09a, disc:0xffffe8, fog:0xb4a7a0,
    oceanA: 0x294f7c, oceanB: 0x6998b6, sun: 0xffc886, sunPower: 2.4,
    hemi: 1.04, exposure: 0.97, stars: 0.03, ambient: 0.70, elevation: 0.105
  },
  night: {
    top: 0x071326, upper:0x102440, mid:0x182c46, horizon:0x26364c,
    horizonSun:0x353b51, anti:0x20334d, glow:0x50678e, disc:0xd8e3ef, fog:0x172d42,
    oceanA: 0x0c2639, oceanB: 0x34576a, sun: 0xa6b9dc, sunPower: 0.48,
    hemi: 0.32, exposure: 0.74, stars: 1, ambient: 0.13, elevation: 0.38
  }
};
let currentMood = CONFIG.startingMood;
let moodTarget = { ...MOODS[currentMood] };
const moodLive = { ...moodTarget };

// NASA/LROC surface map: keep a plain luminous disc until the local asset loads.
const moonSurfaceReady={value:0};
const moonSurface=new THREE.TextureLoader().load('./assets/moon-lroc.jpg',()=>{moonSurfaceReady.value=1;},undefined,()=>{});
// Read as scalar surface detail; the sky palette supplies the moon's colour.
moonSurface.colorSpace=THREE.NoColorSpace;
const skyUniforms = {
  uMoonSurface:{value:moonSurface},
  uMoonSurfaceReady:moonSurfaceReady,
  uAuroraTime: { value: 0 },
  uAuroraNight: { value: moodLive.stars },
  uTop: { value: new THREE.Color(moodLive.top) },
  uUpper: { value: new THREE.Color(moodLive.upper) },
  uMid: { value: new THREE.Color(moodLive.mid) },
  uHorizon: { value: new THREE.Color(moodLive.horizon) },
  uHorizonSun: { value: new THREE.Color(moodLive.horizonSun) },
  uAnti: { value: new THREE.Color(moodLive.anti) },
  uGlow: { value: new THREE.Color(moodLive.glow) },
  uDisc: { value: new THREE.Color(moodLive.disc) },
  uSunDir: { value: new THREE.Vector3(-0.58, moodLive.elevation, -0.82).normalize() }
};
// The sky's colour is a function so the ocean can reflect the actual sky rather
// than tinting toward a single horizon colour.
const skyGLSL = `
  ${auroraGLSL}
  uniform vec3 uTop, uUpper, uMid, uHorizon, uHorizonSun, uAnti, uGlow, uDisc, uSunDir;
  uniform sampler2D uMoonSurface;
  uniform float uMoonSurfaceReady;
  vec3 skyDome(vec3 d, float discGain){
    float yy = max(d.y, -0.18);
    vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.13, yy));
    col = mix(col, uUpper, smoothstep(0.06, 0.24, yy));
    col = mix(col, uTop, smoothstep(0.20, 0.68, yy));
    vec2 dh = normalize(d.xz + vec2(0.00001));
    vec2 sh = normalize(uSunDir.xz + vec2(0.00001));
    // Clamped because az feeds pow() below. Directly opposite the sun the dot
    // product rounds a hair past -1, az goes slightly negative, and
    // pow(negative, 2.1) is NaN — a meridian of black specks up the sky.
    float az = clamp(dot(dh, sh) * 0.5 + 0.5, 0.0, 1.0);
    float horiz = pow(1.0 - clamp(yy, 0.0, 1.0), 3.4);
    col = mix(col, uAnti, horiz * (1.0-az) * 0.62);
    col = mix(col, uHorizonSun, horiz * pow(az, 2.1) * 0.68);
    float ang = dot(d, uSunDir);
    col = mix(col, uGlow, clamp(pow(max(ang,0.0),12.0)*0.40 + pow(max(ang,0.0),2.9)*0.06,0.0,0.9));
    vec3 discColour=uDisc*1.42;
    if(ang>.9992 && uAuroraNight>.01 && uMoonSurfaceReady>.5){
      vec3 right=normalize(cross(uSunDir,vec3(0.0,1.0,0.0)));
      vec3 up=normalize(cross(right,uSunDir));
      vec2 lunar=vec2(dot(d,right),dot(d,up))/.034;
      float radius2=dot(lunar,lunar);
      float face=sqrt(max(0.0,1.0-radius2));
      vec2 uv=vec2(.5+atan(lunar.x,max(face,.0001))/6.2831853,
                   .5+asin(clamp(lunar.y,-1.0,1.0))/3.14159265);
      float albedo=dot(texture2D(uMoonSurface,uv).rgb,vec3(.2126,.7152,.0722));
      float detail=clamp(.40+.95*albedo,.58,1.05)*(.97+.03*face);
      discColour*=mix(1.0,detail,smoothstep(.35,.85,uAuroraNight));
    }
    col = mix(col, discColour, smoothstep(0.9992, 0.99972, ang) * discGain);
    col = mix(col, mix(uHorizon,uAnti,.35), (1.0-smoothstep(-0.16,0.0,d.y)));
    return col+auroraGlow(d,uSunDir);
  }
`;
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(400, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorld;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `${skyGLSL}
      varying vec3 vWorld;
      void main(){ gl_FragColor = vec4(skyDome(normalize(vWorld), 1.0), 1.0); }
    `
  })
);
scene.add(sky);

const stars=buildStars(scene);
const shootingStars=buildShootingStars(scene);
// Preserve the layout seed used by the original 900-star sampler.
for(let i=0;i<1800;i++)rand();

/* -------------------------------------------------------------------------- */
/* Island, beach and ocean                                                    */
/* -------------------------------------------------------------------------- */

function islandHeight(x, z) {
  const r = Math.sqrt((x / 67) ** 2 + (z / 54) ** 2);
  const body = 1 - smoothstep(0.70, 1.035, r);
  let height = -3.2 + body * 5.25;
  // Long, low-frequency swells: wavelengths of 80-200 units so every crest is a
  // slow rise and every trough a soft bowl. Squaring `body` keeps the shoreline
  // calm while letting the interior roll.
  const inland = body * body;
  height += Math.sin(x * 0.047 + 0.6) * Math.cos(z * 0.038 - 0.3) * 1.35 * inland;
  height += Math.sin(x * 0.029 + z * 0.043 + 1.7) * 0.95 * inland;
  height += Math.cos(z * 0.067 - x * 0.024 - 0.9) * 0.55 * inland;
  // Barely-there surface grain so the swells do not read as bare mathematics.
  height += Math.sin(x * 0.105 + Math.cos(z * 0.083)) * 0.075 * body;
  height += Math.exp(-((x - 19) ** 2 + (z + 5) ** 2) / 900) * 1.5;
  height += Math.exp(-((x + 30) ** 2 + (z - 21) ** 2) / 760) * 0.8;
  return height;
}

// Keep the birthday clearing level, blending gently back into the hills.
// x, z, lantern height: shared by the fixtures and the grass lighting.
// The approach lantern sits beyond the right shoulder, nested in the grass.
const lanternSites=[[3.2,20,1.4],[27,28,1.4],[-28,-23,1.4],[-34,0,1.4],[-3,-33,1.4],[39,3,1.4],[-12,27,1.4],[SHORE.x-1.5,SHORE.z+1.6,1.5]];
const gardenHeight=islandHeight(-8,-10);
function terrainHeight(x,z){
  const original=lerp(gardenHeight,islandHeight(x,z),smoothstep(8.2,16.5,Math.hypot(x+8,z+10)));
  const shoreDistance=Math.hypot((x-SHORE.x)/4.4,(z-SHORE.z)/5.4);
  return lerp(1.55,original,smoothstep(.95,1.8,shoreDistance));
}

function celebrationPathX(z){
  const original=-2+Math.sin(z*.13)*3.5;
  return lerp(-8,original,smoothstep(-10,2,z));
}
function celebrationPathWidth(z,side){
  const taper=1-smoothstep(25,38,z);
  const irregular=.13*Math.sin(z*.63+side*1.7)+.07*Math.sin(z*1.21-side*.8);
  return (1.76+irregular)*lerp(.35,1,taper);
}
function meadowMask(x, z) {
  const angle=Math.atan2(z+10,x+8);
  const edge=5.5+.4*Math.sin(angle*3.0)+.25*Math.cos(angle*5.0);
  const garden = smoothstep(edge,edge+1.7,Math.hypot(x+8,z+10));
  const bench = smoothstep(2.6, 4.8, Math.hypot(x + 43, z + 3));
  const pathX=celebrationPathX(z);
  const side=x<pathX?-1:1;
  const width=celebrationPathWidth(z,side);
  // The entrance wears gradually into the meadow over several steps. The same
  // continuous mask controls soil color and both grass layers, avoiding a cap.
  const entrance=1-smoothstep(25,38,z);
  const strength=smoothstep(-12,-7,z)*entrance*entrance;
  const shoulder=.68+.10*Math.sin(z*.43+side);
  const path=1-strength*(1-smoothstep(width,width+shoulder,Math.abs(x-pathX)));
  let lamps=1;
  for(const [lx,lz] of lanternSites)lamps*=smoothstep(.25,.50,Math.hypot(x-lx,z-lz));
  const hearth=smoothstep(3.1,4.5,Math.hypot(x-22,z+20));
  return garden * bench * path * lamps * hearth * smoothstep(.72,1.08,Math.hypot((x-SHORE.x)/3.8,(z-SHORE.z)/4.4));
}

// ~0.75 m cells. The meadow mask is baked into these vertex colors, so a coarser
// grid turns every clearing edge and path into a visible checkerboard.
const terrainGeo = new THREE.PlaneGeometry(190, 170, 256, 224);
terrainGeo.rotateX(-Math.PI / 2);
const terrainPos = terrainGeo.attributes.position;
const terrainColors = [];
const sand = new THREE.Color(P.pathLit);
const grassA = new THREE.Color(P.gLow);
const grassB = new THREE.Color(P.gMid);
const soil = new THREE.Color(P.pathShade);
const terrainSand = [];
for (let i = 0; i < terrainPos.count; i++) {
  const x = terrainPos.getX(i);
  const z = terrainPos.getZ(i);
  const y = terrainHeight(x, z);
  terrainPos.setY(i, y);
  let color;
  if (y < 0.3) color = sand.clone().lerp(soil, clamp((-y) / 4, 0, .45));
  else color = grassA.clone().lerp(grassB, clamp((y - .3) / 3.5, 0, 1));
  const meadow = meadowMask(x, z);
  // Where the sward is cleared the ground shader swaps to a sand palette; this
  // channel says how far. Beaches below the waterline read as sand too.
  const bare = y > .3 ? Math.pow(1 - meadow, .45) * .92 : 1;
  const grain = Math.sin(x * .9 + Math.cos(z * .7)) * .5 + .5;
  terrainSand.push(clamp(bare * (.86 + grain * .2), 0, 1));
  // The floor under a dense sward is in its shade; leaving it bright makes
  // every gap between blades read as a hole rather than as depth.
  if (y > .3) color.multiplyScalar(lerp(1, .68, meadow));
  // Low frequency on purpose: faster than the ~1.5 m vertex spacing and the
  // variation aliases into a visible checkerboard wherever grass is thin.
  const variation = (Math.sin(x * .27 + z * .19) * .5 + .5) * .07 - .035;
  color.offsetHSL(variation * .15, 0, variation);
  terrainColors.push(color.r, color.g, color.b);
}
terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
terrainGeo.setAttribute('aSand', new THREE.Float32BufferAttribute(terrainSand, 1));
terrainGeo.computeVertexNormals();
const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: .98, metalness: 0, flatShading: false
}));
terrain.receiveShadow = true;
scene.add(terrain);

const oceanUniforms = {
  // The water reflects the sky, so it carries the sky's whole palette. These are
  // the same uniform objects, so mood transitions reach both at once.
  ...skyUniforms,
  uTime: { value: 0 },
  uFishRipples: {value:Array.from({length:8},()=>new THREE.Vector4(0,0,-100,0))},
  uColorA: { value: new THREE.Color(moodLive.oceanA) },
  uColorB: { value: new THREE.Color(moodLive.oceanB) },
  uSunColor: { value: new THREE.Color(moodLive.glow) },
  uNight: { value: 0 }
};
const oceanGeo = new THREE.PlaneGeometry(700, 700, 200, 200);
oceanGeo.rotateX(-Math.PI / 2);
// Long swells carried by the mesh, plus finer ripples that live only in the
// normal: at ~3.5 m per quad the geometry cannot hold them, but they are most
// of what makes a surface read as water rather than a tinted plane.
const oceanGLSL = `
  float oceanSwell(vec2 p, float t, out vec2 grad){
    vec2 d1=vec2(0.860,0.510), d2=vec2(-0.319,0.948), d3=vec2(0.621,-0.784);
    float h=0.0; vec2 g=vec2(0.0); float ph;
    ph=dot(p,d1)*0.082+t*0.58; h+=sin(ph)*0.34; g+=d1*(0.082*cos(ph)*0.34);
    ph=dot(p,d2)*0.129-t*0.46; h+=sin(ph)*0.21; g+=d2*(0.129*cos(ph)*0.21);
    ph=dot(p,d3)*0.055+t*0.33; h+=sin(ph)*0.44; g+=d3*(0.055*cos(ph)*0.44);
    grad=g; return h;
  }
  // Amplitudes here are chosen for SLOPE, not for height: a wave that displaces
  // the surface but barely tilts it leaves the water looking like tinted glass.
  // These four sum to roughly a 17 degree tilt, which is what catches the light.
  vec2 oceanRipple(vec2 p, float t, float footprint){
    p += vec2(sin(p.y*.13+t*.15),sin(p.x*.11-t*.12))*1.8;
    vec2 d4=vec2(0.941,-0.339), d5=vec2(0.179,0.984), d6=vec2(-0.721,-0.693);
    vec2 g=vec2(0.0); float ph;
    ph=dot(p,d4)*0.55+t*1.55; g+=d4*(0.55*cos(ph)*0.160);
    ph=dot(p,d5)*1.10-t*2.10; g+=d5*(1.10*cos(ph)*0.075);
    ph=dot(p,d6)*2.20+t*2.90; g+=d6*(2.20*cos(ph)*0.032);
    ph=dot(p,d5)*4.30+t*4.10; g+=d5*(4.30*cos(ph)*0.013);
    return g;
  }
  float oceanHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
  float oceanNoise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(oceanHash(i),oceanHash(i+vec2(1,0)),f.x),
               mix(oceanHash(i+vec2(0,1)),oceanHash(i+vec2(1,1)),f.x),f.y);
  }
`;
const ocean = new THREE.Mesh(oceanGeo, new THREE.ShaderMaterial({
  uniforms: oceanUniforms,
  depthWrite: true,
  vertexShader: `${oceanGLSL}
    uniform float uTime;
    varying vec3 vWorld;
    void main(){
      vec3 p = position;
      vec2 g;
      p.y += oceanSwell(p.xz, uTime, g);
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: `${skyGLSL}${oceanGLSL}
    uniform vec4 uFishRipples[8];
    uniform vec3 uColorA, uColorB, uSunColor;
    uniform float uTime, uNight;
    varying vec3 vWorld;
    void main(){
      vec3 view = normalize(cameraPosition - vWorld);
      float dist = length(cameraPosition.xz - vWorld.xz);

      vec2 g; float h = oceanSwell(vWorld.xz, uTime, g);
      // Retire the fine ripples with distance: sub-pixel normal detail does not
      // resolve, it sparkles.
      float footprint=max(length(dFdx(vWorld.xz)),length(dFdy(vWorld.xz)));
      g += oceanRipple(vWorld.xz, uTime, footprint) * .68 * (1.0 - smoothstep(25.0, 170.0, dist));
      // Fish disturb the water's reflective surface, rather than painting
      // pale rings over it. A damped wave packet spreads and catches sky light.
      for(int i=0;i<8;i++){
        vec4 impact=uFishRipples[i];float age=uTime-impact.z;
        if(age>0.0&&age<3.8){
          vec2 offset=vWorld.xz-impact.xy;float d2=dot(offset,offset);
          if(d2<49.0){
            float r=sqrt(d2),size=max(.4,impact.w),front=r-age*1.45;
            float envelope=exp(-pow(front/(.40+.12*size),2.0))*exp(-age*.65);
            float fade=smoothstep(0.0,.10,age)*(1.0-smoothstep(2.3,3.8,age));
            float bend=sin(offset.x*2.1+uTime*.8)*sin(offset.y*1.7-uTime*.6)*.10;
            float slope=.16*size*envelope*fade*cos((front+bend)*10.0);
            slope*=1.0-smoothstep(.18,.6,footprint);
            g+=offset/max(r,.05)*slope;
          }
        }
      }
      vec3 n = normalize(vec3(-g.x, 1.0, -g.y));

      float shore = 1.0 - smoothstep(.86, 1.2, length(vWorld.xz/vec2(67.0,54.0)));
      vec3 body = mix(uColorA, uColorB, clamp(.18 + shore*.62 + h*.12, 0.0, 1.0));
      // Wave faces tilted toward the sky read lighter; this is the surface's own form.
      body *= .90 + .26*clamp(n.y*n.y*n.y, 0.0, 1.0) + .18*clamp(-g.y, -.4, .4);

      // Reflect the sky itself rather than tinting toward one horizon colour —
      // this is what gives the surface somewhere to be, instead of a flat wash.
      vec3 R = reflect(-view, n);
      vec3 refl = skyDome(normalize(vec3(R.x, max(R.y, 0.012), R.z)), 0.55);
      float fres = clamp(.025 + .80*pow(1.0 - max(dot(n,view),0.0), 4.5), 0.0, .44);
      vec3 col = mix(body, refl, fres*mix(.66,1.0,uNight));

      // Quantised glitter: a noise gate breaks the specular into separate
      // sparks, which is what a sun path on water actually looks like.
      float f = dot(normalize(R), uSunDir);
      float broad = pow(max(f,0.0), 24.0);
      float twinkle = smoothstep(.35,.60, oceanNoise(vWorld.xz*vec2(1.7,3.2) - vec2(uTime*1.1, uTime*.35)))
                    * (.55 + .75*oceanNoise(vWorld.xz*6.5 - uTime*2.0));
      float aa=max(fwidth(f),.0001);
      float glint = smoothstep(.9970-aa, .99930+aa, f) * mix(twinkle,.5,smoothstep(.15,1.2,footprint));
      float glitterPath = smoothstep(.25, 1.0, dot(normalize(vec2(view.x,view.z)), -normalize(uSunDir.xz)));
      col += uSunColor * (glint*2.1 + broad*.45) * (.35 + .75*glitterPath) * (1.0 - uNight*.72);

      // Shore foam, scalloped by noise so it is a breaking edge, not a ring.
      float rim = length(vWorld.xz/vec2(67.0,54.0));
      float scal = oceanNoise(vWorld.xz*.85 - vec2(uTime*.30, uTime*.18));
      float band = .85 + sin(uTime*.7)*.008 + (scal-.5)*.016;
      float foam = (1.0 - smoothstep(.008, .052, abs(rim - band))) * (.45 + .85*scal);
      col = mix(col, uHorizon*1.05, clamp(foam,0.0,1.0)*.40);

      vec3 seaHaze=mix(uHorizon,uColorA,.26*(1.0-uNight));
      col = mix(col, seaHaze, 1.0 - exp(-dist*mix(.0010,.0017,uNight)));
      gl_FragColor = vec4(col, 1.0);
    }
  `
}));
ocean.position.y = 0;
ocean.renderOrder = 2;
scene.add(ocean);
const oceanLife=buildOceanLife(scene,glowTexture);
let fishRippleCursor=0;
const jumpingFish=buildJumpingFish(scene,{terrainHeight,onSplash:(x,z,time,size)=>{
  oceanUniforms.uFishRipples.value[fishRippleCursor++%8].set(x,z,time,size);
}});
const lovePlane=buildLovePlane(scene,{loop:new URLSearchParams(location.search).has('planeStill')});
buildDistantIsland(scene,skyUniforms.uHorizon);

/* -------------------------------------------------------------------------- */
/* Procedural helpers and island decoration                                   */
/* -------------------------------------------------------------------------- */

const flowerTintCanvas=document.createElement('canvas');flowerTintCanvas.width=flowerTintCanvas.height=512;
const flowerTintContext=flowerTintCanvas.getContext('2d');
flowerTintContext.fillStyle='#000';flowerTintContext.fillRect(0,0,512,512);
const flowerTintTexture=new THREE.CanvasTexture(flowerTintCanvas);
flowerTintTexture.flipY=false;flowerTintTexture.generateMipmaps=false;flowerTintTexture.minFilter=THREE.LinearFilter;
const paintUniforms = {
  uFlowerTint:{value:flowerTintTexture},
  uSunDir: skyUniforms.uSunDir,
  uLightColor: { value: new THREE.Color(moodLive.sun) },
  uAmbient: { value: moodLive.ambient },
  uPartyGlow: { value: 0 },
  uCakeLight: {value:new THREE.Vector3(-8,gardenHeight+2.4,-10)},
  uStumpBase: {value:new THREE.Vector3()},
  uStumpRoots: {value:[.2,1.25,2.35,3.5,4.65,5.55]},
  uGiftLights:{value:CONFIG.gifts.map(g=>new THREE.Vector4(g.pos[0],terrainHeight(...g.pos)+.8,g.pos[1],0))},
  uFireflyPools:{value:Array.from({length:8},()=>new THREE.Vector4(0,0,0,0))},
  uGiftColors:{value:CONFIG.gifts.map(g=>new THREE.Color(g.color).lerp(new THREE.Color(0xffe6b8),.35))},
  uLanterns: {value:lanternSites.map(([x,z,h])=>new THREE.Vector4(x,terrainHeight(x,z)+h,z,4.8))},
  uFogColor: { value: scene.fog.color },
  uShadowMap: { value: null },
  uShadowTexel: { value: 1/shadowMapSize },
  uShadowMatrix: { value: sunLight.shadow.matrix },
  uShadowReady: { value: 0 },
  uTime: { value: 0 }
};
const glColor = hex => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(5)},${c.g.toFixed(5)},${c.b.toFixed(5)})`; };
// Shared world-space gust: broad, warped fronts drive both bending and the
// distant meadow sheen, without simulation textures or additional draw calls.
const meadowWindGLSL = `
  float meadowWind(vec2 p,float time){
    vec2 dir=normalize(vec2(.82,.42));
    float along=dot(p,dir),across=dot(p,vec2(-dir.y,dir.x));
    float phase=along*.23-time*.85+sin(across*.14+time*.09)*.9;
    float front=smoothstep(-.25,.92,sin(phase));
    return front*(.68+.32*sin(across*.095-time*.13)*sin(across*.095-time*.13));
  }
`;
const paintGLSL = `
  ${meadowWindGLSL}
  uniform vec3 uSunDir, uLightColor, uFogColor;
  uniform sampler2D uFlowerTint;
  uniform float uAmbient, uTime, uShadowReady, uPartyGlow;
  uniform vec3 uCakeLight,uStumpBase;
  uniform float uStumpRoots[6];
  uniform vec4 uFireflyPools[8];
  uniform vec4 uGiftLights[10];uniform vec3 uGiftColors[10];
  uniform vec4 uLanterns[${lanternSites.length}];
  uniform sampler2D uShadowMap;
  uniform float uShadowTexel;
  uniform mat4 uShadowMatrix;
  #include <packing>
  float islandShadow(vec3 p) {
    if(uShadowReady < .5) return 1.0;
    vec4 q = uShadowMatrix * vec4(p,1.0);
    vec3 uv = q.xyz / q.w;
    if(uv.z > 1.0 || uv.z < 0.0 || min(uv.x,uv.y) < .002 || max(uv.x,uv.y) > .998) return 1.0;
    // 3x3 rather than 2x2: four taps give only five levels of penumbra, which
    // on open ground reads as the shadow map's own texel grid.
    float sh = 0.0;
    for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) {
      vec2 d = vec2(float(x),float(y))*2.8*uShadowTexel;
      sh += step(uv.z-.00035, unpackRGBAToDepth(texture2D(uShadowMap,uv.xy+d)));
    }
    return sh/9.0;
  }
  // Interpolate depth comparisons, never packed depth values. This removes
  // the square steps between shadow texels on bare ground and the cake clearing.
  float groundShadowTap(vec2 uv,float depth){
    vec2 grid=uv/uShadowTexel-.5;
    vec2 f=fract(grid),base=(floor(grid)+.5)*uShadowTexel;
    float a=step(depth,unpackRGBAToDepth(texture2D(uShadowMap,base)));
    float b=step(depth,unpackRGBAToDepth(texture2D(uShadowMap,base+vec2(uShadowTexel,0.0))));
    float c=step(depth,unpackRGBAToDepth(texture2D(uShadowMap,base+vec2(0.0,uShadowTexel))));
    float d=step(depth,unpackRGBAToDepth(texture2D(uShadowMap,base+vec2(uShadowTexel))));
    return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
  }
  float islandGroundShadow(vec3 p){
    if(uShadowReady<.5)return 1.0;
    vec4 q=uShadowMatrix*vec4(p,1.0);vec3 uv=q.xyz/q.w;
    if(uv.z>1.0||uv.z<0.0||min(uv.x,uv.y)<.002||max(uv.x,uv.y)>.998)return 1.0;
    float depth=uv.z-.00006,shade=0.0;
    // Overlapping tent taps avoid ghost copies of narrow pole shadows.
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
      float weight=(x==0?2.0:1.0)*(y==0?2.0:1.0);
      shade+=groundShadowTap(uv.xy+vec2(float(x),float(y))*uShadowTexel,depth)*weight;
    }
    return shade/16.0;
  }
  float cloudShade(vec3 p) {
    float f = sin(p.x*.053+p.z*.027-uTime*.045)*sin(p.z*.061-uTime*.026);
    return 1.0 - .18*smoothstep(.15,.8,f);
  }
  float meadowSoftness(vec3 p){
    float night=1.0-smoothstep(.22,.84,uAmbient);
    float d=distance(cameraPosition,p);
    // Keep a visible share of the blade shading even in the far field.
    return mix(mix(.10,.16,night),mix(.60,.70,night),
      smoothstep(mix(6.0,4.0,night),mix(30.0,24.0,night),d));
  }
  vec3 meadowPigment(vec3 p){
    ${CONFIG.flowerGrassTints ? '' : 'return vec3(1.0);'}
    // A baked field follows actual flower locations, including their overlaps.
    vec2 pigment=texture2D(uFlowerTint,(p.xz+70.0)/140.0).rg;
    return mix(vec3(1.0),vec3(1.23,1.13,.82),pigment.r*.8)
      *mix(vec3(1.0),vec3(.92,1.12,1.21),pigment.g*.8);
  }
  vec3 meadowWash(vec3 p,float shadow){
    // Like the reference's far sward mean, a single colour field ties the
    // blades to the floor. Slow variation reads as washes of pigment.
    float washField=.5+.20*sin(p.x*.17+sin(p.z*.13))+.13*sin(p.z*.24-p.x*.11);
    vec3 pigment=mix(${glColor(P.gLow)},${glColor(P.gMid)},.40+washField*.27);
    pigment*=mix(.72,1.02,shadow);
    float daylight=smoothstep(.22,.84,uAmbient);
    pigment*=mix(vec3(1.12,1.22,1.36),vec3(1.0),daylight);
    pigment*=1.0+meadowWind(p.xz,uTime)*mix(.07,.19,daylight);
    return pigment*mix(vec3(.60,.78,.86),uLightColor,.52)*uAmbient*1.30;
  }
  vec3 aerial(vec3 c, vec3 p) {
    float lampLight=0.0;
    for(int i=0;i<${lanternSites.length};i++){
      vec3 delta=p-uLanterns[i].xyz;
      float fall=max(1.0-dot(delta,delta)/(uLanterns[i].w*uLanterns[i].w),0.0);
      lampLight+=fall*fall;
    }
    // Lift and warm the existing pigment, keeping individual grass blades
    // legible instead of laying an opaque orange wash over the ground.
    c+=(c*vec3(5.0,2.7,.8)+vec3(.012,.007,.002))*lampLight*uPartyGlow;
    // A broad ambient lift belongs to the clearing's ground, independent of
    // lamp distance and shadows. A level centre avoids a spotlight-like disc.
    vec2 clearing=p.xz-uCakeLight.xz;
    float clearingRadius=length(clearing/vec2(1.08,1.0));
    float clearingFill=1.0-smoothstep(3.8,9.2,clearingRadius);
    float groundHeight=uCakeLight.y-2.4;
    clearingFill*=1.0-smoothstep(.65,2.0,max(0.0,p.y-groundHeight));
    float evening=uPartyGlow*uPartyGlow;
    c+=(c*vec3(1.8,1.45,1.05)+vec3(.040,.027,.014))*clearingFill*evening;
    vec3 hearthDelta=p-vec3(22.,0,-20.);
    float hearthPool=pow(max(0.,1.-dot(hearthDelta.xz,hearthDelta.xz)/27.),2.);
    c+=(c*vec3(.95,.49,.16)+vec3(.038,.017,.004))*hearthPool*(.25+.75*uPartyGlow);
    for(int i=0;i<10;i++){
      vec3 d=p-uGiftLights[i].xyz;
      float f=max(0.0,1.0-dot(d.xz,d.xz)/12.0);
      f*=1.0-smoothstep(.7,1.8,abs(d.y));
      c+=(c*.9+vec3(.025))*uGiftColors[i]*f*f*uGiftLights[i].w*(.16+.84*uPartyGlow);
    }
    for(int i=0;i<8;i++){
      vec3 d=p-uFireflyPools[i].xyz;
      float pool=max(0.0,1.0-dot(d.xz,d.xz)/1.44);
      pool*=pool*(1.0-smoothstep(.15,1.0,abs(d.y)));
      c+=(c*.55+vec3(.024,.022,.008))*pool*uFireflyPools[i].w;
    }
    vec2 stumpDelta=p.xz-uStumpBase.xz;
    float stumpAngle=atan(stumpDelta.x,stumpDelta.y),rootFlare=0.0;
    for(int i=0;i<6;i++){
      float delta=atan(sin(stumpAngle-uStumpRoots[i]),cos(stumpAngle-uStumpRoots[i]));
      rootFlare+=(.34+.06*sin(float(i)*2.7))*exp(-delta*delta/.025);
    }
    float ripple=1.0+.035*sin(stumpAngle*5.0)+.025*sin(stumpAngle*9.0+.4);
    float edgeDistance=length(stumpDelta)-(.60*ripple+rootFlare*.53);
    vec2 towardFire=normalize(vec2(22.0,-20.0)-uStumpBase.xz);
    vec2 outward=stumpDelta/max(length(stumpDelta),.001);
    float fireFacing=smoothstep(-.45,.65,dot(outward,towardFire));
    float nearSoil=1.0-smoothstep(.3,.65,abs(p.y-uStumpBase.y));
    float contact=(1.0-smoothstep(-.02,mix(.19,.09,fireFacing),edgeDistance))*nearSoil;
    c*=1.0-mix(.43,.12,fireFacing)*contact;
    float crevice=(1.0-smoothstep(-.005,.045,edgeDistance))*nearSoil;
    c*=1.0-mix(.34,.18,fireFacing)*crevice;
    float dist = distance(cameraPosition,p);
    return mix(c,uFogColor,1.0-exp(-pow(max(0.0,dist-18.0),2.0)*.000026));
  }
`;
function paintedMaterial(low, mid, high, sway = false, sand = false) {
  return new THREE.ShaderMaterial({
    uniforms: paintUniforms,
    vertexShader: `varying vec3 vWorld,vNormal; varying vec3 vColor;
      ${sand ? 'attribute float aSand; varying float vSand;' : ''}
      ${sway ? TREE_SWAY_GLSL : ''}
      void main(){vec4 local=vec4(position,1.0);vec3 n=normal;
      #ifdef USE_INSTANCING
      local=instanceMatrix*local;n=mat3(instanceMatrix)*n;
      #endif
      vec4 w=modelMatrix*local;vWorld=w.xyz;
      ${sway ? `
      #ifdef USE_INSTANCING
      vWorld=islandTreeLeaf(islandTreeBend(vWorld,uTime),vWorld,
        (modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz,uTime);
      w=vec4(vWorld,1.0);
      #endif` : ''}
      ${sand ? 'vSand=aSand;' : ''}
      vNormal=normalize(mat3(modelMatrix)*n);vColor=vec3(1.0);
      #ifdef USE_COLOR
      vColor=color;
      #endif
      gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `${paintGLSL}
      varying vec3 vWorld,vNormal,vColor;
      ${sand ? 'varying float vSand;' : ''}
      void main(){
        float sh=${sand ? 'islandGroundShadow' : 'islandShadow'}(vWorld)*cloudShade(vWorld);
        float light=smoothstep(-.25,.85,dot(normalize(vNormal),uSunDir))*sh;
        vec3 cLow=${glColor(low)}, cMid=${glColor(mid)}, cHigh=${glColor(high)};
        ${sand ? `
        // A bare trail has to swap the PALETTE, not just tint it. Multiplying a
        // sand vertex colour into a green ramp only ever yields olive.
        cLow=mix(cLow,${glColor(P.pathShade)},vSand);
        cMid=mix(cMid,${glColor(P.pathLit)},vSand);
        cHigh=mix(cHigh,vec3(0.871,0.773,0.588),vSand);
        // Warm the light tint back up on sand: the cool sky term that flatters
        // grass turns a trail grey.
        vec3 warmth=mix(vec3(1.0),vec3(1.10,1.03,0.90),vSand);` : ''}
        vec3 c=mix(cLow,cMid,smoothstep(.0,.48,light));
        c=mix(c,cHigh,smoothstep(.40,.92,light));
        c*=mix(vec3(.45,.65,1.0),uLightColor,.48)*uAmbient${sand ? '*warmth' : ''};
        // The vertex colour carries the grass tint and the sward shading. On a
        // bare trail it has to step aside, or it multiplies the sand back green.
        c*=${sand ? 'mix(vColor, vec3(1.0), vSand)' : 'vColor'};
        float mosaic=sin(vWorld.x*.47+sin(vWorld.z*.22))*sin(vWorld.z*.36+vWorld.x*.19);
        c*=.94+.09*mosaic;
        // Skewed on purpose: a product of two axis-aligned sines is a
        // checkerboard, and on open ground it reads as tiling, not as grain.
        c*=.97+.035*sin(vWorld.x*3.1+vWorld.z*1.7)*sin(vWorld.z*2.6-vWorld.x*2.1);
        ${sand ? 'c=mix(c,meadowWash(vWorld,sh),meadowSoftness(vWorld)*(1.0-vSand));c*=mix(meadowPigment(vWorld),vec3(1.0),vSand);' : ''}
        gl_FragColor=vec4(aerial(c,vWorld),${sand ? '1.0-.5*meadowSoftness(vWorld)*(1.0-vSand)' : '1.0'});
      }`
  });
}
// Tree sway, adapted from the reference valley's TREE_VS. Three motions layered:
// a trunk that leans and rings at its own low resonant frequency, clumps that
// swing faster on their own phases, and leaves fluttering around their clump.
// The gust field is the grass shader's, verbatim, so a gust crossing the meadow
// reaches the canopy above it instead of each system inventing its own weather.
const TREE_SWAY_GLSL = `
  uniform float uTime;
  attribute vec4 iSway;   // x,z = root position · y = ground height · w = tree height
  attribute float iPhase;
  float islandGust(vec2 p, float t){
    return sin(p.x*.12+p.y*.09-t*1.65)+sin(p.x*.31-p.y*.24-t*2.2)*.24;
  }
  vec3 islandTreeBend(vec3 world, float t){
    float H = iSway.w;
    if(H <= 0.0) return world;             // anything without sway data stays put
    vec2 root = vec2(iSway.x, iSway.z);
    float gust = islandGust(root, t);
    vec2 bd = normalize(vec2(.82,.42));
    // A slow mode per tree, so neighbours never move in lockstep.
    float f0 = .30 + .22*fract(iPhase*.31831);
    float osc = sin(t*6.2831853*f0 + iPhase);
    float bend = clamp(.045 + gust*.05 + max(gust,0.0)*.06*osc, -.10, .22);
    float yn = clamp((world.y - iSway.y)/H, 0.0, 1.4);
    vec3 p = world;
    p.xz += bd * (bend * yn*yn * H * .42);
    p.y  -= bend*bend * yn*yn * H * .22;   // the crown drops as the trunk arcs over
    return p;
  }
  vec3 islandTreeLeaf(vec3 bent, vec3 world, vec3 clump, float t){
    if(iSway.w <= 0.0) return bent;
    float gust = islandGust(vec2(iSway.x, iSway.z), t);
    vec2 bd = normalize(vec2(.82,.42));
    float cph = dot(clump.xz, vec2(.61,.43)) + iPhase*2.7;
    float f1 = .55 + .40*fract(sin(cph)*137.51);
    float csw = sin(t*6.2831853*f1 + cph);
    vec3 p = bent + vec3(bd.x,.18,bd.y) * csw * (.035 + .075*abs(gust));
    vec3 rel = world - clump;
    float rl = length(rel) + 1e-4;
    float flut = sin(t*4.6 + dot(rel, vec3(3.3,4.9,2.7)) + cph*1.7);
    return p + (rel/rl) * flut * (.02 + .03*abs(gust));
  }
`;

const groundMaterial = paintedMaterial('#8daca6', '#aed9ab', '#c4e5b2', false, true);
groundMaterial.vertexColors = true;
terrain.material.dispose();
terrain.material = groundMaterial;

const mats = {
  wood: new THREE.MeshStandardMaterial({ color: P.trunkLit, roughness: .68 }),
  darkWood: new THREE.MeshStandardMaterial({ color: P.trunkShade, roughness: .72 }),
  leaf: paintedMaterial(P.cDeep, P.cMid, P.cLit),
  stone: new THREE.MeshStandardMaterial({ color: P.rockLit, roughness: 1, flatShading: true }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf4dec1, roughness: .58 }),
  pink: new THREE.MeshStandardMaterial({ color: 0xdc8e96, roughness: .60 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0xb76768, roughness: 1, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ color: 0xe8bd64, roughness: .36, metalness: .25 }),
};

function box(w, h, d, material, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}
function cylinder(rt, rb, h, segments, material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function putOnGround(object, x, z, offset = 0) {
  object.position.set(x, terrainHeight(x, z) + offset, z);
  scene.add(object);
  return object;
}

// The reference's complete branched / scalloped trees, in four instanced
// archetypes. Per-vertex clump centres keep the beauty and depth sway identical.
const referenceTreeTransform = `
  ${TREE_SWAY_GLSL}
  attribute vec3 clm;
  attribute float flx, hue;
  vec3 treeWorld(vec3 local){
    vec3 world=(modelMatrix*instanceMatrix*vec4(local,1.0)).xyz;
    vec3 bent=islandTreeBend(world,uTime);
    if(flx>.9){
      vec3 centre=(modelMatrix*instanceMatrix*vec4(clm,1.0)).xyz;
      bent=islandTreeLeaf(bent,world,centre,uTime);
    }
    return bent;
  }
`;
const referenceTreeMaterial=new THREE.ShaderMaterial({
  uniforms:paintUniforms,
  vertexShader:`${referenceTreeTransform}
    varying vec3 vWorld,vNormal;
    varying float vHue,vLeaf,vAO;
    void main(){
      vWorld=treeWorld(position);
      vNormal=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
      vHue=fract(hue+iPhase*.13);vLeaf=step(.9,flx);
      float h=clamp((vWorld.y-iSway.y)/iSway.w,0.0,1.0);
      vAO=mix(.62,1.0,smoothstep(0.0,.55,h));
      gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);
    }`,
  fragmentShader:`${paintGLSL}${GL_HASH}${GL_NOISE}
    varying vec3 vWorld,vNormal;
    varying float vHue,vLeaf,vAO;
    vec3 ramp3(float t,vec3 shade,vec3 mid,vec3 lit,float soft,float jit){
      return mix(mix(shade,mid,smoothstep(.17-soft+jit,.17+soft+jit,t)),
        lit,smoothstep(.58-soft+jit,.58+soft+jit,t));
    }
    void main(){
      vec3 N=normalize(vNormal), V=normalize(cameraPosition-vWorld);
      vec3 lit,mid,shd;
      float grain=pn2(vWorld.xz*.85+vWorld.y*.6)*.5+.5;
      if(vLeaf>.5){
        vec3 base=vHue<.26?${glColor(P.cVarA)}:(vHue<.52?${glColor(P.cLit)}:
          (vHue<.76?${glColor(P.cVarB)}:${glColor(P.cVarC)}));
        lit=mix(base,${glColor(P.cLit)},.42)*(1.02+.24*grain);
        mid=mix(${glColor(P.cMid)},base*.72,.45);
        shd=mix(${glColor(P.cShade)},${glColor(P.cDeep)},grain*.45);
      }else{
        float bark=pn2(vec2(atan(N.z,N.x)*3.4,vWorld.y*3.1))*.5+.5;
        lit=${glColor(P.trunkLit)}*(.82+.34*bark);
        mid=mix(${glColor(P.trunkLit)},${glColor(P.trunkShade)},.55);
        shd=${glColor(P.trunkShade)}*(.85+.3*bark);
        float moss=(1.0-smoothstep(-.5,.15,N.y))*grain;
        shd=mix(shd,${glColor(P.moss)}*.55,moss*.35);
      }
      float sh=islandShadow(vWorld)*cloudShade(vWorld);
      float ndl=dot(N,uSunDir);
      float t=clamp(ndl*.62+.46,0.0,1.0)*mix(.34,1.0,sh);
      float dist=distance(cameraPosition,vWorld);
      float soft=mix(.09,.20,clamp(dist*.004,0.0,1.0));
      float jit=(vn2(vWorld.xz*3.9+vWorld.y*1.7)-.5)*.055;
      vec3 col=ramp3(t,shd,mid,lit,soft,jit);
      float litAmt=smoothstep(.34,.86,t);
      col*=mix(vec3(.94),uLightColor*1.32,litAmt*.62);
      col=mix(col*.80+${glColor(P.shadowTint)}*.040,col,sh*.82+.18);
      vec3 hemi=mix(${glColor(P.ambGround)},${glColor(P.ambSky)},N.y*.5+.5);
      vec3 hueOnly=hemi/max(dot(hemi,vec3(.2126,.7152,.0722)),.001);
      col*=mix(vec3(1.0),hueOnly,.22*(1.0-litAmt*.55));
      col+=hemi*.052*vAO*(1.0-litAmt*.85);
      float back=smoothstep(.05,.85,dot(V,-uSunDir));
      float fres=pow(1.0-clamp(dot(N,V),0.0,1.0),4.2);
      col+=uLightColor*fres*back*mix(.28,.52,vLeaf)*1.15*sh;
      float tr=pow(clamp(dot(V,-uSunDir),0.0,1.0),3.2);
      float thin=pow(clamp(1.0-abs(ndl),0.0,1.0),2.2);
      col+=${glColor(P.cTrans)}*tr*thin*1.05*sh*.52*vLeaf;
      col*=vAO*uAmbient;
      gl_FragColor=vec4(aerial(col,vWorld),1.0);
    }`
});
const referenceTreeDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
referenceTreeDepth.onBeforeCompile=shader=>{
  shader.uniforms.uTime=paintUniforms.uTime;
  shader.vertexShader=referenceTreeTransform+shader.vertexShader.replace('#include <project_vertex>',`
    vec4 mvPosition=viewMatrix*vec4(treeWorld(transformed),1.0);
    gl_Position=projectionMatrix*mvPosition;`);
};
referenceTreeDepth.customProgramCacheKey=()=> 'referenceTreeDepth-v1';
const treeSpots = [
  [-43,5,1.1],[-38,12,.9],[-32,23,1.2],[-22,30,.9],[-7,39,1.15],[10,41,.9],
  [28,32,1.2],[38,24,.85],[45,8,1.1],[42,-17,.95],[28,-31,1.1],[13,-40,.9],
  [-6,-39,1],[-25,-33,.95],[-39,-19,1.15],[-48,-14,.8],[17,18,.75],[-20,15,.72],
  [29,5,.78],[-23,-9,.8],[5,29,.7]
];

const treeRandom=mulberry32(7219);
for(let variant=0;variant<4;variant++){
  const geometry=referenceTreeGeometry(variant===3?'pine':'broadleaf',471+variant*137);
  geometry.computeBoundingBox();
  const height=geometry.boundingBox.max.y;
  const placements=treeSpots.filter((_,i)=>i%4===variant);
  const batch=new THREE.InstancedMesh(geometry,referenceTreeMaterial,placements.length);
  const sway=new Float32Array(placements.length*4),phase=new Float32Array(placements.length);
  placements.forEach(([x,z,size],i)=>{
    const scale=6.6*size/height, ground=renderedGroundHeight(x,z);
    dummy.position.set(x,ground,z);dummy.rotation.set(0,treeRandom()*Math.PI*2,0);
    dummy.scale.setScalar(scale);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);
    sway.set([x,ground,z,6.6*size],i*4);phase[i]=treeRandom()*Math.PI*2;
  });
  geometry.setAttribute('iSway',new THREE.InstancedBufferAttribute(sway,4));
  geometry.setAttribute('iPhase',new THREE.InstancedBufferAttribute(phase,1));
  batch.castShadow=true;batch.receiveShadow=true;batch.customDepthMaterial=referenceTreeDepth;
  batch.computeBoundingSphere();batch.boundingSphere.radius+=1.2;
  scene.add(batch);
}

// Preserve the shared layout seed after replacing the old tree generator (50
// random draws per tree). Rocks, flowers and grass keep their existing positions.
for(let i=0;i<treeSpots.length*50;i++)rand();

// Soft-edged rocks around the beach and paths.
const rockColliders=[];
// Static prop footprints share the existing substepped sliding solver.
for(const [x,z] of lanternSites)rockColliders.push({x,z,radius:.27});
for (let i = 0; i < 34; i++) {
  const a = rand() * Math.PI * 2;
  const ring = i < 22 ? lerp(.78, .94, rand()) : lerp(.25, .68, rand());
  let x = Math.cos(a) * 66 * ring;
  let z = Math.sin(a) * 53 * ring;
  const fromCake=Math.hypot(x+8,z+10);
  if(fromCake<6.5){const k=7.2/Math.max(fromCake,.001);x=-8+(x+8)*k;z=-10+(z+10)*k;}
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.45 + rand() * .75, 1), mats.stone);
  rock.scale.set(1 + rand(), .45 + rand() * .42, .7 + rand() * .7);
  rock.rotation.set(rand() * .5, rand() * 6, rand() * .3);
  rock.castShadow = true;
  putOnGround(rock, x, z, .05);
  rock.updateMatrixWorld(true);
  const vertex=new THREE.Vector3(),positions=rock.geometry.attributes.position;
  let radius=0;
  for(let j=0;j<positions.count;j++){
    vertex.fromBufferAttribute(positions,j).applyMatrix4(rock.matrixWorld);
    radius=Math.max(radius,Math.hypot(vertex.x-x,vertex.z-z));
  }
  rockColliders.push({x,z,radius});
}

// Occasional single pebbles or pairs sit on alternating path shoulders.
// A private seed keeps this small detail independent of the island layout.
const edgePebbleRandom=mulberry32(41731),edgePebbleSites=[];
for(let stop=0,z=-3.5;z<32;stop++,z+=3.0+edgePebbleRandom()*.8){
  const side=stop%2?1:-1,count=stop%3===0?2:1;
  for(let i=0;i<count;i++){
    const pz=z+i*(.16+edgePebbleRandom()*.18);
    const px=celebrationPathX(pz)+side*(celebrationPathWidth(pz,side)-.17+edgePebbleRandom()*.16);
    edgePebbleSites.push([px,pz,.035+edgePebbleRandom()*.03]);
  }
}
const edgePebbles=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),
  new THREE.MeshStandardMaterial({color:0xc5b398,roughness:1}),edgePebbleSites.length);
edgePebbleSites.forEach(([x,z,size],i)=>{
  dummy.position.set(x,terrainHeight(x,z)+.012,z);
  dummy.scale.set(size*(.9+edgePebbleRandom()*.4),size*.26,size);
  dummy.rotation.set(0,edgePebbleRandom()*Math.PI*2,0);dummy.updateMatrix();
  edgePebbles.setMatrixAt(i,dummy.matrix);
});
edgePebbles.receiveShadow=true;scene.add(edgePebbles);

// Adapted directly from the source valley: tapered, multi-segment blades rather
// than stock plane rectangles, with a vertical hue path and traveling wind.
function buildBladeGeometry(segments=4){
  const vertexCount=segments*2+1;
  const positions=new Float32Array(vertexCount*3);
  let k=0;
  for(let i=0;i<segments;i++){
    const v=i/segments;
    positions[k++]=0;positions[k++]=v;positions[k++]=0;
    positions[k++]=1;positions[k++]=v;positions[k++]=0;
  }
  positions[k++]=.5;positions[k++]=1;positions[k++]=0;
  const indices=[];
  for(let i=0;i<segments-1;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  const a=(segments-1)*2;indices.push(a,segments*2,a+1);
  const geometry=new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),120);
  return geometry;
}

// Stratified, shuffled 8 m tiles: short broad leaves retain coverage with fewer
// instances, and off-screen tiles are culled by Three instead of drawn globally.
const bladeVertexShader = `
    ${meadowWindGLSL}
    uniform float uTime, uNearFade; uniform vec3 uCam;
    attribute vec3 iOffset; attribute float iScale, iPhase, iTint;
    varying float vT,vTint,vSide,vBend,vOccl; varying vec3 vWorld,vN;
    void main(){
      float t=position.y;
      float u=position.x-0.5;
      vec3 root=(modelMatrix*vec4(iOffset,1.0)).xyz;
      float dist=distance(root.xz,uCam.xz);
      // The near layer shrinks to nothing before its ring ends, so the extra
      // density fades in rather than arriving as a visible wall of grass.
      // Each near blade retires at its own distance, so the extra density
      // dissolves over 9-27 m instead of ending on a common edge you can see.
      float fadeIn=9.0+iTint*7.0;
      float fade=mix(1.0,1.0-smoothstep(fadeIn,fadeIn+11.0,dist),uNearFade);
      float hgt=iScale*fade;
      if(hgt<1e-4){gl_Position=vec4(2.0,2.0,2.0,1.0);return;}

      vec3 up=vec3(0.0,1.0,0.0);
      vec2 wdir=normalize(vec2(.82,.42));
      // Blades comb downwind — a random lean carried most of the way toward the
      // prevailing direction — so the meadow flows instead of bristling.
      vec2 lean=normalize(mix(vec2(cos(iPhase),sin(iPhase)),wdir,.46));
      vec3 front=vec3(lean.x,0.0,lean.y);
      vec3 side=normalize(cross(up,front));
      vec3 toCam=normalize(vec3(uCam.x-root.x,0.0,uCam.z-root.z)+vec3(1e-5));
      vec3 facing=normalize(cross(up,toCam));
      // Flip into the same hemisphere first: mixing a vector with its exact
      // opposite cancels to zero, and normalizing that returns NaN — which
      // renders as a scatter of black specks through the sward.
      if(dot(side,facing)<0.0) facing=-facing;
      side=normalize(mix(side,facing,smoothstep(9.0,38.0,dist)*.85));

      float gust=meadowWind(root.xz,uTime);

      // Reference blade model: the tip already arches at rest, gravity and wind
      // lay it further over, and the curve is then rescaled back to its own
      // length. A longer blade therefore reaches outward, not upward — which is
      // what keeps a dense sward from becoming a picket fence across the view.
      vec3 p0=root;
      vec3 v2=p0+up*hgt*.97+front*hgt*(.38+iTint*.28);
      float stiff=.55+iTint*.50;
      vec3 push=vec3(wdir.x,0.0,wdir.y)*hgt*(.14+.68*gust)
               +vec3(0.0,-1.0,0.0)*hgt*(.40+.20*iTint);
      v2+=push/stiff*.5;
      v2+=side*sin(uTime*4.2*(.7+iTint)+iPhase*3.0)*hgt*.045*(.4+.6*abs(gust));

      // Inextensible blade: lift the tip back above ground, derive the mid
      // control point, then rescale the whole curve to the blade's true length.
      v2-=up*min(dot(up,v2-p0),0.0);
      vec3 d20=v2-p0;
      float lproj=length(d20-up*dot(d20,up));
      vec3 v1=p0+hgt*up*max(1.0-lproj/hgt,.05*max(lproj/hgt,1.0));
      float L0=length(v2-p0);
      float L1=length(v1-p0)+length(v2-v1);
      float rr=hgt/max((2.0*L0+L1)/3.0,1e-4);
      v1=p0+rr*(v1-p0);
      v2=v1+rr*(v2-v1);

      vec3 a=mix(p0,v1,t),b=mix(v1,v2,t),c=mix(a,b,t);
      vec3 tang=normalize(b-a+vec3(0.0,1e-5,0.0));
      float wid=max(.012+iTint*.012,dist*.0014)*fade*(1.0+uNearFade*.55);
      float wprof=sqrt(max(1.0-t,0.0))*(.60+.42*smoothstep(0.0,.16,t));
      vec3 sideW=normalize(side-tang*dot(side,tang)+vec3(1e-6));
      vec3 pos=c+sideW*(u*wid*wprof*2.0);
      // A rolled cross-section rather than a flat chip: this is most of what
      // makes a blade read as a leaf instead of a coloured triangle.
      vec3 faceN=normalize(cross(sideW,tang));
      vec3 rolled=normalize(faceN+sideW*(u*2.0)*.42);
      // Flatten toward vertical with distance so far blades stop sparkling.
      // Pick the pole on the blade's own side, or the mix can cancel to zero.
      vec3 pole=dot(rolled,up)<0.0?-up:up;
      vN=normalize(mix(rolled,pole,smoothstep(14.0,55.0,dist)*.55));

      vT=t;vTint=iTint;vSide=u*2.0;vWorld=pos;
      vBend=clamp(1.0-dot(normalize(v2-p0),up),0.0,1.0);
      // A blade shorter than its neighbours sits in their shade; this is what
      // gives the sward interior depth instead of one flat wall of green.
      vOccl=smoothstep(.18,1.0,hgt/.62);
      gl_Position=projectionMatrix*viewMatrix*vec4(pos,1.0);
    }`;
const bladeFragmentShader = `${paintGLSL}
    uniform vec3 uCam;
    varying float vT,vTint,vSide,vBend,vOccl; varying vec3 vWorld,vN;
    void main(){
      vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;
      vec3 view=normalize(uCam-vWorld);
      // MSAA can shade just outside a thin triangle: its interpolated blade
      // coordinate must stay in range before fractional powers (negative => NaN).
      float t=clamp(vT,0.0,1.0);
      float softness=meadowSoftness(vWorld);
      float detail=1.0-softness;
      float sunlight=smoothstep(.22,.84,uAmbient);
      // The reference's vertical hue path: teal at the root, yellow-green at the tip.
      vec3 lit=mix(${glColor(P.gLow)},${glColor(P.gMid)},smoothstep(.0,.26,t));
      lit=mix(lit,${glColor(P.gUpper)},smoothstep(.20,.66,t));
      lit=mix(lit,${glColor(P.gTip)},smoothstep(.72,1.0,t)*.85);
      vec3 mid=mix(${glColor(P.gBase)},${glColor(P.gMid)},smoothstep(.05,.80,t));
      vec3 shade=mix(${glColor(P.gBase)}*.82,${glColor(P.gLow)},smoothstep(.15,.95,t));
      // Meadow mosaic: no two patches, and no two blades, are the same green.
      lit=mix(lit,${glColor(P.gPatchC)},smoothstep(.35,.85,vTint)*.45);
      lit=mix(lit,${glColor(P.gPatchA)},(1.0-smoothstep(.15,.65,vTint))*.35);
      mid=mix(mid,${glColor(P.gPatchB)},smoothstep(.30,.80,vTint)*.40);
      shade=mix(shade,${glColor(P.tHollow)},smoothstep(.40,.90,vTint)*.35);
      float dry=smoothstep(.72,.99,vTint)*smoothstep(.45,.98,t);
      lit=mix(lit,${glColor(P.gDry)},dry*.55);
      float jitter=.93+.15*vTint;
      lit*=jitter;mid*=jitter*.98;shade*=.92+.20*vTint;

      float broadShadow=islandShadow(vWorld)*cloudShade(vWorld);
      float sh=broadShadow;
      float selfShade=mix(.62,1.0,pow(t,.75));
      sh*=selfShade*mix(.52,1.0,vOccl);
      float light=smoothstep(-.35,.80,dot(n,uSunDir))*sh;
      vec3 c=mix(shade,mid,smoothstep(-.24,.58,light));
      c=mix(c,lit,smoothstep(.22,1.05,light));
      c=mix(c,${glColor(P.gSheen)},smoothstep(.75,1.0,light)*smoothstep(.35,1.0,t)*.06*detail*sunlight);
      c*=mix(.58,1.0,pow(t,.55));            // the sward floor is genuinely dark
      float back=pow(max(dot(view,-uSunDir),0.0),2.4);
      c+=${glColor(P.gTrans)}*back*smoothstep(.10,.72,t)*.22*(.35+.65*sh)*detail*sunlight;
      c=mix(c,mid*1.06,(1.0-light)*.22);
      // A blade laid over by a gust turns its face up and catches the light:
      // this is what makes a gust legible as a pale band crossing the meadow.
      float geom=pow(clamp(1.0-abs(dot(n,view)),0.0,1.0),1.9)*.45
                +pow(clamp(dot(n,normalize(uSunDir+view)),0.0,1.0),3.2)*.55;
      float flash=smoothstep(.34,.86,vBend)*smoothstep(.14,.78,t);
      c=mix(c,${glColor(P.gSheen)},geom*flash*.09*(.30+.70*sh)*detail*sunlight);
      c*=mix(vec3(.60,.78,.86),uLightColor,.52)*uAmbient*1.30;
      // Retire per-blade contrast smoothly, earlier and more fully at night.
      c=mix(c,meadowWash(vWorld,broadShadow),softness);
      c*=1.0+meadowWind(vWorld.xz,uTime)*mix(.04,.10,sunlight)*(1.0-softness);
      c*=meadowPigment(vWorld);
      // An opaque draw still carries a softness mask in the HDR target alpha.
      gl_FragColor=vec4(aerial(c,vWorld),1.0-.5*softness);
    }`;
function makeBladeMaterial(nearFade){
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...paintUniforms, uCam: { value: new THREE.Vector3() }, uNearFade: { value: nearFade } },
    vertexShader: bladeVertexShader,
    fragmentShader: bladeFragmentShader
  });
}
const bladeMat = makeBladeMaterial(0);
const nearBladeMat = makeBladeMaterial(1);
const bladeMaterials = [bladeMat, nearBladeMat];

const grass = new THREE.Group(); scene.add(grass);
let grassBladeCount = 0;
const nearGrassTiles = [];
const grassRand = mulberry32(20260912);
function buildGrassLayer(perAxis, scaleBase, scaleVary, material, near){
  for(let cz=-48;cz<48;cz+=8) for(let cx=-64;cx<64;cx+=8){
    const blades=[];
    for(let iz=0;iz<perAxis;iz++) for(let ix=0;ix<perAxis;ix++){
      const x=cx+(ix+grassRand())*8/perAxis,z=cz+(iz+grassRand())*8/perAxis;
      const y=terrainHeight(x,z),r=Math.hypot(x/67,z/54);
      if(y<.4||r>.83||grassRand()>meadowMask(x,z))continue;
      if(STARGAZING_SPOTS.some(spot=>Math.abs(x-spot.x)<1.94&&Math.abs(z-spot.z)<1.94))continue;
      // Tussocks: height clusters at metre and decametre scales, so the sward
      // has taller and balder patches instead of one uniform pile.
      const tussock=.68+.42*(Math.sin(x*.21+Math.cos(z*.17))*.5+.5)
                       +.26*(Math.sin(z*.09-x*.06)*.5+.5);
      blades.push([x-cx-4,y-.025,z-cz-4,(scaleBase+grassRand()*scaleVary)*tussock,grassRand()*Math.PI*2,grassRand()]);
    }
    if(!blades.length)continue;
    for(let i=blades.length-1;i>0;i--){const j=Math.floor(grassRand()*(i+1));[blades[i],blades[j]]=[blades[j],blades[i]];}
    const geometry=buildBladeGeometry(3);
    geometry.setAttribute('iOffset',new THREE.InstancedBufferAttribute(new Float32Array(blades.flatMap(b=>b.slice(0,3))),3));
    for(const [name,index] of [['iScale',3],['iPhase',4],['iTint',5]])geometry.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(blades.map(b=>b[index])),1));
    geometry.instanceCount=blades.length;
    geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,2,0),7.5);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(cx+4,0,cz+4);
    grass.add(mesh);grassBladeCount+=blades.length;
    if(near)nearGrassTiles.push(mesh);
  }
}
// 23x23 jittered cells per tile: ~8 blades/m², each with a readable silhouette.
// Lengths are the blade's arc, not its height — an arching blade stands roughly
// six tenths as tall as it is long, so these reach much further than they rise.
buildGrassLayer(28,.28,.28,bladeMat,false);
// A second, thicker mat of shorter blades fills the ground underfoot. Only the
// tiles near the player are drawn, so the island keeps its cheap far-field
// density while the grass you actually stand in is roughly three times as dense.
buildGrassLayer(56,.15,.21,nearBladeMat,true);
const NEAR_GRASS_RANGE = 31;
function updateNearGrass(){
  for(const tile of nearGrassTiles){
    const dx=tile.position.x-playerRig.position.x, dz=tile.position.z-playerRig.position.z;
    tile.visible = dx*dx+dz*dz < NEAR_GRASS_RANGE*NEAR_GRASS_RANGE;
  }
}

const meadowLife=buildMeadowLife({scene,terrainHeight,meadowMask,
  random:mulberry32(812731),timeUniform:paintUniforms.uTime});
const {flowerSpots}=meadowLife;
// Bake once: each flower softly colors its immediate surroundings, while
// overlapping flowers naturally make a broader patch. Empty meadow stays green.
flowerTintContext.globalCompositeOperation='lighter';
flowerSpots.forEach(([x,y,z],i)=>{
  const px=(x+70)/140*512,pz=(z+70)/140*512,r=(1.7+(i%4)*.15)/140*512;
  const color=i%3===0?'0,255,0':'255,0,0';
  const gradient=flowerTintContext.createRadialGradient(px,pz,0,px,pz,r);
  gradient.addColorStop(0,`rgba(${color},.8)`);gradient.addColorStop(.35,`rgba(${color},.55)`);gradient.addColorStop(1,`rgba(${color},0)`);
  flowerTintContext.fillStyle=gradient;flowerTintContext.fillRect(px-r,pz-r,r*2,r*2);
});
flowerTintTexture.needsUpdate=true;

/* -------------------------------------------------------------------------- */
/* Ocean-view bench and party garden                                          */
/* -------------------------------------------------------------------------- */

const interactive = [];
const stoneSkipping=buildStoneSkipping({scene,terrainHeight,interactive,toast,camera,getCompanion:()=>companion,canAutoplay:()=>!multiplayerRequested||!!network?.autopilot,onThrow:event=>{if(network&&!applyingNetwork)network.event(event);},onWin:complete=>audio.chime(complete?[523.25,659.25,783.99,1046.5]:[659.25,783.99])});
const dandelions=buildDandelions({scene,terrainHeight,meadowMask,random:mulberry32(41551),interactive,
  onRelease:()=>toast('A LITTLE WISH, ON ITS WAY')});
let partyLightMaterial = null;
const partyHaloMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffd496,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});

// A slatted bench at human scale: seat at .55, back cresting near 1.45, so a
// walker reads as a person standing beside furniture rather than a child.
function buildBench() {
  const g = new THREE.Group();
  const legs=[];
  // Warmer than the tree trunks so the bench reads as worked timber, not driftwood.
  const plank = new THREE.MeshStandardMaterial({ color: 0xb08a5e, roughness: .64 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x6b543d, roughness: .70 });

  // Side frames. The bench faces -z; the back posts live on the +z side.
  for (const sx of [-1.42, 1.42]) {
    for(const z of [-.46,.44]){
      const leg=box(.13,.58,.14,frame);leg.position.set(sx,.29,z);g.add(leg);legs.push(leg);
    }
    const rail = box(.11, .1, 1.06, frame); rail.position.set(sx, .5, 0); g.add(rail);
    const armPost = box(.1, .32, .11, frame); armPost.position.set(sx, .72, -.42); g.add(armPost);
    const arm = box(.15, .09, 1.1, plank); arm.position.set(sx, .92, -.02); g.add(arm);
    const armCap = cylinder(.075, .075, .15, 10, plank); armCap.rotation.z = Math.PI / 2;
    armCap.position.set(sx, .92, -.57); g.add(armCap);
  }

  // Seat slats, each with a sliver of daylight between them.
  for (let i = 0; i < 5; i++) {
    const slat = box(3.08, .07, .19, plank);
    slat.position.set(0, .585, -.5 + i * .25);
    g.add(slat);
  }

  // Backrest, leaned back as a whole so it looks sat-in rather than bolted on.
  const back = new THREE.Group();
  back.position.set(0, .52, .44);
  back.rotation.x = .15;
  for (const sx of [-1.42, 1.42]) {
    const post = box(.13, .96, .13, frame); post.position.set(sx, .46, 0); back.add(post);
  }
  for (const [y, h] of [[.3, .17], [.56, .17], [.83, .2]]) {
    const slat = box(3.04, h, .07, plank); slat.position.set(0, y, 0); back.add(slat);
  }
  g.add(back);

  // A jar of flowers set on the grass beside the bench.
  const jarPartsStart=g.children.length;
  const jar = cylinder(.13, .16, .3, 12, new THREE.MeshStandardMaterial({ color: 0x7ba2a0, roughness: .55 }));
  jar.position.set(1.95, .15, -.3); g.add(jar);
  for (let i = 0; i < 9; i++) {
    const lean = rand() * .5, turn = rand() * Math.PI * 2;
    const stem = cylinder(.009, .013, .26, 5, mats.leaf);
    stem.position.set(1.95 + Math.cos(turn) * lean * .18, .38, -.3 + Math.sin(turn) * lean * .18);
    stem.rotation.set(Math.sin(turn) * lean, 0, -Math.cos(turn) * lean); g.add(stem);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), i % 3 ? mats.pink : mats.gold);
    flower.scale.y = .8;
    flower.position.set(1.95 + Math.cos(turn) * lean * .34, .5 + rand() * .04, -.3 + Math.sin(turn) * lean * .34);
    g.add(flower);
  }

  g.rotation.y = Math.PI / 2;
  putOnGround(g, -43, -3);
  g.updateMatrixWorld(true);
  // Each foot meets the actual slope, while the seat stays level.
  for(const leg of legs){
    const foot=g.localToWorld(new THREE.Vector3(leg.position.x,0,leg.position.z));
    const bottom=terrainHeight(foot.x,foot.z)-g.position.y-.025;
    const height=.58-bottom;
    leg.scale.y=height/.58;leg.position.y=(.58+bottom)/2;
  }
  const jarFoot=g.localToWorld(new THREE.Vector3(1.95,0,-.3));
  const jarOffset=terrainHeight(jarFoot.x,jarFoot.z)-g.position.y;
  for(const part of g.children.slice(jarPartsStart))part.position.y+=jarOffset;
  if(CONFIG.sunset)interactive.push({
    type: 'bench', object: g, reach: 4.2,
    prompt: 'sit on our bench and watch the sunset',
    action: () => { setMood('sunset'); toast('THE HORIZON SAVED FOR THE TWO OF US'); audio.chime([523.25, 659.25, 783.99]); }
  });
}
buildBench();

const candleFlames = [];
let candleSmoke, candleBlownAt=-1, candleFrameCheck=null;
let candlesLit = true;
function buildParty() {
  const party = new THREE.Group();
  // Four poles and warm string lights.
  const poles = [[-6,-6],[6,-6],[6,6],[-6,6]];
  for (const [x,z] of poles) { const p = cylinder(.07,.09,4.1,7,mats.darkWood); p.position.set(x,2.05,z); party.add(p); }
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffe4a5, emissive: 0xffbd62, emissiveIntensity: 1.9 });
  partyLightMaterial = lightMat;
  const lineMat = new THREE.LineBasicMaterial({ color: 0x4a4038 });
  for (let side = 0; side < 4; side++) {
    const a = poles[side], b = poles[(side+1)%4];
    const pts = [];
    for (let j=0;j<=10;j++) {
      const t=j/10, x=lerp(a[0],b[0],t), z=lerp(a[1],b[1],t), y=4.02-Math.sin(t*Math.PI)*.52;
      pts.push(new THREE.Vector3(x,y,z));
      if(j>0 && j<10 && j%2===0){ const bulb=new THREE.Mesh(new THREE.SphereGeometry(.085,7,5),lightMat);bulb.position.set(x,y-.11,z);bulb.userData.partyLight=true;bulb.layers.set(1);party.add(bulb);const halo=new THREE.Sprite(partyHaloMaterial);halo.position.copy(bulb.position);halo.scale.set(.65,.65,1);halo.layers.set(1);party.add(halo); }
    }
    party.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }

  const furniture=new THREE.Group();furniture.position.y=STAGE_HEIGHT;party.add(furniture);
  // Cake table, kept low so the cake sits below eye level and you look down on
  // it the way you would lean over a real one.
  const table = cylinder(1.30, 1.30, .1, 64, cakeTableMaterials(mats.cream)); table.position.y=.62; furniture.add(table);
  const pedestal = cylinder(.25,.42,.56,24,mats.wood); pedestal.position.y=.28; furniture.add(pedestal);
  const {hats,board}=addBirthdayCentrepiece(furniture,party);
  const hatInteractions=hats.map(hat=>({type:'hat',object:hat,reach:2.5,
    prompt:'put on our party hats',found:false,action:()=>{
      if(network&&!applyingNetwork){network.event({type:"hats"});return;}
      if(hatInteractions[0].found)return;
      hatInteractions.forEach(item=>item.found=true);
      companion.wearHat(hats[isIshiee?0:1]);avatar.wearHat(hats[isIshiee?1:0]);
      toast('PARTY HATS ON · BOTH OF US');
    }}));
  interactive.push(...hatInteractions);
  // Rounded belly, tapered curved tip, and a warm luminous core.
  const flameProfile=[];
  for(let i=0;i<=28;i++){
    const t=i/28;
    const radius=.038*Math.pow(Math.sin(Math.PI*t),.72)*Math.pow(1-t,.85);
    flameProfile.push(new THREE.Vector2(radius,t*.105-.05));
  }
  const flameGeo=new THREE.LatheGeometry(flameProfile,24);
  const makeFlameMaterial=phase=>new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{time:{value:0},phase:{value:phase}},
    vertexShader:`uniform float time;uniform float phase;varying float height;varying vec3 facing;
      void main(){vec3 p=position;float h=clamp((p.y+.05)/.105,0.,1.);height=h;
        float sway=sin(time*3.6+phase)*.006+sin(time*6.1+phase*2.)*.0025;
        p.x+=(.006+sway)*h*h;p.z+=sin(time*4.3+phase)*.004*h*h;
        p.y=-.05+(p.y+.05)*(1.+.065*sin(time*5.2+phase)+.025*sin(time*8.7+phase));
        facing=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying float height;varying vec3 facing;
      void main(){float core=pow(abs(normalize(facing).z),2.);
        vec3 amber=vec3(1.,.43,.075),cream=vec3(1.,.94,.66);
        vec3 color=mix(amber,cream,core*(1.-smoothstep(.55,1.,height)));
        float alpha=mix(.42,1.,smoothstep(0.,.5,abs(normalize(facing).z)));
        gl_FragColor=vec4(color,alpha);}`
  });
  for(let i=0;i<5;i++){
    const a=i/5*Math.PI*2;
    const candle=cylinder(.022,.026,.24,7,i%2?mats.pink:mats.gold);candle.position.set(Math.cos(a)*.25,1.49,Math.sin(a)*.25);furniture.add(candle);
    const phase=rand()*6;
    const flame=new THREE.Mesh(flameGeo,makeFlameMaterial(phase));flame.position.set(Math.cos(a)*.25,1.66,Math.sin(a)*.25);furniture.add(flame);
    const light=new THREE.PointLight(0xffaa54,.32,3);light.position.copy(flame.position);furniture.add(light);
    candleFlames.push({flame,light,phase});
  }
  candleSmoke=buildCandleSmoke(furniture,candleFlames.map(c=>c.flame.position));
  putOnGround(party, -8, -10);
  party.updateMatrixWorld(true);
  for(const [x,z] of poles){
    const p=party.localToWorld(new THREE.Vector3(x,0,z));
    rockColliders.push({x:p.x,z:p.z,radius:.09});
  }
  // The round cake table. Just inside its 1.30 m top, so his 1.6 m celebration
  // circle around the cake stays clear with his .32 m body radius.
  const tableCentre=party.localToWorld(new THREE.Vector3(0,0,0));
  rockColliders.push({x:tableCentre.x,z:tableCentre.z,radius:1.28});
  for(const part of board.children){
    const shape=part.geometry?.parameters;
    if(!shape?.depth)continue; // The printed face shares the wooden board's box.
    const p=part.getWorldPosition(new THREE.Vector3());
    rockColliders.push({x:p.x,z:p.z,halfWidth:shape.width/2,halfDepth:shape.depth/2,angle:board.rotation.y});
  }
  interactive.push({
    type:'cake', object:party, reach:4.8,
    get prompt(){ return candlesLit ? 'make a wish and blow out the candles' : 'the wish is on its way'; },
    action: blowCandles
  });
}
buildParty();
// Props touching the soil must use the rendered triangles, not the continuous height function.
function renderedGroundHeight(x,z){
  const {width,height,widthSegments:cols,heightSegments:rows}=terrainGeo.parameters;
  const gx=THREE.MathUtils.clamp((x+width/2)/width*cols,0,cols-.000001);
  const gz=THREE.MathUtils.clamp((z+height/2)/height*rows,0,rows-.000001);
  const ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,stride=cols+1;
  const a=terrainPos.getY(iz*stride+ix),b=terrainPos.getY((iz+1)*stride+ix);
  const c=terrainPos.getY((iz+1)*stride+ix+1),d=terrainPos.getY(iz*stride+ix+1);
  return u+v<=1?a*(1-u-v)+b*v+d*u:b*(1-u)+c*(u+v-1)+d*(1-v);
}
const fireside=buildFireside({scene,terrainHeight:renderedGroundHeight,x:22,z:-20,musicUrl:CONFIG.radioMusicUrl});
paintUniforms.uStumpBase.value.copy(fireside.stumpBase);
// The campfire radio plays a shared YouTube playlist. Online, the server keeps
// only the song number: whoever's song ends first asks for the next one, and
// both players crossfade to it wherever they are in their own copy.
const radioSpot=new THREE.Vector3(),radioEar=new THREE.Vector3();
fireside.root.updateMatrixWorld(true);fireside.radio.getWorldPosition(radioSpot);
let radioWarned=false;
function requestSong(from,to){if(network?.connected)network.event({type:'radio',from,to});else radio.play(to);}
const radio=createRadio({
  requestNext:requestSong,
  onProblem:problem=>{if(radioWarned)return;radioWarned=true;toast(problem==='local-origin'?'OPEN LOCALHOST:4173 TO HEAR THE RADIO':'THE RADIO CANNOT REACH YOUTUBE RIGHT NOW');}
});
radio.play(0);
function updateRadio(dt){
  camera.getWorldPosition(radioEar);
  // After the birthday celebration, the same radio song is barely audible
  // island-wide (2/100 volume), while keeping its familiar fireside loudness.
  const near=audio.muted?0:1-smoothstep(5,17,radioEar.distanceTo(radioSpot));
  const background=!audio.muted&&CONFIG.musicVolume>0&&audio.musicMode==='radio'
    ?.025*smoothstep(7,13,elapsed-audio.musicChangedAt):0;
  radio.update(dt,near,background);audio.scape?.duck(near);
}
interactive.push({type:'radio',object:fireside.radio,reach:2.5,prompt:'play the next song',action:()=>{
  if(fireside.audio){if(fireside.audio.paused)fireside.audio.play().catch(()=>toast('THE RADIO TRACK COULD NOT BE LOADED'));else fireside.audio.pause();return;}
  const from=radio.index??0;requestSong(from,(from+1)%radio.count);
  toast('NEXT SONG ON THE RADIO');
}});
const celebration=buildCelebration({scene,terrainHeight,lampSites:lanternSites,glowTexture});
const stageConfetti=buildStageConfetti(scene,terrainHeight(-8,-10)+STAGE_HEIGHT,STAGE_RADIUS);

function updatePartyLight() {
  const intensity = lerp(.25, 2.2, 1 - moodLive.ambient);
  if (partyLightMaterial) partyLightMaterial.emissiveIntensity = intensity;
  partyHaloMaterial.opacity=.035+paintUniforms.uPartyGlow.value*.19;
}

function blowCandles({confetti=true}={}) {
  if(network&&!applyingNetwork){network.event({type:"candles"});return;}
  if (!candlesLit) { toast('YOUR WISH IS ALREADY ON ITS WAY'); return; }
  candlesLit = false;
  candleBlownAt=elapsed;
  // The celebration volley that follows a fresh wish ends with the sky message.
  if(confetti)finalePendingUntil=elapsed+8;
  // Wrapped gifts are reserved for the later personal gift exchange.
  if(confetti)stageConfetti.burst(elapsed);
  companion.celebrate();
  if(inspect)candleFrameCheck={start:performance.now(),maxFrame:0,programs:renderer.info.programs.length};
  // Keep all five lights in Three's light list. Removing them changes the
  // shader light-count defines and recompiles standard materials on interaction.
  candleFlames.forEach(({flame}) => { flame.visible=false; });
  audio.softBlow();
  audio.setMusic('radio');
  toast('WISH MADE  ·  MAY IT FIND US SOON');
  if(!applyingNetwork)setTimeout(() => launchFireworks(7), 650);
}

/* -------------------------------------------------------------------------- */
/* Gifts                                                                      */
/* -------------------------------------------------------------------------- */

const gifts = [];
const giftFinish = buildGiftFinish(renderer);
let foundCount = 0, collectedAmount=0;
const cashRewards=buildCashRewards({onTick:(step,steps)=>{if(step<steps)audio.cashTick(step/steps);}});
let rewardBusy=false;
function makeGift(data, index) {
  const g = new THREE.Group();
  const baseMat = giftFinish(data.color);
  // Subtle foil motifs on the wrapping paper; ribbons are separate solid geometry.
  baseMat.onBeforeCompile = shader => {
    shader.uniforms.uGiftLightDirection=paintUniforms.uSunDir;
    shader.uniforms.uGiftLightColor=paintUniforms.uLightColor;
    shader.vertexShader = 'varying vec3 vGiftPosition; varying vec3 vGiftNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvGiftPosition = position; vGiftNormal = normal;');
    shader.fragmentShader = 'uniform vec3 uGiftLightDirection,uGiftLightColor; varying vec3 vGiftPosition; varying vec3 vGiftNormal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec3 face = abs(vGiftNormal);
      vec2 paperUv=face.y>.5?vGiftPosition.xz:(face.z>.5?vGiftPosition.xy:vGiftPosition.zy);
      vec2 motif=abs(fract(paperUv*7.0+.5)-.5);
      float foil=1.0-smoothstep(.055,.085,motif.x+motif.y);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.72+vec3(.32,.25,.13),foil*.48);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      // Art-directed reflected light, tied to the same direction as the island lighting.
      vec3 giftLight=normalize((viewMatrix*vec4(uGiftLightDirection,0.0)).xyz);
      vec3 giftView=normalize(vViewPosition);
      vec3 giftHalf=normalize(giftLight+giftView);
      float giftFacing=smoothstep(.05,.8,max(0.0,dot(normal,giftLight)));
      float giftSheen=pow(max(0.0,dot(normal,giftHalf)),24.0)*giftFacing;
      vec3 giftHighlight=mix(diffuseColor.rgb,vec3(1.0,.94,.80),.62);
      outgoingLight+=(diffuseColor.rgb*.32*giftFacing+giftHighlight*giftSheen*.85)*mix(vec3(1.0),uGiftLightColor,.35);
      #include <opaque_fragment>
    `);
  };
  baseMat.customProgramCacheKey = () => 'gift-directional-shine-v4';
  const base = giftBox(1.15, .98, 1.02, baseMat); base.position.y=.53; g.add(base);
  const lid = giftBox(1.27,.25,1.13,baseMat,.075);lid.position.y=1.075;g.add(lid);
  const glow=new THREE.PointLight(data.color,1,7,2);glow.position.y=2.6;g.add(glow);
  const haloMat=new THREE.SpriteMaterial({map:glowTexture,color:data.color,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending});
  const halo=new THREE.Sprite(haloMat);halo.position.y=.7;halo.scale.set(3.5,3.5,1);g.add(halo);
  addGiftDetails(g,index,data.tier);
  const [x,z] = data.pos;
  // Present-sized rather than crate-sized, but still standing clear of the tallest
  // grass so finding them never turns into a search.
  g.scale.setScalar(data.scale);
  putOnGround(g,x,z,.05);
  g.rotation.y=rand()*Math.PI;
  // Keep the scene's light count stable when a collected gift is hidden.
  g.updateWorldMatrix(true,true);scene.attach(glow);
  g.visible=false;glow.intensity=0;
  const gift = { type:'gift', object:g,glow,haloMat,baseMat, data, index, found:false, baseY:g.position.y, phase:rand()*6, reach:CONFIG.giftReach,available:()=>false,
    prompt:`unwrap ${rupees(data.amount)} · ${data.title}`, action:()=>collectGift(gift) };
  gifts.push(gift); interactive.push(gift);
}
CONFIG.gifts.forEach(makeGift);

function collectGift(gift,{animate=!applyingNetwork,showNote=!applyingNetwork}={}) {
  if(!gift.object.visible)return;
  if(network&&!applyingNetwork){network.event({type:"gift",index:gift.index});return;}
  if (gift.found) return;
  gift.found = true;
  foundCount++;
  collectedAmount+=gift.data.amount;
  const origin=gift.object.getWorldPosition(new THREE.Vector3());origin.y+=.8*gift.data.scale;origin.project(camera);
  gift.object.visible = false;
  gift.glow.intensity=0;
  paintUniforms.uGiftLights.value[gift.index].w=0;
  if(!animate){cashRewards.restore(collectedAmount,foundCount);return;}
  audio.gift(foundCount);
  rewardBusy=true;Object.keys(keys).forEach(k=>keys[k]=false);
  const visible=origin.z>=-1&&origin.z<=1;
  cashRewards.collect({amount:gift.data.amount,total:collectedAmount,packages:foundCount,
    x:visible?(origin.x*.5+.5)*innerWidth:innerWidth*.5,y:visible?(-origin.y*.5+.5)*innerHeight:innerHeight*.55
  }).then(()=>{rewardBusy=false;if(showNote)openGiftNote(gift);});
}

function openGiftNote(gift) {
  const modal=$('#gift-note');
  $('.note-number').textContent=`LITTLE GIFT ${String(gift.index+1).padStart(2,'0')} OF ${gifts.length}`;
  $('.note-icon').textContent=gift.data.icon;
  $('#reward-value').textContent=rupees(gift.data.amount);
  $('#reward-tier').textContent=MONEY_TIERS[gift.data.tier].label;
  $('.note-paper h2').textContent=gift.data.title;
  $('.note-paper p').textContent=gift.data.note;
  modal.classList.add('open');
  if(document.pointerLockElement) document.exitPointerLock();
}
function closeGiftNote() {
  $('#gift-note').classList.remove('open');
  if(foundCount===gifts.length) setTimeout(openFinale,420);
  else setTimeout(()=>requestPointerLock(),120);
}
$('.close-note').addEventListener('click',closeGiftNote);
$('.keep-walking').addEventListener('click',closeGiftNote);

function openFinale(){
  setMood('night');
  $('#finale').classList.add('open');
  launchFireworks(7);
}
$('#finale-close').addEventListener('click',()=>{ $('#finale').classList.remove('open'); setTimeout(()=>requestPointerLock(),120); });
$('#finale-fireworks').addEventListener('click',()=>{ $('#finale').classList.remove('open'); launchFireworks(12); setTimeout(()=>requestPointerLock(),120); });

/* -------------------------------------------------------------------------- */
/* Butterflies, clouds and fireflies                                           */
/* -------------------------------------------------------------------------- */

const butterflies=[];
const insectViewer=new THREE.Vector3();

// Shared cupped wings retain their original shape and pastel shading.
const wingGeo=makeWingGeometry();
const wingTextures=[0,1,2].map(makeWingTexture);
// A separate seed preserves existing flight paths and all other island details.
const wingPatternRandom=mulberry32(712031);
const bodyMat=new THREE.MeshBasicMaterial({color:0x4b3c34});
const BUTTERFLY_TINTS=[0xefa48e,0xe9c473,0x9dc3b4,0xb9a3d2,0x8fb4cc,0xe7cdb0];

for(let i=0;i<22;i++){
  const group=new THREE.Group();
  const textured=wingPatternRandom()<.45;
  const wingTexture=textured?wingTextures[Math.floor(wingPatternRandom()*wingTextures.length)]:null;
  const mat=new THREE.MeshBasicMaterial({
    color:BUTTERFLY_TINTS[i%BUTTERFLY_TINTS.length],map:wingTexture,vertexColors:true,side:THREE.DoubleSide,transparent:true,depthWrite:false
  });
  const left=new THREE.Mesh(wingGeo,mat),right=new THREE.Mesh(wingGeo,mat);
  right.scale.x=-1;                    // mirrored, so both hinge at the thorax
  left.position.y=right.position.y=.03;
  group.add(left,right);

  const insectBodyMat=bodyMat.clone();insectBodyMat.transparent=true;insectBodyMat.depthWrite=false;
  // Abdomen, thorax, head and clubbed antennae, all pointing along -z.
  const abdomen=cylinder(.016,.05,.32,6,insectBodyMat);abdomen.rotation.x=Math.PI/2;abdomen.position.z=.12;group.add(abdomen);
  const thorax=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),insectBodyMat);thorax.position.z=-.04;thorax.scale.z=1.5;group.add(thorax);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.042,8,6),insectBodyMat);head.position.z=-.15;group.add(head);
  for(const sx of [-1,1]){
    const antenna=cylinder(.005,.007,.22,4,insectBodyMat);
    antenna.position.set(sx*.03,.08,-.225);antenna.rotation.set(-.75,0,sx*.25);group.add(antenna);
    const club=new THREE.Mesh(new THREE.SphereGeometry(.017,6,5),insectBodyMat);
    club.position.set(sx*.05,.17,-.30);group.add(club);
  }
  group.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});

  const a=rand()*Math.PI*2,r=10+rand()*40,x=Math.cos(a)*r,z=Math.sin(a)*r;
  group.position.set(x,terrainHeight(x,z)+1.5,z);
  group.scale.setScalar(.16+rand()*.15);
  scene.add(group);
  butterflies.push({
    group,left,right,mat,bodyMat:insectBodyMat,rank:insectRank(i),base:new THREE.Vector3(x,0,z),
    phase:rand()*10,speed:.26+rand()*.3,radius:1.2+rand()*2.6,
    height:1.1+rand()*1.4,heading:0,bank:0
  });
}

const clouds=buildPaintedClouds(scene,paintUniforms,P);
// The clouds need the sun in view space to light their baked normals, so they
// warm and turn with the mood instead of carrying a fixed top-down gradient.
function updateClouds(){clouds.update(elapsed,camera,skyUniforms.uSunDir.value);}

// The retired 12-sprite cloud layout consumed four shared draws per sprite.
// Keep the downstream firefly layout stable; cloud noise has its own seed now.
for(let i=0;i<48;i++)rand();

// Restore the earlier spread: most fireflies loosely follow flowers, with
// the rest wandering independently across the open meadow.
const fireflyPos=[],fireflyBase=[];
for(let i=0;i<400;i++){
  let x,z,y;
  if(flowerSpots.length && rand()<.72){
    const f=flowerSpots[Math.floor(rand()*flowerSpots.length)];
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*1.5;
    x=f[0]+Math.cos(a)*r;z=f[2]+Math.sin(a)*r;
    y=f[1]+.06+rand()*.55;
  }else{
    const a=rand()*Math.PI*2,r=Math.sqrt(rand())*46;
    x=Math.cos(a)*r;z=Math.sin(a)*r;y=terrainHeight(x,z)+.6+rand()*2.4;
  }
  fireflyPos.push(x,y,z);fireflyBase.push(x,y,z,rand()*Math.PI*2);
}
const fireflyGeo=new THREE.BufferGeometry();fireflyGeo.setAttribute('position',new THREE.Float32BufferAttribute(fireflyPos,3));
// Per-point colour, driven each frame, is what lets them blink one at a time —
// a whole swarm pulsing together reads as a light, not as insects.
fireflyGeo.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(fireflyPos.length),3));
const fireflyMat=new THREE.PointsMaterial({size:.16,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,map:glowTexture,alphaTest:.01});
// Perspective attenuation alone left the surviving distant glows too broad.
// Keep close sprites intact and tighten their halos gradually beyond 8 metres.
fireflyMat.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;',
    'gl_PointSize = size * mix(1.0, 0.35, smoothstep(8.0, 36.0, length(mvPosition.xyz)));');
};
fireflyMat.customProgramCacheKey=()=> 'firefly-distance-size-1';
const poolCandidates=Array.from({length:400},(_,i)=>({i,d:0}));
const fireflies=new THREE.Points(fireflyGeo,fireflyMat);scene.add(fireflies);

/* -------------------------------------------------------------------------- */
/* Fireworks                                                                  */
/* -------------------------------------------------------------------------- */

const skyMessage=buildSkyMessage(scene,glowTexture,CONFIG.skyMessage);
const finaleEye=new THREE.Vector3();
let finalePendingUntil=-1;
function takeFinale(){const finale=elapsed<finalePendingUntil;finalePendingUntil=-1;return finale;}
const fireworks=buildFireworks(scene,glowTexture,(origin,variant)=>{audio.fireworkBurst(origin,variant);companion.watchFirework(origin);},(target,variant,life)=>audio.fireworkLaunch(target,variant,life),
  origin=>{camera.getWorldPosition(finaleEye);skyMessage.show(origin,finaleEye);lovePlane.flyPast(origin,finaleEye);});
function launchFireworks(amount=6){
  if(network&&!applyingNetwork){network.event({type:"fireworks",amount});return;}
  if(currentMood!=='night')setMood('night');
  toast('LOOK UP  ·  THE SKY IS YOURS');
  fireworks.launch(playerRig.position,playerRig.rotation.y,amount,{finale:takeFinale()});
}
function updateFireworks(dt){if(inspect&&inspectParams.has('fireworkStill'))return;fireworks.update(dt);skyMessage.update(dt,lovePlane.passing);}

/* -------------------------------------------------------------------------- */
/* Small synthesised soundscape                                               */
/* -------------------------------------------------------------------------- */

const soundEar=new THREE.Vector3(),soundLook=new THREE.Vector3(),soundSpot=new THREE.Vector3();
const audio={
  ctx:null,master:null,scape:null,muted:false,musicMode:'birthday',musicChangedAt:0,
  init(){
    if(this.ctx)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.5;
    // A gentle limiter keeps overlapping firework booms from clipping.
    const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=12;limiter.ratio.value=3.5;limiter.attack.value=.004;limiter.release.value=.3;
    this.master.connect(limiter).connect(this.ctx.destination);
    this.scape=createSoundscape(this.ctx,this.master,{musicLevel:CONFIG.musicVolume});
    if(CONFIG.musicVolume>0)this.scape.setMusic(this.musicMode,{delay:1.6,fade:4});
    const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),data=buffer.getChannelData(0);
    let last=0;for(let i=0;i<data.length;i++){last=last*.985+(Math.random()*2-1)*.015;data[i]=last;}
    const noise=this.ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=430;
    const gain=this.ctx.createGain();gain.gain.value=.11;noise.connect(filter).connect(gain).connect(this.master);noise.start();
    this.chime([261.63,329.63,392]);
  },
  resume(){this.ctx?.resume();},
  tone(freq,when=0,duration=1,volume=.06,type='sine'){
    if(!this.ctx||this.muted)return;
    const t=this.ctx.currentTime+when,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain).connect(this.master);osc.start(t);osc.stop(t+duration+.05);
  },
  chime(notes){notes.forEach((n,i)=>this.tone(n,i*.12,1.4,.045,'sine'));},
  // A soft, rising tick for each step of the counter (the landing ding covers the last).
  cashTick(progress){this.tone(1320+progress*520,0,.05,.009,'sine');},
  gift(n){if(this.muted||!this.ctx)return;if(this.scape)this.scape.collect(n);else this.chime([392+n*6,523.25+n*4,659.25+n*3]);},
  // The birthday tune fades out after the wish; updateRadio brings in the
  // real playlist softly once the first celebration sounds have settled.
  setMusic(mode){if(this.musicMode===mode)return;this.musicMode=mode;this.musicChangedAt=elapsed;if(CONFIG.musicVolume>0)this.scape?.setMusic(mode,{delay:7,fade:5});},
  place(position){
    camera.getWorldPosition(soundEar);camera.getWorldDirection(soundLook);
    const dx=position.x-soundEar.x,dz=position.z-soundEar.z,distance=Math.hypot(dx,position.y-soundEar.y,dz);
    const pan=(dx*-soundLook.z+dz*soundLook.x)/((Math.hypot(dx,dz)||1)*(Math.hypot(soundLook.x,soundLook.z)||1));
    return {distance,pan:clamp(pan*.75,-.75,.75),delay:distance/343};
  },
  fireworkLaunch(target,variant,life){
    if(!this.scape||this.muted)return;
    soundSpot.set(target.x,0,target.z);const {distance,pan,delay}=this.place(soundSpot);
    this.scape.launch({delay,pan,distance,life,whistle:variant%5===3});
  },
  fireworkBurst(origin,variant){
    if(!this.scape||this.muted)return;
    const {distance,pan,delay}=this.place(origin);this.scape.burst({delay,pan,distance,variant});
  },
  softBlow(){this.chime([659.25,587.33,523.25,392]);},
  toggle(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.5,this.ctx.currentTime,.08);$('#sound-button').textContent=this.muted?'×':'♪';toast(this.muted?'SOUND RESTING':'SOUND ON');}
};

/* -------------------------------------------------------------------------- */
/* Player, interaction and commands                                           */
/* -------------------------------------------------------------------------- */

const playerRig=new THREE.Group();
const cameraPivot=new THREE.Group();
playerRig.add(cameraPivot);cameraPivot.add(camera);scene.add(playerRig);
// Each player sees from their own character's eyes.
const ownEyeHeight=isIshiee?CONFIG.hisEyeHeight:CONFIG.eyeHeight;
cameraPivot.position.y=CONFIG.thirdPerson?1.25:ownEyeHeight;
camera.position.set(0,0,CONFIG.thirdPerson?4.6:0);
const avatar=buildCharacter(playerRig,isIshiee?DATE_OUTFIT:{});
if(roleUI)avatar.root.scale.setScalar(1.06);
avatar.root.visible=CONFIG.thirdPerson;
const companion=buildCompanion(scene,{terrainHeight,onIsland,stageHeight:STAGE_HEIGHT,stageRadius:STAGE_RADIUS,female:isIshiee,
  resolveMove:(x,z,dx,dz,player)=>moveAroundRocks(x,z,dx,dz,[...rockColliders,{x:player.x,z:player.z,radius:.30}],onIsland,.32)});
const pointingHand=isPassenger?buildHandPose(playerRig,{color:SUIT_COLOR,shoulder:[.36,1.36,-.06],sleeveLength:.48}):null;
const pointTarget=new THREE.Vector3();
const firstPersonHand=buildHandPose(playerRig,{floating:true,color:isIshiee?SUIT_COLOR:BIRTHDAY_ROSE,skinColor:isIshiee?0xf6cc77:BIRTHDAY_SKIN,shortSleeves:!isIshiee,puffSleeves:!isIshiee,armThickness:isIshiee?1:HER_ARM_THICKNESS,handScale:isIshiee?1:.92});
const joinedHands=new THREE.Vector3(),partnerHand=new THREE.Vector3();
const claspRotation=new THREE.Quaternion(),partnerLinkRotation=new THREE.Quaternion(),playerLinkRotation=new THREE.Quaternion();
const partnerLinkTurn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2),playerLinkTurn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
const claspAxis=new THREE.Vector3(),claspShoulder=new THREE.Vector3(),ringNormal=new THREE.Vector3(0,0,1);
let handAmount=0;
const handInteraction={type:'companion',object:companion.anchor,reach:3.7,prompt:'hold hands',action:()=>{
  if(!handsLinked()&&!canHoldHands())return;
  if(multiplayerRequested&&(isIshiee||!network?.autopilot)){
    if(!network?.remoteLive){toast('WAIT FOR YOUR PARTNER TO JOIN');return;}
    network.event({type:'hand'});return;
  }
  const held=companion.toggleHolding();toast(held?'HOLDING HANDS · H TO LET GO':'HANDS FREE');
}};
function handsLinked(){return !!(companion.holding||network?.snapshot?.world.holding);}
function canHoldHands(){
  return companion.anchor.visible&&!isPassenger&&!bouquetControls.previewing&&!stargazing.active&&
    !stoneSkipping.active&&!companion.throwing&&!avatar.bouquetActive&&!companion.bouquetActive&&
    !bouquetControls.shown&&!bouquetControls.received&&
    (handsLinked()||companion.anchor.position.distanceTo(playerRig.position)<handInteraction.reach);
}
function updateHoldingHands(dt){
  handAmount+=((companion.holding&&companion.holdReady?1:0)-handAmount)*(1-Math.exp(-dt*6));
  // The clasp belongs to his lowered hand, not to the player's view direction.
  companion.anchor.updateWorldMatrix(true,false);
  partnerHand.set(-.38,1.05,-.50);companion.anchor.localToWorld(partnerHand);
  claspShoulder.set(-.36*1.06,1.14*1.06,0);companion.anchor.localToWorld(claspShoulder);
  claspAxis.subVectors(partnerHand,claspShoulder).normalize();
  partnerHand.copy(claspShoulder).addScaledVector(claspAxis,(.38+.112+.025)*1.06);
  // Both link planes contain the arm axis, with a quarter turn between them.
  claspRotation.setFromUnitVectors(ringNormal,claspAxis);
  partnerLinkRotation.copy(claspRotation).multiply(partnerLinkTurn);
  playerLinkRotation.copy(claspRotation).multiply(playerLinkTurn);
  joinedHands.copy(partnerHand).addScaledVector(claspAxis,.09);
  firstPersonHand.update(joinedHands,CONFIG.thirdPerson?0:handAmount,playerLinkRotation,claspAxis);
  avatar.poseHand(joinedHands,CONFIG.thirdPerson?handAmount:0,playerLinkRotation);
  companion.poseHand(partnerHand,handAmount,partnerLinkRotation);
  handInteraction.prompt=companion.holding?'let go of his hand':'hold hands';
}
let avatarHeading=0;
const spawnZ=27; // Just before the grassy entrance finishes fading into the trail.
const spawnX=celebrationPathX(spawnZ);
playerRig.position.set(spawnX,terrainHeight(spawnX,spawnZ),spawnZ);
// Begin facing the warm side of the sky and the party garden, not the cool
// anti-sun horizon. The sky remains intentionally asymmetric like the source.
playerRig.rotation.y=Math.atan2(spawnX-celebrationPathX(spawnZ-7),7);
cameraPivot.rotation.x=-.12;
const keys={};
const playerJump=createPlayerJump();
const stargazing=buildStargazing({scene,camera,playerRig,avatar,companion,terrainHeight,interactive,setMood,keys,glowTexture,networkMode:multiplayerRequested,male:isIshiee,
  // Stargazing waits until the candles are blown and the cash dash is over.
  canStart:()=>!candlesLit&&!!cashDash?.finished,onBlocked:()=>toast(candlesLit?'BLOW OUT THE CANDLES FIRST':`FINISH THE ${DASH_NAME.toUpperCase()} FIRST`),
  canMovePartner:()=>!multiplayerRequested||!!network?.autopilot,onInk:points=>network?.event({type:"ink",points}),onLeave:()=>requestPointerLock()});
let playing=false;
const bouquetControls=buildBouquetControls({scene,camera,playerRig,avatar,companion,terrainHeight,hisEyeHeight:CONFIG.hisEyeHeight,
  isOnline:multiplayerRequested,isMale:isIshiee,roleUI,getNetwork:()=>network,isPlaying:()=>playing,
  isBusy:()=>stargazing.active||passengerLying||companion.throwing||rewardBusy||sceneContext.active||$('#command').classList.contains('open')||!!$('.note-modal.open'),
  clearKeys:()=>{Object.keys(keys).forEach(k=>keys[k]=false);playerJump.reset();},toast});
let nearest=null;
const sceneContext=buildSceneContext({camera,clouds,snapshot:()=>({
  player:playerRig.position.toArray(),heading:playerRig.rotation.y,pitch:cameraPivot.rotation.x,
  cameraPosition:camera.getWorldPosition(new THREE.Vector3()).toArray(),
  cameraQuaternion:camera.getWorldQuaternion(new THREE.Quaternion()).toArray(),
  mood:currentMood,elapsed,stargazing:stargazing.active
})});

function onIsland(x,z){return Math.sqrt((x/67)**2+(z/54)**2)<.89;}
const cashDash=buildCashDash({scene,camera,ground:renderedGroundHeight,rewards:cashRewards,online:multiplayerRequested,male:isIshiee,roleUI,
  resolveSite:(x,z)=>moveAroundRocks(x,z,0,0,rockColliders,onIsland,.9),getNetwork:()=>network,isPlaying:()=>playing,
  candlesBlown:()=>!candlesLit,
  getCollector:()=>roleUI&&isIshiee||stargazing.active||bouquetControls.hisView||sceneContext.active?null:playerRig.position,
  onStart:()=>{if(!multiplayerRequested&&companion.holding)companion.toggleHolding();},
  onPickup:()=>{audio.tone(880,0,.09,.024);audio.tone(1174.66,.055,.12,.018);}
});
const hostControls=roleUI&&isIshiee?buildHostControls():null;
function buildHostControls(){
  const bar=document.createElement('nav');bar.id='host-controls';bar.className='hidden-ui';bar.setAttribute('aria-label','Celebration controls');
  bar.append($('#bouquet-controls'));
  const actions=[];
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);bar.append(b);actions.push(b);};
  button('Fireworks · F',()=>launchFireworks(7));
  button('Next song · N',()=>{const from=radio.index??0;requestSong(from,(from+1)%radio.count);});
  bar.append($('.cash-dash-start'));document.body.append(bar);
  return {update(){const busy=!playing||!networkReady||stargazing.active||rewardBusy||$('#command').classList.contains('open')||!!$('.note-modal.open');for(const b of actions)b.disabled=busy;}};
}
const walkingReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let walkingBobPhase=0,walkingBobAmount=0;
const previewFollower=createPreviewFollower();
let wasHisView=false;
function updatePreviewFollower(dt){
  const next=previewFollower.step(dt,playerRig.position,companion.anchor.position,rockColliders,onIsland,CONFIG.walkSpeed);
  playerRig.position.x=next.x;playerRig.position.z=next.z;
  const ground=terrainHeight(next.x,next.z)+STAGE_HEIGHT*(1-smoothstep(STAGE_RADIUS-.06,STAGE_RADIUS+.12,Math.hypot(next.x+8,next.z+10)));
  playerRig.position.y=lerp(playerRig.position.y,ground,1-Math.exp(-dt*14));
  if(next.yaw!==null){
    const delta=Math.atan2(Math.sin(next.yaw-playerRig.rotation.y),Math.cos(next.yaw-playerRig.rotation.y));
    playerRig.rotation.y+=delta*(1-Math.exp(-dt*7));
  }
  avatar.root.rotation.set(0,0,0);avatarHeading=playerRig.rotation.y;
  avatar.update(dt,next.moving,next.running,0,null,legPace(next.moving?CONFIG.walkSpeed*(next.running?1.5:.85):0,next.running));
}
function movePlayer(dt){
  if(gestureWheel.active)return;
  if(bouquetControls.hisView){
    if(!wasHisView){previewFollower.reset();wasHisView=true;}
    const rig=companion.anchor,active=document.pointerLockElement===renderer.domElement;
    const sx=active?Number(!!keys.KeyD)-Number(!!keys.KeyA):0,sz=active?Number(!!keys.KeyS)-Number(!!keys.KeyW):0;
    const running=!!(keys.ShiftLeft||keys.ShiftRight);
    tmp.set(sx,0,sz).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),rig.rotation.y).multiplyScalar(CONFIG.walkSpeed*(running?1.7:1)*dt);
    const next=moveAroundRocks(rig.position.x,rig.position.z,tmp.x,tmp.z,[...rockColliders,{x:playerRig.position.x,z:playerRig.position.z,radius:.30}],onIsland,.32);
    const moving=Math.hypot(next.x-rig.position.x,next.z-rig.position.z)>.0001;
    const ground=terrainHeight(next.x,next.z)+STAGE_HEIGHT*(1-smoothstep(STAGE_RADIUS-.06,STAGE_RADIUS+.12,Math.hypot(next.x+8,next.z+10)));
    companion.setNetworkPose({position:[next.x,playerJump.update(rig.position.y,ground,dt),next.z],yaw:rig.rotation.y,pitch:0,moving,running,lying:false},dt,true);
    updatePreviewFollower(dt);
    return;
  }
  if(wasHisView){wasHisView=false;previewFollower.reset();avatar.update(1,false,false);}
  if(bouquetControls.previewing){playerJump.reset();return;}
  if(isPassenger)return;
  if(multiplayerRequested&&!networkReady)return;
  if(sceneContext.active)return;
  if(stargazing.active){playerJump.reset();return;}
  const active=document.pointerLockElement===renderer.domElement;
  let sx=(keys.KeyD?1:0)-(keys.KeyA?1:0),sz=(keys.KeyS?1:0)-(keys.KeyW?1:0);
  if(!active){sx=0;sz=0;}
  const running=!!(keys.ShiftLeft||keys.ShiftRight);
  let moved=0;
  if(CONFIG.thirdPerson)avatar.update(dt,!!(sx||sz),running);
  if(sx||sz){
    const len=Math.hypot(sx,sz);sx/=len;sz/=len;
    avatarHeading=playerRig.rotation.y+Math.atan2(-sx,-sz);
    const speed=CONFIG.walkSpeed*(keys.ShiftLeft||keys.ShiftRight?1.7:1);
    tmp.set(sx,0,sz).applyAxisAngle(new THREE.Vector3(0,1,0),playerRig.rotation.y).multiplyScalar(speed*dt);
    const obstacles=companion.anchor.visible&&Math.abs(companion.anchor.rotation.x)<.7&&Math.abs(companion.anchor.position.y-playerRig.position.y)<1.6
      ?[...rockColliders,{x:companion.anchor.position.x,z:companion.anchor.position.z,radius:.32}]:rockColliders;
    const next=moveAroundRocks(playerRig.position.x,playerRig.position.z,tmp.x,tmp.z,obstacles,onIsland,.30);
    moved=Math.hypot(next.x-playerRig.position.x,next.z-playerRig.position.z);
    playerRig.position.x=next.x;playerRig.position.z=next.z;
  }
  // Follow actual footsteps, so holding a movement key against an obstacle stays still.
  if(!CONFIG.thirdPerson){
    const bobbing=moved>.0001&&!playerJump.active&&!walkingReducedMotion.matches;
    if(bobbing)walkingBobPhase=(walkingBobPhase+moved*Math.PI*2/(running?2.8:2.2))%(Math.PI*2);
    // The held flowers make camera bob especially noticeable in first person.
    const targetAmount=bobbing?(running?.045:.028)*(avatar.bouquetActive?.5:1):0;
    walkingBobAmount+=(targetAmount-walkingBobAmount)*(1-Math.exp(-dt*9));
    cameraPivot.position.y=ownEyeHeight+Math.sin(walkingBobPhase)*walkingBobAmount;
  }
  // Ease onto the ground rather than snapping, so crests and troughs feel like
  // gliding over the land instead of stepping up and down it.
  const stageDistance=Math.hypot(playerRig.position.x+8,playerRig.position.z+10);
  const ground=terrainHeight(playerRig.position.x,playerRig.position.z)+STAGE_HEIGHT*(1-smoothstep(STAGE_RADIUS-.06,STAGE_RADIUS+.12,stageDistance));
  playerRig.position.y=playerJump.update(playerRig.position.y,ground,dt);
  if(!CONFIG.thirdPerson)return;
  const targetHeading=avatarHeading-playerRig.rotation.y;
  const delta=Math.atan2(Math.sin(targetHeading-avatar.root.rotation.y),Math.cos(targetHeading-avatar.root.rotation.y));
  avatar.root.rotation.y+=delta*(1-Math.exp(-dt*12));
  // Shorten the camera boom before it passes through a hillside.
  let boom=4.6;
  const pitch=cameraPivot.rotation.x,yaw=playerRig.rotation.y;
  for(let d=.4;d<=4.6;d+=.15){
    const wx=playerRig.position.x+Math.sin(yaw)*Math.cos(pitch)*d;
    const wz=playerRig.position.z+Math.cos(yaw)*Math.cos(pitch)*d;
    const wy=playerRig.position.y+1.25-Math.sin(pitch)*d;
    if(wy<terrainHeight(wx,wz)+.22){boom=Math.max(.35,d-.2);break;}
  }
  camera.position.z=boom<camera.position.z?boom:lerp(camera.position.z,boom,1-Math.exp(-dt*8));
  avatar.root.visible=camera.position.z>.65;
}

function updateInteraction(){
  if(isPassenger||bouquetControls.previewing){nearest=null;$('#interaction').classList.remove('show');return;}
  nearest=null;let best=Infinity;
  for(const item of interactive){
    if(item.found||item===handInteraction||(item.available&&!item.available()))continue;
    item.object.getWorldPosition(tmp);
    const d=tmp.distanceTo(playerRig.position);
    if(d<item.reach&&d<best){best=d;nearest=item;}
  }
  const canHold=canHoldHands();
  const el=$('#interaction');
  if(stoneSkipping.active||stargazing.active){el.classList.remove('show');return;}
  if(nearest||canHold){
    const pickupKey='<b aria-label="Left mouse button" title="Left mouse button"><svg width="14" height="18" viewBox="0 0 24 28" aria-hidden="true"><path d="M11 4a6 6 0 0 0-6 6v2h6Z" fill="currentColor"/><rect x="4" y="2" width="16" height="24" rx="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v10M5 13h14" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></b><span class="key-alternative">/</span><b>E</b>';
    const interaction=nearest?`${nearest.type==='skipping'?pickupKey:'<b>E</b>'} ${nearest.prompt}`:'';
    el.innerHTML=interaction+(canHold?`${interaction?' · ':''}<b>H</b> ${handsLinked()?'let go':handInteraction.prompt}`:'');el.classList.add('show');
  }
  else el.classList.remove('show');
}

function setMood(name){
  if(network&&!applyingNetwork){network.event({type:"mood",value:name});return;}
  if(!MOODS[name])return;
  currentMood=name;moodTarget={...MOODS[name]};
  document.querySelectorAll('#moods button').forEach(b=>b.classList.toggle('active',b.dataset.mood===name));
  toast(`${name.toUpperCase()} ON THE ISLAND`);
}
document.querySelectorAll('#moods button').forEach(b=>{b.hidden=b.dataset.mood==='sunset'&&!CONFIG.sunset;b.addEventListener('click',()=>setMood(b.dataset.mood));});

const chatLog=buildChatLog();
const chatBubbles=buildChatBubbles({scene,camera,onMessage:(user,text)=>chatLog.show(user,text),
  getAnchor:user=>user===(islandUser||'MOSHIEE')?playerRig:(!multiplayerRequested||network?.remoteLive?companion.anchor:null),
  onSound:()=>{audio.tone(740,0,.13,.022);audio.tone(988,.08,.19,.017);}
});
let commandMode=false,lastChatSent=0;
const expressionValues={ISHIEE:'normal',MOSHIEE:'normal'};
const expressionDeadlines={ISHIEE:0,MOSHIEE:0};
function applyExpression(user,value,duration=EXPRESSION_MS){
  expressionValues[user]=value;
  expressionDeadlines[user]=value==='normal'?0:Date.now()+duration;
  const character=roleUI?(user===islandUser?avatar:companion):(user==='ISHIEE'?companion:avatar);
  character.setExpression(value,duration);
}
function showExpressionBubble(user,value,duration=EXPRESSION_MS){
  const expression=EXPRESSIONS.find(e=>e.id===value);
  if(expression&&value!=='normal'&&duration>0)chatBubbles.show(user,expression.emoji,{emoji:true,duration});
}
let lastExpressionSent=-Infinity;
function selectExpression(user,value){
  if(!playing)return false;
  if(multiplayerRequested){
    if(!network?.connected){toast('RECONNECT TO CHANGE YOUR EXPRESSION');return false;}
    if(performance.now()-lastExpressionSent<220)return false;
    lastExpressionSent=performance.now();network.event({type:'expression',value});
  }
  applyExpression(user,value);if(!multiplayerRequested)showExpressionBubble(user,value);return true;
}
function applyGesture(user,value){
  const character=roleUI?(user===islandUser?avatar:companion):(user==='ISHIEE'?companion:avatar);
  if(!character.triggerGesture(value))return false;
  chatBubbles.show(user,value==='wave'?'👋':'🙌',{emoji:true,duration:2400});return true;
}
const gestureWheel=buildGestureWheel({surface:renderer.domElement,
  canOpen:()=>playing&&(!multiplayerRequested||networkReady)&&!stargazing.active&&!sceneContext.active&&!rewardBusy&&!$('.note-modal.open')&&!$('#command').classList.contains('open'),
  onOpen:()=>{Object.keys(keys).forEach(k=>keys[k]=false);stoneSkipping.cancelCharge();},
  onSelect:action=>{
    if(multiplayerRequested&&!network?.connected){toast('RECONNECT TO USE GESTURES');return;}
    const user=roleUI?islandUser:bouquetControls.hisView?'ISHIEE':'MOSHIEE';
    if(action.kind==='expression'){selectExpression(user,action.id);expressionControls.sync(expressionValues,expressionDeadlines);return;}
    if(handsLinked()||stoneSkipping.active||companion.throwing||avatar.bouquetActive||companion.bouquetActive){toast('FREE YOUR HANDS TO USE THIS GESTURE');return;}
    if(applyGesture(user,action.id)&&multiplayerRequested)network.event({type:'gesture',value:action.id});
  }
});
const expressionControls=buildExpressionControls({container:$('#command'),isOnline:roleUI,user:islandUser||'ISHIEE',onPreviewMessage:user=>{
  if(multiplayerRequested||!playing||commandMode)return;
  const text=Array.from($('#command-input').value.trim()||'I’m so happy to be here with you ♡').slice(0,140).join('');
  chatBubbles.show(user,text);
},onSelect:selectExpression});
function openCommand(commands=false){
  if(roleUI)commands=false;
  commandMode=commands;
  expressionControls.setMode(commands);expressionControls.setConnected(!multiplayerRequested||!!network?.connected);
  Object.keys(keys).forEach(k=>keys[k]=false);passengerPointing=false;
  $('#command label').textContent=commands?'ISLAND COMMAND':'A LITTLE MESSAGE';
  $('#command-input').placeholder=commands?(CONFIG.sunset?'try: fireworks, night, sunset, day':'try: fireworks, night, day'):'say something sweet…';
  $('#command-input').maxLength=140;
  expressionControls.setTarget(bouquetControls.hisView?'MOSHIEE':'ISHIEE');
  $('#command-input').setAttribute('aria-label',commands?'Command':'Message');
  if(!commands)$('#command-input').placeholder='Message…';
  $('#command > div > span').textContent=commands?'//':'♡';
  $('#command small').textContent=commands?'Enter to run · Esc to close':'Enter to send · nearby friends only · / again for commands';
  if(document.pointerLockElement)document.exitPointerLock();
  $('#command').classList.add('open');
  $('#command-input').focus();
}
function closeCommand(lock=true){
  $('#command').classList.remove('open');$('#command-input').value='';
  if(lock&&playing&&!stargazing.active)setTimeout(()=>requestPointerLock(),100);
}
function runCommand(raw){
  if(isPassenger){closeCommand();return;}
  const cmd=raw.trim().toLowerCase().replace(/^\//,'');
  if(cmd==='context'){closeCommand(false);sceneContext.open();return;}
  if(cmd==='fireworks'||cmd==='firework'||cmd==='celebrate')launchFireworks(9);
  else if(cmd==='birthday'||cmd==='wish'){finalePendingUntil=elapsed+8;launchFireworks(7);}
  else if(cmd==='stargaze'){if(!stoneSkipping.active)stargazing.enter();}
  else if(MOODS[cmd]&&(cmd!=='sunset'||CONFIG.sunset))setMood(cmd);
  else if(cmd==='gifts'||cmd==='gift')toast(`BLOW OUT THE CANDLES TO BEGIN THE ${DASH_NAME.toUpperCase()}`);
  else if(cmd==='blow'||cmd==='candles'){
    const cake=interactive.find(i=>i.type==='cake');cake.object.getWorldPosition(tmp);
    if(tmp.distanceTo(playerRig.position)<cake.reach)blowCandles();else toast('FIND THE CAKE IN THE PARTY GARDEN FIRST');
  } else if(cmd==='help'||cmd==='commands')toast('TRY: FIREWORKS · DAY · SUNSET · NIGHT · GIFTS · STARGAZE');
  else if(cmd)toast(`THE ISLAND DOESN’T KNOW “${cmd.toUpperCase()}” YET`);
  closeCommand();
}
$('#command').addEventListener('submit',e=>{
  e.preventDefault();if(e.isComposing)return;
  const text=$('#command-input').value.trim();
  if(commandMode){runCommand(text);return;}
  if(!text)return;
  if(performance.now()-lastChatSent<1200){toast('ONE LITTLE MOMENT…');return;}
  if(multiplayerRequested&&!network?.connected){toast('WAITING TO RECONNECT');return;}
  lastChatSent=performance.now();
  if(network)network.event({type:'chat',text});else chatBubbles.show(islandUser||(bouquetControls.hisView?'ISHIEE':'MOSHIEE'),text);
  closeCommand();toast('MESSAGE SENT ♡');
});
$('#command-button').addEventListener('click',()=>openCommand());
$('#sound-button').addEventListener('click',()=>audio.toggle());

window.addEventListener('keydown',e=>{
  if(sceneContext.active){if(e.code==='Escape'){e.preventDefault();sceneContext.close();}return;}
  if($('#command').classList.contains('open')){
    if(e.code==='Escape'){e.preventDefault();closeCommand();}
    if(e.code==='Slash'&&!e.repeat&&!commandMode&&!$('#command-input').value){e.preventDefault();openCommand(true);}
    return;
  }
  if($('.note-modal.open')||rewardBusy)return;
  if(multiplayerRequested&&!networkReady)return;
  if(!roleUI&&e.code==='KeyP'&&!e.repeat&&playing){e.preventDefault();Object.keys(keys).forEach(k=>keys[k]=false);sceneContext.open();return;}
  if(playing&&bouquetControls.keyDown(e))return;
  if(bouquetControls.hisView){
    if(e.code==='Slash'&&!e.repeat){e.preventDefault();openCommand();return;}
    if(e.code==='Space'){e.preventDefault();if(!e.repeat&&document.pointerLockElement===renderer.domElement)playerJump.start();return;}
    if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){keys[e.code]=true;return;}
  }
  if(bouquetControls.previewing&&!['Digit1','Digit2','Digit3','KeyM'].includes(e.code))return;
  if(e.code==='Slash'&&!e.repeat&&playing){e.preventDefault();openCommand();return;}
  // Host shortcuts must run before companion mode's input gate. Chat and
  // modal guards above keep typing from triggering celebration actions.
  if(playing&&!stargazing.active&&(!roleUI||isIshiee)&&!e.repeat){
    if(e.code==='KeyF'){e.preventDefault();launchFireworks(7);return;}
    if(e.code==='KeyN'){e.preventDefault();const from=radio.index??0;requestSong(from,(from+1)%radio.count);return;}
  }
  if(isPassenger){
    if(!playing)return;
    if(e.code==='KeyR'){e.preventDefault();passengerPointing=true;}
    if(e.code==='Space'&&!e.repeat){e.preventDefault();if(network?.remoteLive)network.event({type:'cheer'});else toast('WAITING FOR MOSHIEE TO JOIN');}
    if(e.code==='KeyM'&&!e.repeat)audio.toggle();
    return;
  }
  if(stargazing.keyDown(e))return;
  if(stoneSkipping.keyDown(e))return;
  if(e.code==='Space'){
    if(playing&&document.pointerLockElement===renderer.domElement){e.preventDefault();if(!e.repeat)playerJump.start();}
    return;
  }
  keys[e.code]=true;
  if(e.code==='KeyE'&&nearest&&nearest!==handInteraction&&!e.repeat)nearest.action();
  if(e.code==='KeyH'&&!e.repeat&&(handsLinked()||canHoldHands()))handInteraction.action();
  if(e.code==='KeyM')audio.toggle();
  if((!roleUI||isIshiee)&&e.code==='Digit1')setMood('day');
  if((!roleUI||isIshiee)&&CONFIG.sunset&&e.code==='Digit2')setMood('sunset');
  if((!roleUI||isIshiee)&&e.code==='Digit3')setMood('night');
});
window.addEventListener('keyup',e=>{if(e.code==='KeyR')passengerPointing=false;stoneSkipping.keyUp(e);keys[e.code]=false;});
// Chrome on Windows sometimes reports one huge mouse jump under pointer lock,
// often right after locking, which would snap the view toward the sky.
let lookSettle=0;
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement===renderer.domElement)lookSettle=2;else{passengerPointing=false;stoneSkipping.cancelCharge();}});
renderer.domElement.addEventListener('mousedown',e=>{
  if(!playing||isPassenger||!networkReady||stargazing.active||bouquetControls.previewing||sceneContext.active||rewardBusy||$('.note-modal.open')||$('#command').classList.contains('open')||document.pointerLockElement!==renderer.domElement)return;
  stoneSkipping.pointerDown(e,playerRig.position);
});
window.addEventListener('mouseup',e=>stoneSkipping.pointerUp(e));
window.addEventListener('pointercancel',()=>stoneSkipping.cancelCharge());
window.addEventListener('blur',()=>{passengerPointing=false;stoneSkipping.cancelCharge();Object.keys(keys).forEach(k=>keys[k]=false);});
function requestPointerLock(){
  if(stargazing.active)return;
  const result=renderer.domElement.requestPointerLock?.();
  result?.catch(()=>{ /* A browser can decline; clicking the world retries. */ });
}
renderer.domElement.addEventListener('click',()=>{if(playing&&!stargazing.active&&!$('.note-modal.open')&&!$('#command').classList.contains('open'))requestPointerLock();audio.resume();radio.resume();});
window.addEventListener('mousemove',e=>{
  if(gestureWheel.active)return;
  if(stargazing.active||document.pointerLockElement!==renderer.domElement)return;
  // Skip the first events after locking and any physically impossible jump.
  if(lookSettle>0){lookSettle--;return;}
  if(Math.abs(e.movementX)>280||Math.abs(e.movementY)>180)return;
  if(bouquetControls.hisView){bouquetControls.look(e.movementX,e.movementY);return;}
  playerRig.rotation.y-=e.movementX*.0022;
  const pitch=cameraPivot.rotation.x-e.movementY*.0018;
  cameraPivot.rotation.x=CONFIG.thirdPerson?clamp(pitch,-1.15,.35):clampWalkPitch(pitch);
});

let toastTimer;
function toast(message){
  const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);
}

/* The original film-print idea: lifted violet shadows, cream highlights, a
   gentle hand-painted S curve, paper tooth, warm vignette and ordered dither. */
const sceneTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{
  type:THREE.HalfFloatType,
  minFilter:THREE.LinearFilter,
  magFilter:THREE.LinearFilter,
  depthBuffer:true,
  // The renderer's own antialiasing does not apply when drawing into a target,
  // so without this every blade edge is a hard step — which is what makes a
  // dense sward read as noise rather than as grass.
  samples:4
});
sceneTarget.samples=2;
const postScene=new THREE.Scene();
const postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
// The reference's HDR firewall: a non-finite source texel must never spread
// through the low-resolution bloom into a large rectangular patch.
const safeColorGLSL=`vec3 safeColor(vec3 c){return vec3(
  c.r>=0.0?min(c.r,16.0):0.0,c.g>=0.0?min(c.g,16.0):0.0,c.b>=0.0?min(c.b,16.0):0.0);}`;
const bloomTargets=Array.from({length:3},()=>new THREE.WebGLRenderTarget(Math.ceil(innerWidth/4),Math.ceil(innerHeight/4),{
  type:THREE.HalfFloatType,depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter
}));
const bloomMaterial=new THREE.ShaderMaterial({
  depthTest:false,depthWrite:false,
  uniforms:{uSrc:{value:sceneTarget.texture},uStep:{value:new THREE.Vector2()},uExtract:{value:1},uStable:{value:0},uSourceTexel:{value:new THREE.Vector2()}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
  fragmentShader:`${safeColorGLSL}
    uniform sampler2D uSrc;uniform vec2 uStep;uniform float uExtract,uStable;uniform vec2 uSourceTexel;varying vec2 vUv;
    vec3 readLight(vec2 uv){vec3 c=safeColor(texture2D(uSrc,uv).rgb);float l=dot(c,vec3(.2126,.7152,.0722));return c*mix(1.0,smoothstep(.65,1.5,l),uExtract);}
    void main(){
      if(uExtract>.5){
        vec3 light=readLight(vUv);
        if(uStable>.5){
          // Integrate the full downsample footprint instead of skipping small stars.
          light=vec3(0.0);
          for(int y=0;y<4;y++)for(int x=0;x<4;x++)
            light+=readLight(vUv+(vec2(float(x),float(y))-1.5)*uSourceTexel);
          light/=16.0;
        }
        gl_FragColor=vec4(light,1.0);return;
      }
      vec3 c=vec3(0.0);float total=0.0;
      // Closely spaced taps keep each ray continuous around tiny star cores.
      for(int i=-10;i<=10;i++){
        float t=float(i);float w=exp(-t*t/24.0);
        c+=readLight(vUv+uStep*t/3.0)*w;total+=w;
      }
      gl_FragColor=vec4(c/total,1.0);}`
});
const bloomScene=new THREE.Scene();bloomScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),bloomMaterial));
function renderBloom(){
  bloomMaterial.uniforms.uStable.value=1;
  bloomMaterial.uniforms.uSourceTexel.value.set(1/sceneTarget.width,1/sceneTarget.height);
  bloomMaterial.uniforms.uSrc.value=sceneTarget.texture;
  bloomMaterial.uniforms.uExtract.value=1;
  // Extract once before blurring, so both axes spread the same light samples.
  bloomMaterial.uniforms.uStep.value.set(0,0);
  renderer.setRenderTarget(bloomTargets[2]);renderer.render(bloomScene,postCamera);
  bloomMaterial.uniforms.uSrc.value=bloomTargets[2].texture;
  bloomMaterial.uniforms.uExtract.value=0;
  bloomMaterial.uniforms.uStep.value.set(1.5/bloomTargets[0].width,0);
  renderer.setRenderTarget(bloomTargets[0]);renderer.render(bloomScene,postCamera);
  // Blur each axis independently; combining sequential blurs produces a round halo.
  bloomMaterial.uniforms.uSrc.value=bloomTargets[2].texture;
  bloomMaterial.uniforms.uExtract.value=0;
  bloomMaterial.uniforms.uStep.value.set(0,1.5/bloomTargets[0].height);
  renderer.setRenderTarget(bloomTargets[1]);renderer.render(bloomScene,postCamera);
}
const postMaterial=new THREE.ShaderMaterial({
  depthTest:false,depthWrite:false,toneMapped:false,
  uniforms:{uScene:{value:sceneTarget.texture},uBloom:{value:bloomTargets[1].texture},uBloomHorizontal:{value:bloomTargets[0].texture},uTime:{value:0},uExposure:{value:moodLive.exposure},uNight:{value:moodLive.stars},uRes:{value:new THREE.Vector2(innerWidth,innerHeight)}},
  vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
  fragmentShader:`
    precision highp float;
    ${safeColorGLSL}
    uniform sampler2D uScene,uBloom,uBloomHorizontal; uniform float uTime,uExposure,uNight; uniform vec2 uRes;
    varying vec2 vUv;
    float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
    float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
    vec3 tonemap(vec3 x){x=max(x,vec3(0.0));vec3 a=x*(x*.36+.42);vec3 b=x*(x*.34+.66)+.11;return clamp(a/b,0.0,1.0);}
    vec3 softMeadowSample(vec2 uv){
      vec4 centre=texture2D(uScene,uv);
      float amount=clamp((1.0-centre.a)*2.0,0.0,1.0);
      vec3 original=safeColor(centre.rgb);
      if(amount<.04)return original;
      // Small, local pigment blending from the reference's watercolor pass.
      // The alpha mask stops the filter crossing into cake, trees or sky.
      vec2 radius=vec2(mix(.6,1.1,amount))/uRes;
      vec3 sum=original;float total=1.0;
      for(int i=0;i<4;i++){
        vec2 offset=i==0?vec2(1.0,0.0):i==1?vec2(-1.0,0.0):i==2?vec2(0.0,1.0):vec2(0.0,-1.0);
        vec4 tap=texture2D(uScene,uv+offset*radius);
        float w=.65*(1.0-smoothstep(.025,.12,abs(tap.a-centre.a)));
        sum+=safeColor(tap.rgb)*w;total+=w;
      }
      return mix(original,sum/total,amount*.55);
    }
    void main(){
      vec2 d=vUv-.5;float r2=dot(d,d);
      vec3 c=softMeadowSample(vUv)*uExposure;
      c+=(safeColor(texture2D(uBloom,vUv).rgb)+safeColor(texture2D(uBloomHorizontal,vUv).rgb))*.14;
      // Preserve pigment hue: per-channel compression alone bleaches green
      // leaves and blue sky toward gray. Blend a luminance-preserving print.
      float sceneL=max(luma(c),.0001);
      c=mix(tonemap(c),c*(tonemap(vec3(sceneL)).r/sceneL),.65);
      float l=luma(c);
      vec3 shadowPush=mix(vec3(.90,.95,1.16),vec3(1.0),smoothstep(0.0,.34,l));
      vec3 highPush=mix(vec3(1.0),vec3(1.055,1.012,.925),smoothstep(.44,.98,l));
      c*=mix(vec3(1.0),shadowPush,.85)*mix(vec3(1.0),highPush,.90);
      vec3 lift=vec3(.009,.012,.022)*mix(1.0,.40,uNight);c=c*(1.0-lift)+lift;
      // Saturated emissive colors can exceed one after luminance tonemapping.
      // Bound the S-curve input so bright gift lights never invert their hue.
      vec3 curveInput=clamp(c,0.0,1.0);
      c=mix(c,curveInput*curveInput*(3.0-2.0*curveInput),mix(.24,.38,uNight));
      l=luma(c);float sat=1.0+.16*smoothstep(.10,.42,l)*(1.0-smoothstep(.62,.96,l));
      c=mix(vec3(l),c,sat);
      float grain=(hash12(gl_FragCoord.xy*.47+floor(uTime*9.0))-.5)*.008;
      float fibre=(hash12(vec2(gl_FragCoord.x*.07,gl_FragCoord.y*.91))-.5)*.004;
      c*=1.0+grain+fibre;
      float vig=pow(clamp(1.0-r2*1.15,0.0,1.0),1.55);
      c*=mix(vec3(.88,.89,.94),vec3(1.0),vig);
      // Uncorrelated static dither avoids a diagonal lattice on smooth water.
      float dither=hash12(floor(gl_FragCoord.xy)+vec2(71.7,19.3));
      c+=(dither-.5)/255.0;
      gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
      #include <colorspace_fragment>
    }
  `
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMaterial));

/* -------------------------------------------------------------------------- */
/* Animation                                                                  */
/* -------------------------------------------------------------------------- */

const clock=new THREE.Clock();
let elapsed=0;
let lastShadowTime=-1;
let lastFrameTime=-Infinity;
let resolutionScale=1;
let frameWindow=0,frameCount=0,qualityCooldown=0,qualityCeiling=1;
const gl=renderer.getContext();
const gpuTimer=gl.getExtension('EXT_disjoint_timer_query_webgl2');
const gpuQueries=[];
let gpuMs=0,cpuMs=0;
function beginGpuSample(){
  if(!gpuTimer)return null;
  while(gpuQueries.length&&gl.getQueryParameter(gpuQueries[0],gl.QUERY_RESULT_AVAILABLE)){
    const query=gpuQueries.shift();
    if(!gl.getParameter(gpuTimer.GPU_DISJOINT_EXT)){
      const ms=gl.getQueryParameter(query,gl.QUERY_RESULT)/1e6;
      gpuMs=gpuMs?lerp(gpuMs,ms,.12):ms;
    }
    gl.deleteQuery(query);
  }
  if(gpuQueries.length>3)return null;
  const query=gl.createQuery();gl.beginQuery(gpuTimer.TIME_ELAPSED_EXT,query);return query;
}
const inspect = new URLSearchParams(location.search).has('inspect');
const diagnostic = inspect&&!roleUI ? document.createElement('output') : null;
if(diagnostic){diagnostic.id='render-stats';diagnostic.style.cssText='position:fixed;left:20px;top:90px;padding:10px;background:#102a30cc;color:#fff;font:12px monospace;z-index:100;white-space:pre';document.body.appendChild(diagnostic);}
function resizeTargets(){
  // Bound total scene pixels as well as DPR: Retina should not quadruple GPU work.
  const pixelScale=Math.min(1,Math.sqrt(1600000/(innerWidth*innerHeight)))*resolutionScale;
  const w=Math.max(1,Math.round(innerWidth*pixelScale)),h=Math.max(1,Math.round(innerHeight*pixelScale));
  sceneTarget.setSize(w,h);postMaterial.uniforms.uRes.value.set(w,h);
  bloomTargets.forEach(t=>t.setSize(Math.ceil(w/4),Math.ceil(h/4)));
}
resizeTargets();
function updateQuality(rawDt){
  if(document.hidden||rawDt>.15){frameWindow=0;frameCount=0;return;}
  frameWindow+=rawDt;frameCount++;
  if(frameWindow<2)return;
  const ms=frameWindow*1000/frameCount;
  qualityCooldown=Math.max(0,qualityCooldown-frameWindow);
  if(elapsed>6&&qualityCooldown===0){
    // Without a GPU timer (possible on a Mac), slow frames alone mean the GPU is
    // behind: draw calls cost the CPU little there, so they cannot be the signal.
    const overloaded=gpuTimer?gpuMs>18:document.hasFocus()&&ms>23;
    const headroom=gpuTimer?gpuMs>0&&gpuMs<11:ms<17;
    // A level that proved too heavy is not tried again, so quality never flip-flops.
    if(overloaded)qualityCeiling=Math.max(.7,resolutionScale-.05);
    const next=overloaded?Math.max(.7,resolutionScale-.1):headroom?Math.min(qualityCeiling,resolutionScale+.05):resolutionScale;
    if(next!==resolutionScale){resolutionScale=next;resizeTargets();qualityCooldown=6;}
  }
  if(diagnostic)diagnostic.textContent=`${Math.round(1000/ms)} fps · ${ms.toFixed(1)} ms/frame${gpuMs?` · GPU ${gpuMs.toFixed(1)} ms`:""}\n${sceneTarget.width} × ${sceneTarget.height} · ${grassBladeCount.toLocaleString()} grass blades\n${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString()} triangles\n${currentMood} · ${playerRig.position.x.toFixed(1)}, ${playerRig.position.z.toFixed(1)}`;
  frameWindow=0;frameCount=0;
}
// Read-only inspection views make the visual acceptance pass reproducible.
const inspectParams=new URLSearchParams(location.search);
if(inspect){
  const views={skippingshore:[42,29,-1.03,-.34],skipping:[45,26,-Math.PI/2,-.32],plane:[-8,4,0,.28],hats:[-6.4,-8.4,.55,-.35],moonisland:[-35,-38,.615,.08],companion:[-5.9,-6.7,0,-.22],dandelions:[-1.8,15.5,0,-.65],boat:[-46,23,2.25,.025],money:[1.5,10.5,0,-.25],shadows:[-8,-4,0,-.48],aurora:[14,26,3.757,.36],character:[22,-14,Math.PI,-.18],fireside:[22,-14,0,-.25],stump:[24.6,-17.3,.20,-.58],flowers:[flowerSpots[0][0],flowerSpots[0][2]+2.2,0,-.48],mushrooms:[-13.4,-1.1,0,-.61],zenith:[-8,-6.4,0,Math.PI/2],fireworks:[-8,4,0,.58],path:[.8,17,.12,-.22],pathstart:[celebrationPathX(37),39,0,-.40],celebration:[-2.2,4,.38,-.24],treebase:[17,20.5,0,-.48],trees:[-28,1,1.2,.16],clouds:[14,26,2.5,.40],shore:[-49,-10,.62,-.01],garden:[-8,-6,0,-.10],meadow:[23,8,.9,-.20],gift:[2,8,0,-.12],giftclose:[25,22.8,0,-.65],rug:[-12,15.5,0,-.60],
    fish:[47,26,-2.05,-.16],benchfish:[-43,-3,1.57,-.16],bench:[-38.5,-3,1.57,-.06],cake:[-8,-6.4,0,-.16],hills:[14,26,2.5,-.03],
    // Facing away from the sun with the camera up: the anti-sun meridian is
    // where sky shader math degenerates, and nothing else in the scene looks there.
    antisun:[-9.7,17.4,3.76,.62]};
  const v=views[inspectParams.get('view')];
  if(v){playerRig.position.set(v[0],terrainHeight(v[0],v[1]),v[1]);playerRig.rotation.y=v[2];cameraPivot.rotation.x=v[3];}
  if(inspectParams.get('view')==='plane'&&inspectParams.has('planeStill')){
    // Close color/type inspection under the actual island sky and lighting.
    scene.attach(camera);camera.position.set(-18,56,-98);camera.lookAt(-14,49,-155);
  }
  if(inspectParams.has('fireworkStill')){fireworks.launch(playerRig.position,playerRig.rotation.y,7);for(let i=0;i<240;i++)fireworks.update(1/60);}
  if(inspectParams.has('skipPartner')){companion.celebrate();companion.update(2.2,playerRig.position);companion.anchor.position.set(49,terrainHeight(49,20),20);}
}
// Keep the canopy bulbs lit normally in their separate, bloom-free pass.
scene.traverse(o=>{if(o.isLight)o.layers.enable(1);});
renderer.info.autoReset=false;
function approachColor(color,key,dt){color.lerp(new THREE.Color(moodTarget[key]),1-Math.exp(-dt*1.2));}
function updateMood(dt){
  const k=1-Math.exp(-dt*1.15);
  for(const name of ['sunPower','hemi','exposure','stars','ambient','elevation'])moodLive[name]=lerp(moodLive[name],moodTarget[name],k);
  approachColor(skyUniforms.uTop.value,'top',dt);approachColor(skyUniforms.uUpper.value,'upper',dt);approachColor(skyUniforms.uMid.value,'mid',dt);
  approachColor(skyUniforms.uHorizon.value,'horizon',dt);approachColor(skyUniforms.uHorizonSun.value,'horizonSun',dt);approachColor(skyUniforms.uAnti.value,'anti',dt);
  approachColor(skyUniforms.uGlow.value,'glow',dt);approachColor(skyUniforms.uDisc.value,'disc',dt);
  approachColor(scene.fog.color,'fog',dt);approachColor(oceanUniforms.uColorA.value,'oceanA',dt);approachColor(oceanUniforms.uColorB.value,'oceanB',dt);approachColor(oceanUniforms.uSunColor.value,'glow',dt);
  sunLight.color.lerp(new THREE.Color(moodTarget.sun),k);
  skyUniforms.uSunDir.value.set(-.58,moodLive.elevation,-.82).normalize();
  sunLight.position.copy(skyUniforms.uSunDir.value).multiplyScalar(125);
  paintUniforms.uLightColor.value.copy(sunLight.color);
  paintUniforms.uAmbient.value=moodLive.ambient;
  paintUniforms.uPartyGlow.value=clamp((.96-moodLive.ambient)/.83,0,1);
  sunLight.intensity=moodLive.sunPower;hemi.intensity=moodLive.hemi;
  skyUniforms.uAuroraTime.value=elapsed;
  skyUniforms.uAuroraNight.value=smoothstep(.25,1,moodLive.stars);
  shootingStars.update(elapsed,moodLive.stars,camera,stargazing.active);
  stars.update(elapsed,moodLive.stars,renderer.getPixelRatio()*resolutionScale,stargazing.active);fireflyMat.opacity=clamp((moodLive.stars-.2)*.78,0,.7);
  oceanUniforms.uNight.value=moodLive.stars;
  updatePartyLight();
  celebration.update(elapsed,paintUniforms.uPartyGlow.value);
  fireside.update(elapsed,paintUniforms.uPartyGlow.value);
}
function animate(now,force){
  // A quiet scene should not spend power chasing a 120 Hz display refresh.
  if(!force && (document.hidden || now-lastFrameTime < 1000/60-1))return;
  lastFrameTime=now;
  const rawDt=clock.getDelta();const dt=Math.min(rawDt,.05);elapsed+=dt;
  if(candleFrameCheck){
    candleFrameCheck.maxFrame=Math.max(candleFrameCheck.maxFrame,rawDt*1000);
    if(performance.now()-candleFrameCheck.start>550){
      console.info('Candle transition '+JSON.stringify({maxFrameMs:+candleFrameCheck.maxFrame.toFixed(1),
        newShaderPrograms:renderer.info.programs.length-candleFrameCheck.programs}));
      candleFrameCheck=null;
    }
  }
  updateQuality(rawDt);renderer.info.reset();
  renderer.shadowMap.needsUpdate=elapsed-lastShadowTime>1/15;
  if(renderer.shadowMap.needsUpdate)lastShadowTime=elapsed;
  oceanUniforms.uTime.value=elapsed;
  oceanLife.update(elapsed,moodLive.stars,camera);
  if(inspect&&inspectParams.has('fishStill')){jumpingFish.update(3);jumpingFish.update(3.55);oceanUniforms.uTime.value=3.55;}
  else jumpingFish.update(elapsed);
  stageConfetti.update(elapsed);
  lovePlane.update(inspect&&inspectParams.has('planeStill')?3:elapsed,moodLive.stars);
  paintUniforms.uTime.value=elapsed;
  camera.getWorldPosition(tmp2);
  for(const material of bladeMaterials)material.uniforms.uCam.value.copy(tmp2);
  stoneSkipping.update(dt,playerRig.position,elapsed);
  movePlayer(dt);
  if(multiplayerRequested){updateMultiplayer(dt,now);}
  else if(!stargazing.active&&!bouquetControls.hisView){
    companion.update(dt,playerRig.position,gifts,playerRig.rotation.y);updateHoldingHands(dt);
  }else{
    handAmount=0;
    firstPersonHand.update(joinedHands,0,playerLinkRotation,claspAxis);
    avatar.poseHand(joinedHands,0,playerLinkRotation);companion.poseHand(partnerHand,0,partnerLinkRotation);
  }
  stargazing.update(elapsed);bouquetControls.update(dt);avatar.updateCloth(dt);companion.updateCloth(dt);
  const gestureBusy=stargazing.active||handsLinked()||stoneSkipping.active||companion.throwing;
  avatar.updateGesture(dt,gestureBusy);companion.updateGesture(dt,gestureBusy);
  dandelions.update(elapsed,playerRig.position,moodLive.stars,renderer.getPixelRatio()*resolutionScale);updateNearGrass();updateInteraction();updateMood(dt);updateFireworks(dt);updateRadio(dt);
  gifts.forEach(g=>{if(g.object.visible&&!g.found){g.object.position.y=g.baseY+Math.sin(elapsed*1.25+g.phase)*.09;g.object.rotation.y+=dt*.28;g.glow.intensity=.15+paintUniforms.uPartyGlow.value*1.2;g.haloMat.opacity=.01+paintUniforms.uPartyGlow.value*.025;g.baseMat.emissiveIntensity=.05+paintUniforms.uPartyGlow.value*.12;}});
  if(candleBlownAt>=0){
    const age=elapsed-candleBlownAt;
    candleSmoke.update(inspect&&inspectParams.has('smokePreview')?1.25:age);
    for(const c of candleFlames)c.light.intensity=.32*Math.max(0,1-age/.16);
  }
  candleFlames.forEach(c=>{if(c.flame.visible){c.flame.material.uniforms.time.value=elapsed;
    c.light.intensity=.32*(1+.07*Math.sin(elapsed*5.2+c.phase)+.035*Math.sin(elapsed*8.7+c.phase));}});
  camera.getWorldPosition(insectViewer);
  butterflies.forEach(b=>{
    const t=elapsed*b.speed+b.phase;
    // A drifting figure-eight reads as wandering; a plain circle reads as a machine.
    const x=b.base.x+Math.cos(t)*b.radius+Math.sin(t*.41)*b.radius*.42;
    const z=b.base.z+Math.sin(t*1.73)*b.radius*.55+Math.cos(t*.37)*b.radius*.5;
    const vx=x-b.group.position.x,vz=z-b.group.position.z;
    b.group.position.set(x,terrainHeight(x,z)+b.height+Math.sin(t*2.4)*.4,z);
    if(vx||vz){
      let d=Math.atan2(-vx,-vz)-b.heading;
      d=Math.atan2(Math.sin(d),Math.cos(d));
      b.heading+=d*Math.min(1,dt*6);
      b.bank+=(clamp(d*2.2,-.55,.55)-b.bank)*Math.min(1,dt*5);
    }
    const visibility=insectVisibility(b.group.position.distanceTo(insectViewer),b.rank,12,46);
    b.mat.opacity=b.bodyMat.opacity=visibility;b.group.visible=visibility>.005;
    b.group.rotation.set(0,b.heading,b.bank);
    // Bursts of quick beats broken by short glides, wings resting in a shallow V.
    const glide=.5+.5*Math.sin(t*.6+b.phase);
    const flap=Math.sin(elapsed*(9+b.speed*12)+b.phase)*(.32+glide*.72);
    b.left.rotation.z=.16+flap;b.right.rotation.z=-.16-flap;
  });
  updateClouds();
  sceneContext.update();
  // Each firefly wanders around its own anchor. Spinning the whole cloud about
  // the origin, as this used to, would drag them away from their flowers.
  if(fireflyMat.opacity>.01){
    const fp=fireflyGeo.attributes.position;
    for(let i=0;i<fp.count;i++){
      const bx=fireflyBase[i*4],by=fireflyBase[i*4+1],bz=fireflyBase[i*4+2],ph=fireflyBase[i*4+3];
      fp.setXYZ(i,
        bx+Math.sin(elapsed*.42+ph)*.55,
        by+Math.sin(elapsed*.63+ph*1.7)*.22,
        bz+Math.cos(elapsed*.35+ph*1.3)*.55);
    }
    const fc=fireflyGeo.attributes.color;
    for(let i=0;i<fp.count;i++){
      const ph=fireflyBase[i*4+3];
      const distance=Math.hypot(fp.getX(i)-insectViewer.x,fp.getY(i)-insectViewer.y,fp.getZ(i)-insectViewer.z);
      const visibility=insectVisibility(distance,insectRank(i),10,40,.16);
      const tw=(.22+.78*Math.pow(Math.max(Math.sin(elapsed*1.5+ph*3.1),0),1.6))*visibility;
      const warm=.78+.22*Math.sin(ph*2.3);
      fc.setXYZ(i,tw,tw*(.80+.13*warm),tw*(.30+.22*warm));
    }
    // Reuse eight inexpensive surface fills, strongest only close to the viewer.
    // Distance fade makes changes at the selection boundary inconspicuous.
    for(const candidate of poolCandidates){
      const i=candidate.i;
      candidate.d=(fp.getX(i)-playerRig.position.x)**2+(fp.getZ(i)-playerRig.position.z)**2;
    }
    poolCandidates.sort((a,b)=>a.d-b.d);
    paintUniforms.uFireflyPools.value.forEach((pool,k)=>{
      const {i,d}=poolCandidates[k],x=fp.getX(i),z=fp.getZ(i),ground=terrainHeight(x,z);
      const low=1-smoothstep(.7,2.2,fp.getY(i)-ground);
      pool.set(x,ground,z,fc.getX(i)*fireflyMat.opacity*low*(1-smoothstep(4,100,d)));
    });
    fp.needsUpdate=true;fc.needsUpdate=true;
  }
  if(fireflyMat.opacity<=.01) paintUniforms.uFireflyPools.value.forEach(pool=>pool.w=0);
  sky.position.copy(camera.getWorldPosition(tmp2));
  chatBubbles.update();
  cashDash.update();
  hostControls?.update();
  chatLog.update();
  expressionControls.update();
  const renderStart=performance.now();
  const gpuQuery=beginGpuSample();
  renderer.setRenderTarget(sceneTarget);
  renderer.clear();
  renderer.render(scene,camera);
  paintUniforms.uShadowMap.value=sunLight.shadow.map?.texture;
  paintUniforms.uShadowReady.value=sunLight.shadow.map?1:0;
  renderBloom();
  // Add only the celebration bulbs and their round halos after extracting bloom.
  // Preserve scene depth so trees, poles and other foreground objects still occlude them.
  const savedLayers=camera.layers.mask,savedAutoClear=renderer.autoClear;
  camera.layers.set(1);renderer.autoClear=false;
  renderer.setRenderTarget(sceneTarget);renderer.render(scene,camera);
  camera.layers.mask=savedLayers;renderer.autoClear=savedAutoClear;
  renderer.setRenderTarget(null);
  postMaterial.uniforms.uTime.value=elapsed;
  postMaterial.uniforms.uExposure.value=moodLive.exposure;
  postMaterial.uniforms.uNight.value=moodLive.stars;
  renderer.render(postScene,postCamera);
  cashRewards.update();
  if(gpuQuery){gl.endQuery(gpuTimer.TIME_ELAPSED_EXT);gpuQueries.push(gpuQuery);}
  cpuMs=lerp(cpuMs,performance.now()-renderStart,.1);
}
renderer.setAnimationLoop(animate);
// Headless capture environments never run requestAnimationFrame, so inspection
// needs a way to step the scene by hand.
if(inspect)window.__step=()=>animate(performance.now(),true);
if(inspect){window.__cash=cashRewards;window.__net=()=>network;window.__camY=()=>{const v=new THREE.Vector3();camera.getWorldPosition(v);return {camera:+v.y.toFixed(3),ground:+terrainHeight(v.x,v.z).toFixed(3)};};window.__finale=()=>{finalePendingUntil=elapsed+8;launchFireworks(7);};window.__radio=radio;window.__radioNext=()=>requestSong(radio.index??0,((radio.index??0)+1)%radio.count);}

window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
  resizeTargets();
});

/* -------------------------------------------------------------------------- */
/* Welcome                                                                    */
/* -------------------------------------------------------------------------- */

// "Come in" appears only when every texture and font has loaded, the scene's
// shaders are compiled, the connection is ready and the countdown has ended.
const loadingLines=['keeping a secret…','folding the clouds…','teaching the stars your name…','saving you the softest light…','almost there…'];
let fontsReady=false,gpuReady=false,entryReady=false,shownProgress=0;
Promise.race([
  Promise.all(['300 40px "Fraunces"','700 20px "Dancing Script"'].map(font=>document.fonts?.load(font))),
  new Promise(resolve=>setTimeout(resolve,8000)) // Offline fonts must never lock her out.
]).catch(()=>{}).finally(()=>{fontsReady=true;});
renderer.compileAsync(scene,camera).catch(()=>{}).finally(()=>{renderer.render(scene,camera);gpuReady=true;});
// Pre-warm everything entering needs while the welcome still shows, so the click
// only starts what is already built: the sound engine (silent until her click),
// the radio's players (no song yet) and every texture, including off-screen ones.
let prewarmed=false;
function prewarmEntry(){
  if(prewarmed)return;prewarmed=true;
  audio.init();
  if(!inspect||inspectParams.has('radio'))radio.start();
  const upload=value=>{if(value?.isTexture)renderer.initTexture(value);};
  scene.traverse(object=>{
    for(const material of [object.material].flat()){
      if(!material)continue;
      for(const key in material)upload(material[key]);
      for(const uniform of Object.values(material.uniforms||{}))upload(uniform?.value);
    }
  });
}
const entryTimer=setInterval(()=>{
  const textures=assetLoad.total?assetLoad.loaded/assetLoad.total:1;
  const progress=.3+.4*textures+.12*fontsReady+.18*gpuReady,loaded=progress>=.999;
  shownProgress+=(progress-shownProgress)*.35;
  $('#load-bar').style.width=`${Math.min(100,shownProgress*100)}%`;
  $('#load-copy').textContent=loadingLines[Math.min(loadingLines.length-1,Math.floor(shownProgress*loadingLines.length))];
  // The inline welcome script owns the countdown, so it runs before this code loads.
  if(loaded){$('.welcome-card').classList.add('loaded');prewarmEntry();}
  entryReady=loaded&&(window.welcomeTimer?.over??true);
  $('#enter').disabled=!entryReady||!networkReady;$('#enter').classList.toggle('ready',entryReady);
  if(entryReady)clearInterval(entryTimer);
},200);

$('#enter').addEventListener('click',()=>{
  if(!networkReady||!entryReady)return;
  document.title='Our Little Island';
  // Fade to black, swap the welcome for the island, then fade in from black.
  const fade=$('#scene-fade');fade.classList.add('dark');
  setTimeout(()=>{$('#welcome').classList.add('gone','instant');fade.classList.remove('dark');},750);
  playing=true;document.body.classList.add('playing');prewarmEntry();audio.resume();
  if(!inspect||inspectParams.has('radio'))radio.begin();
  setTimeout(()=>requestPointerLock(),300);
  setTimeout(()=>toast(isPassenger?'LOOK AROUND · HOLD R TO POINT · SPACE TO CHEER':'MAKE A WISH AT THE BIRTHDAY CAKE'),1300);
});

if(CONFIG.fromName) $('.brand small').textContent=CONFIG.fromName;
if(COIN_MODE)$('.treasure-card').setAttribute('aria-label','Collected coins');
$('#gift-value').textContent=formatCash(0);
setMood(CONFIG.startingMood);


function poseOf(object,moving=false){return {time:performance.now(),position:object.position.toArray(),yaw:object.rotation.y,pitch:cameraPivot.rotation.x,moving,running:!!(keys.ShiftLeft||keys.ShiftRight),lying:Math.abs(object.rotation.x)>1};}
function updateMultiplayer(dt,now){
  if(isPassenger){updatePassenger(dt,now);return;}
  const auto=!!network?.autopilot;
  if(auto!==wasAutopilot){companion.resumeAutopilot();remoteMotion.reset(poseOf(companion.anchor));}
  wasAutopilot=auto;
  if(auto){
    companion.anchor.visible=true;
    if(!stargazing.active){companion.update(dt,playerRig.position,gifts,playerRig.rotation.y,companionMode&&network?.remoteLive?lookMotion.sample(now):null);updateHoldingHands(dt);}
    else if(companionMode)companion.updateRestingLook(dt,network?.remoteLive?lookMotion.sample(now):null);
  }else{
    companion.anchor.visible=!!remotePose&&(!isIshiee||!!network?.remoteLive);
    const displayedPose=remoteMotion.sample(now);
    if(displayedPose)companion.setNetworkPose(displayedPose,dt,true);
    const linked=network?.snapshot.world.holding&&network.remoteLive;
    handAmount+=(Number(!!linked)-handAmount)*(1-Math.exp(-dt*6));
    if(linked){
      joinedHands.copy(playerRig.position).lerp(companion.anchor.position,.5);joinedHands.y+=1.0;
      partnerHand.copy(joinedHands);claspAxis.subVectors(companion.anchor.position,playerRig.position).normalize();
      claspRotation.setFromUnitVectors(ringNormal,claspAxis);partnerLinkRotation.copy(claspRotation).multiply(partnerLinkTurn);playerLinkRotation.copy(claspRotation).multiply(playerLinkTurn);
    }
    firstPersonHand.update(joinedHands,CONFIG.thirdPerson?0:handAmount,playerLinkRotation,claspAxis);
    avatar.poseHand(joinedHands,CONFIG.thirdPerson?handAmount:0,playerLinkRotation);companion.poseHand(partnerHand,handAmount,partnerLinkRotation);
    handInteraction.prompt=linked?'let go':network?.snapshot.world.handRequest&&network.snapshot.world.handRequest!==islandUser?'accept hand holding':'offer your hand';
  }
  if(networkReady&&now-lastNetworkFrame>=66){
    lastNetworkFrame=now;
    const moving=!!(document.pointerLockElement===renderer.domElement&&(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD));
    network.sendPose(poseOf(playerRig,moving),auto?{...poseOf(companion.anchor,false),...companion.motion}:undefined);
  }
}
if(multiplayerRequested){
  const note=document.createElement('p');note.className='connection-note';$('.welcome-card').append(note);
  network=connectIsland({
onStatus(ready,text){expressionControls.setConnected(ready);networkReady=ready;note.textContent=text;$('#enter').disabled=!ready||!entryReady;if(!ready){Object.keys(keys).forEach(k=>keys[k]=false);}},
    onPose(user,pose){
      if(isPassenger&&user===islandUser){ownPose=pose;ownMotion.push(pose,performance.now());}
      else if(user!==islandUser){remotePose=pose;remoteMotion.push(pose,performance.now());}
    },
    onLook(look){lookMotion.push({...look,position:[0,0,0],lying:false},performance.now());},
    onEvent(message){
      applyingNetwork=true;
      const e=message.event;
      if(e.type==='chat')chatBubbles.show(message.actor,e.text);
      if(e.type==='gesture'&&message.actor!==islandUser)applyGesture(message.actor,e.value);
      if(e.type==='cheer'&&companionMode&&!isIshiee)companion.triggerCheer();
      if(e.type==='fireworks'&&e.pose){setMood('night');fireworks.launch(new THREE.Vector3(...e.pose.position),e.pose.yaw,e.amount,{finale:takeFinale()});}
      if(e.type==='stone')stoneSkipping.receiveThrow(e);
      if(e.type==='ink')stargazing.receiveInk(e.points);
      applyingNetwork=false;
    },
    onSnapshot(s){
      applyingNetwork=true;
      for(const user of ['ISHIEE','MOSHIEE']){
        const remaining=expressionRemaining(s.world.expressionUntil?.[user],s.serverTime||Date.now());
        applyExpression(user,remaining?s.world.expressions?.[user]||'normal':'normal',remaining);
      }
      expressionControls.sync(expressionValues,expressionDeadlines);expressionControls.setConnected(true);
      if(!s.welcome&&s.event?.type==='expression')showExpressionBubble(s.actor,expressionValues[s.actor],expressionRemaining(expressionDeadlines[s.actor]));
      bouquetControls.sync(s.world.bouquet,s.welcome);
      radio.play(s.world.radio||0);
      if(!s.online.ISHIEE)lookMotion.reset();
      if(s.welcome&&s.look)lookMotion.reset({...s.look,position:[0,0,0],lying:false});
      if(isPassenger&&(s.welcome||!!s.online.MOSHIEE!==remoteWasOnline)){ownPose=s.poses.ISHIEE||ownPose;ownMotion.reset(ownPose);}
      if(s.welcome){
        if(stargazing.active)stargazing.leave({immediate:true});
        if(s.startedAt)elapsed=Math.max(0,(s.serverTime-s.startedAt)/1000);
        const pose=s.poses[islandUser];
        if(pose){playerRig.position.fromArray(pose.position);playerRig.rotation.set(0,pose.yaw,0);cameraPivot.rotation.x=CONFIG.thirdPerson?pose.pitch:clampWalkPitch(pose.pitch);}
        else if(isIshiee){playerRig.position.set(-5.9,terrainHeight(-5.9,-10.1)+STAGE_HEIGHT,-10.1);playerRig.rotation.y=Math.PI;}
      }
      const other=isIshiee?'MOSHIEE':'ISHIEE';
      // Room snapshots also arrive for gifts, heartbeats, and sky changes.
      // Only presence transitions seed motion; normal packets own the timeline.
      if(s.welcome||!!s.online[other]!==remoteWasOnline){
        remotePose=s.poses[other]||remotePose;
        remoteMotion.reset(remotePose);
        if(s.welcome&&remotePose)companion.setNetworkPose(remotePose,0,true);
      }
      remoteWasOnline=!!s.online[other];
      const worldMood=s.world.mood==='sunset'&&!CONFIG.sunset?'night':s.world.mood;
      if(worldMood!==currentMood)setMood(worldMood);
      for(const i of s.world.gifts)if(gifts[i]){
        const fresh=!s.welcome&&s.event?.type==='gift'&&s.event.index===i&&playing;
        collectGift(gifts[i],{animate:fresh,showNote:fresh&&s.actor===islandUser});
      }
      if(s.world.candles&&candlesLit)blowCandles({confetti:!s.welcome&&s.event?.type==='candles'});
      cashDash.sync(s);
      if(s.world.hats)interactive.find(i=>i.type==='hat')?.action();
      if(s.event?.type==='hand')toast(s.world.holding?'HOLDING HANDS · H TO LET GO':s.world.handRequest===islandUser?'HAND OFFERED · WAITING FOR YOUR PARTNER':'YOUR PARTNER OFFERS A HAND · PRESS H NEARBY');
      if(s.event?.type==='candles'&&s.actor===islandUser)setTimeout(()=>network.event({type:'fireworks',amount:7}),650);
      applyingNetwork=false;
    }
  });
}

if(inspect)Object.defineProperty(window,'__multiplayerState',{get:()=>({
  user:islandUser,ready:networkReady,autopilot:network?.autopilot,online:network?.snapshot.online,
  player:poseOf(playerRig),remote:poseOf(companion.anchor),remoteVisible:companion.anchor.visible,
  remoteMeshes:(()=>{let n=0;companion.anchor.traverse(o=>{if(o.isMesh)n++;});return n;})(),
  passenger:isPassenger,ownPose,gesture:companion.gesture,holding:companion.holding,stargazing:stargazing.active,candlesLit,foundCount
})});


// Companion-view mode: camera translation follows MOSHIEE's locally simulated
// male companion. Only camera orientation and expressive input originate here.
function updatePassenger(dt,now){
  const pose=ownMotion.sample(now);
  if(pose){
    playerRig.position.fromArray(pose.position);
    cameraPivot.position.y=pose.lying?.35:CONFIG.hisEyeHeight;
    if(pose.lying)playerRig.position.z+=1.70;
    if(pose.lying&&!passengerLying)cameraPivot.rotation.x=1.22;
    if(!pose.lying&&passengerLying)cameraPivot.rotation.x=-.12;
    passengerLying=pose.lying;
  }
  const peer=remoteMotion.sample(now);
  companion.anchor.visible=!!peer&&!!network?.remoteLive;
  if(peer)companion.setNetworkPose(peer,dt,true);
  avatar.root.visible=false;
  const linked=!!(pose?.holding&&pose?.holdReady&&!pose?.lying&&network?.remoteLive);
  handAmount+=(Number(linked)-handAmount)*(1-Math.exp(-dt*6));
  joinedHands.copy(playerRig.position).lerp(companion.anchor.position,.5);joinedHands.y+=1;
  firstPersonHand.update(joinedHands,handAmount);
  pointBlend+=(Number(passengerPointing&&!passengerLying&&!bouquetControls.shown)-pointBlend)*(1-Math.exp(-dt*10));
  camera.getWorldDirection(pointTarget);pointTarget.multiplyScalar(1.4).add(playerRig.position);pointTarget.y+=1.36;
  pointingHand.update(pointTarget,pointBlend);
  if(networkReady&&now-lastNetworkFrame>=66){
    lastNetworkFrame=now;
    network.sendLook({time:performance.now(),yaw:playerRig.rotation.y,pitch:cameraPivot.rotation.x,pointing:passengerPointing&&!bouquetControls.shown});
  }
}
if(isPassenger){
  document.body.classList.add('companion-view');
  $('#controls').innerHTML='<div><b>Mouse</b> look around <i>·</i> <b>Hold R</b> point <i>·</i> <b>Space</b> cheer / jump</div><div><b>/</b> chat <i>·</i> Following MOSHIEE <i>·</i> <b>M</b> sound <i>·</i> <b>Esc</b> release mouse</div>';
  $('.welcome-script').textContent='Right beside her, wherever she goes.';
}

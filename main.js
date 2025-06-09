import * as THREE from 'three';
import { gsap } from "gsap";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// === SCENA BASE ===
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("medusa-root");
  const rootElement = container;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(3, 3, 6);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ antialias: false }); // Disabilita antialias
  renderer.setPixelRatio(window.devicePixelRatio / 2); // Riduci la risoluzione
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.frustumCulled = true;
  let magnetActive = true;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);
  controls.update();
  const zonePointClouds = [];
  let selectedZone = null;
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  scene.add(new THREE.DirectionalLight(0xffffff, 1));

  // === COLORI ===
  const mainColorPalette = [
    new THREE.Color(0x4682EB),
    new THREE.Color(0x4E13EB),
    new THREE.Color(0x131EEB),
    new THREE.Color(0x13A6EB),
    new THREE.Color(0xA73FEB)
  ];

  const duplicateColorPalette = [
    new THREE.Color(0xAD46EB),
    new THREE.Color(0xEB137C),
    new THREE.Color(0xE113EB),
    new THREE.Color(0x5313EB),
    new THREE.Color(0xEB413B)
  ];

  const DUPLICATE_RATIO = 0.4;

  // === CONFIGURAZIONE MODELLI ===
  const modelConfigs = [
    {
      url: 'https://provaxbottone.netlify.app/mod/testa.glb',
      points: 10000,
      baseColor: new THREE.Color(0x13A6EB),
      duplicateColor: new THREE.Color(0xEB137C),
      scale: 10                           // scala personalizzata
    },
    {
      url: 'https://provaxbottone.netlify.app/mod/CALOTTA.glb',
      points: 50000,
      baseColor: new THREE.Color(0x13A6EB),
      duplicateColor: new THREE.Color(0xEB137C),
      scale: 10                           // scala personalizzata
    },
    {
      url: 'https://provaxbottone.netlify.app/mod/testa2.glb',
      points: 18000,
      baseColor: new THREE.Color(0xA73FEB),
      duplicateColor: new THREE.Color(0xEB413B),
      scale: 10                            // scala personalizzata
    },
  ];

  // === CONFIGURAZIONE UNICA PER TUTTI I MODELLI TNT ===
  const tntModels = [
    'https://provaxbottone.netlify.app/mod/tnt_0.glb',
    'https://provaxbottone.netlify.app/mod/tnt_2.glb',
    'https://provaxbottone.netlify.app/mod/tnt_3.glb',
    'https://provaxbottone.netlify.app/mod/tnt_4.glb',
    'https://provaxbottone.netlify.app/mod/tnt_5.glb',
    'https://provaxbottone.netlify.app/mod/tnt_6.glb',
    'https://provaxbottone.netlify.app/mod/tnt_7.glb',
    'https://provaxbottone.netlify.app/mod/tnt_8.glb',
    'https://provaxbottone.netlify.app/mod/tnt_1.glb'
   


  ];

  const tntConfig = {
    points: 10000,
    baseColor: new THREE.Color(0x4682EB),
    duplicateColor: new THREE.Color(0xAD46EB),
    scale:10
  };
  //________—_____————__——_—————————————————————————————__///

  const pointClouds = [];

  // === LOADER ===
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(dracoLoader);

  // === INTERAZIONE MOUSE ===
  const mouse = new THREE.Vector2();
  let mouse3D = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.15;
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // piano z = 0
  const planeIntersectPoint = new THREE.Vector3();

  /////////////////////////////////SCANSIONE MODELLO CURSORE///////////////////////////////////////////////////

  window.addEventListener('mousemove', (e) => {
    magnetActive = true;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, planeIntersectPoint);

    if (planeIntersectPoint) {
      mouse3D.copy(planeIntersectPoint);  // Aggiorniamo la posizione 3D del mouse
    }
  });


  ////////////////////////////////////////////////////////////////////////////////////

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /////////////////////////////////LOADMODEL///////////////////////////////////////////////////


  function loadModelWithColors(url, baseColor, duplicateColor, totalPoints, scale = 2) {
    loader.load(url, (gltf) => {
      gltf.scene.scale.set(scale, scale, scale);

  // Rendi invisibile tutta la scena del modello (incluso mesh/materiali)
  gltf.scene.traverse(obj => {
    if (obj.isMesh) {
      obj.visible = false;
      obj.material.transparent = true;
      obj.material.opacity = 0;
    }
  });

  // Aggiungi comunque alla scena per usare posizione, bounding box, ecc.
  scene.add(gltf.scene);

      scene.add(gltf.scene);

      // Trova la mesh
      const mesh = gltf.scene.getObjectByProperty('type', 'Mesh');
      if (!mesh) {
        console.warn(`Nessun oggetto Mesh trovato nel modello: ${url}`);
        return;
      }


    // Creiamo la nube di punti del modello
  createPointCloud(mesh, baseColor, totalPoints);
    const dupCount = Math.floor(totalPoints * DUPLICATE_RATIO);
      createPointCloud(mesh, duplicateColor, dupCount, 1.5, 2);

      // Calcolo bounding box per posizionare la nube fluttuante
      const bbox = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      bbox.getCenter(center);
      bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) * scale;

    });
  }

  ////////////////////////////////////////////////////////////////////////
  /**
   * Crea una zona cliccabile rappresentata da una nuvola di punti “emitter”
   *
   * @param {THREE.Mesh} mesh             – Mesh di riferimento su cui campionare il centro
   * @param {object} options              – Oggetto di configurazione
   * @param {number} options.count        – Numero di punti nella nuvola (es. 500 → 5000)
   * @param {number} options.radius       – Raggio della nuvola intorno al centro (es. 0.05 → 0.5)
   * @param {number} options.size         – Dimensione di ogni punto (es. 0.01 → 0.1)
   * @param {THREE.Color} options.color   – Colore base (es. 0x00ffff per blu elettrico)
   * @param {number} options.opacity      – Opacità del materiale (0.0 → 1.0)
   * @param {number} options.emission     – Intensità di additive blending (es. 0.2 → 1.0)
   * @param {number} options.oscAmp       – Ampiezza massima oscillazione (0.01 → 0.1)
   * @param {number} options.oscFreq      – Velocità oscillazione (0.1 → 1.0)
   */


  // === POINT CLOUD ===
  function createPointCloud(mesh, color, totalPoints, ampScale = 1, speedScale = 1) {
    const sampler = new MeshSurfaceSampler(mesh).build();
    const tempVec = new THREE.Vector3();

    const positions = [], basePositions = [], colors = [];
    const ampX = [], ampY = [], ampZ = [];
    const freqX = [], freqY = [], freqZ = [];
    const phaseX = [], phaseY = [], phaseZ = [];
    const offsets = [];

    const isDetached = [];
    const targetPositions = [];
    const detachmentTime = [];
    const attractionStrengthArr = [];

    for (let i = 0; i < totalPoints; i++) {
      sampler.sample(tempVec);
      mesh.localToWorld(tempVec);

      basePositions.push(tempVec.x, tempVec.y, tempVec.z);
      positions.push(tempVec.x, tempVec.y, tempVec.z);
      colors.push(color.r, color.g, color.b);

      ampX.push((Math.random() * 0.1 + 0.05) * ampScale);
      ampY.push((Math.random() * 0.1 + 0.05) * ampScale);
      ampZ.push((Math.random() * 0.1 + 0.05) * ampScale);

      freqX.push((Math.random() * 3 + 1) * speedScale);
      freqY.push((Math.random() * 3 + 1) * speedScale);
      freqZ.push((Math.random() * 3 + 1) * speedScale);

      phaseX.push(Math.random() * Math.PI * 2);
      phaseY.push(Math.random() * Math.PI * 2);
      phaseZ.push(Math.random() * Math.PI * 2);

      offsets.push(new THREE.Vector3());

      isDetached.push(false);
      targetPositions.push(new THREE.Vector3(tempVec.x, tempVec.y, tempVec.z));
      detachmentTime.push(0);
      attractionStrengthArr.push(0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.005 * ampScale,
    vertexColors: true,
    sizeAttenuation:true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending, // 💥 Glow effect
    depthWrite: false                // evita z-fighting
  });


    const points = new THREE.Points(geometry, material);
    scene.add(points);

    pointClouds.push({
      geometry,
      basePositions,
      ampX, ampY, ampZ,
      freqX, freqY, freqZ,
      phaseX, phaseY, phaseZ,
      offsets,
      material,
      isDetached,
      targetPositions,
      detachmentTime,
      attractionStrengthArr
    });
  }
  //vale per i modelli/7/

  /*function createFloatingCloud({
    count = 8000,
    areaSize = 30,
    minSize = 0.08,
    maxSize = 0.15,
    palette = mainColorPalette
  } = {}) {
    const positions = [];
    const colors = [];
    const sizes = new Float32Array(count);
    const amp = new Float32Array(count);
    const freq = new Float32Array(count);
    const phase = new Float32Array(count);
    const basePositions = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * areaSize;
      const y = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;
      positions.push(x, y, z);
      basePositions.push(new THREE.Vector3(x, y, z));

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors.push(col.r, col.g, col.b);

      sizes[i] = minSize + Math.random() * (maxSize - minSize);
      amp[i] = 0.2 + Math.random() * 0.4; // Ampiezza del movimento
      freq[i] = 0.5 + Math.random() * 1.5; // Frequenza del movimento
      phase[i] = Math.random() * Math.PI * 2; // Fase iniziale
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // ✅ Texture circolare dinamica via canvas
    const discTexture = new THREE.CanvasTexture(generateCircleTexture());
    discTexture.minFilter = THREE.LinearFilter;
    discTexture.magFilter = THREE.LinearFilter;
    discTexture.generateMipmaps = false;

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      map: discTexture,
      alphaTest: 0.01,
      depthWrite: false
    });

    const cloud = new THREE.Points(geometry, material);
    scene.add(cloud);

    pointClouds.push({
      geometry,
      material,
      basePositions,
      amp,
      freq,
      phase,
      userData: { isFloatingCloud: true }
    });

    // Aggiungi animazione per il movimento dei punti
    function animateFloatingCloud() {
      const positions = geometry.attributes.position.array;

      for (let i = 0; i < count; i++) {
        const basePos = basePositions[i];
        const time = performance.now() * 0.0002; // Riduci la velocità del tempo

        // Movimento sinusoidale indipendente per ogni punto
        positions[i * 3] = basePos.x + Math.sin(time * freq[i] + phase[i]) * amp[i] * 2; // Oscillazione lenta lungo X
        positions[i * 3 + 1] = basePos.y + Math.cos(time * freq[i] + phase[i]) * amp[i] * 2; // Oscillazione lenta lungo Y
        positions[i * 3 + 2] = basePos.z + Math.sin(time * freq[i] + phase[i]) * amp[i]; // Oscillazione lenta lungo Z
      }

      geometry.attributes.position.needsUpdate = true; // Segnala che la posizione è stata aggiornata
      requestAnimationFrame(animateFloatingCloud); // Continua l'animazione
    }

    animateFloatingCloud(); // Avvia l'animazione
  }

  createFloatingCloud({
    count: 2000,
    areaSize: 30,
    minSize: 0.08,
    maxSize: 0.15,
    palette: mainColorPalette
  });

  function generateCircleTexture(size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1.0, 'rgba(75, 59, 196, 0)');

    ctx.fillStyle = gradient;
    ctx.fill();

    return canvas;
  }*/

  ////////MAGNETE//////////
  function deformModelWithMouse({
    attractionStrength = 0.009,
    influenceRadius = 0.9,
    returnSpeed = 0.01
  } = {}) {

    if (!magnetActive) return; 
    const t = performance.now() / 1000;

    pointClouds.forEach((pc) => {
      // Skip se non è un modello con basePositions in formato Float32Array
      if (!pc.basePositions || typeof pc.basePositions[0] !== 'number') return;
    

      const positions = pc.geometry.attributes.position.array;
      const basePositions = pc.basePositions;
      const targetPositions = pc.targetPositions;
      const isDetached = pc.isDetached;
      const attractionStrengthArr = pc.attractionStrengthArr;

      for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;

        const bx = basePositions[i];
        const by = basePositions[i + 1];
        const bz = basePositions[i + 2];

        const harmonic = new THREE.Vector3(
          bx + Math.sin(pc.freqX[idx] * t + pc.phaseX[idx]) * pc.ampX[idx],
          by + Math.sin(pc.freqY[idx] * t + pc.phaseY[idx]) * pc.ampY[idx],
          bz + Math.sin(pc.freqZ[idx] * t + pc.phaseZ[idx]) * pc.ampZ[idx]
        );

        const pos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const dist = pos.distanceTo(mouse3D);

        if (dist < influenceRadius) {
          const influence = Math.max(0, 1 - dist / influenceRadius);
          targetPositions[idx] = mouse3D.clone();
          attractionStrengthArr[idx] = influence * attractionStrength;

          const pull = new THREE.Vector3().subVectors(targetPositions[idx], pos)
            .normalize().multiplyScalar(attractionStrengthArr[idx]);
          pos.add(pull);
        } else {
          if (!isDetached[idx]) {
            targetPositions[idx] = harmonic.clone();
          }

          const returnVec = new THREE.Vector3().subVectors(harmonic, pos).multiplyScalar(returnSpeed);
          pos.add(returnVec);
        }

        positions[i] = pos.x;
        positions[i + 1] = pos.y;
        positions[i + 2] = pos.z;
      }

      pc.geometry.attributes.position.needsUpdate = true;
    });
  }
  /////////////////////////
  // Carica i modelli principali
  modelConfigs.forEach(config => {
    loadModelWithColors(config.url, config.baseColor, config.duplicateColor, config.points, config.scale);
  });

  // Carica i modelli tentacolari
  tntModels.forEach(url => {
    loadModelWithColors(url, tntConfig.baseColor, tntConfig.duplicateColor, tntConfig.points, tntConfig.scale);
  });
  /////////////////////////////////

  const modules = []; // Array per contenere le mesh dei moduli principali

  // Carica i moduli e aggiungi solo le mesh
  loader.load('mod/CALOTTA.glb', (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        modules.push(child); // Aggiungi solo le mesh
        child.visible = false;
      }
    });
    scene.add(gltf.scene);
  });

  loader.load('mod/testa.glb', (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        modules.push(child); // Aggiungi solo le mesh
        child.visible = false;
      }
    });
    scene.add(gltf.scene);
  });

  tntModels.forEach((url) => {
    loader.load(url, (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          modules.push(child); // Aggiungi solo le mesh
          child.visible = false;
        }
      });
      scene.add(gltf.scene);
    });
  });

  let pointCount = 20000; // Numero iniziale di punti

  window.addEventListener('wheel', (e) => {
    const delta = e.deltaY > 0 ? 1000 : -1000; // Aumenta o diminuisci i punti
    pointCount = Math.max(5000, pointCount + delta); // Riduci il numero minimo di punti
    pointCount = Math.min(5000, pointCount); // Limita il numero massimo di punti
  });


  // Funzione per aggiornare i punti della noise cloud con movimento indipendente
  function updateNoiseCloud(mesh, newPointCount) {
    const sampler = new MeshSurfaceSampler(mesh).build();
    const tempVec = new THREE.Vector3();

    let positions = [];
    let colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < newPointCount; i++) {
      sampler.sample(tempVec);
      mesh.localToWorld(tempVec);

      // Movimento indipendente basato su oscillazioni sinusoidali
      tempVec.x += Math.sin(i * 0.1 + performance.now() * 0.001) * 5; // Oscillazione lungo X
      tempVec.y += Math.cos(i * 0.1 + performance.now() * 0.001) * 0.5; // Oscillazione lungo Y
      tempVec.z += Math.sin(i * 0.2 + performance.now() * 0.001) * 0.3; // Oscillazione lungo Z

      positions.push(tempVec.x, tempVec.y, tempVec.z);

      // Cambia dinamicamente il colore dei punti
      color.setHSL((i / newPointCount + performance.now() * 0.0001) % 1, 0.7, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); // Aggiungi colori dinamici
    mesh.geometry = geometry;
  }

  // Funzione di animazione per aggiornare continuamente la noise cloud
  function animateNoiseCloud() {
    modules.forEach(mesh => {
      if (mesh.userData.isNoiseCloud) {
        updateNoiseCloud(mesh, 20000); // Aggiorna i punti della noise cloud
      }
    });

    requestAnimationFrame(animateNoiseCloud); // Continua l'animazione
  }

  // Avvia l'animazione della noise cloud
  animateNoiseCloud();


  function animateJellyMovement(pointCloud, time) {
    if (!pointCloud.geometry || !pointCloud.geometry.attributes.position) {
      console.warn("Point cloud senza geometria valida:", pointCloud.name);
      return;
    }

    const positionAttribute = pointCloud.geometry.attributes.position;
    const array = positionAttribute.array;

    for (let i = 0; i < array.length; i += 3) {
      const jellyWiggle = 0.2 * Math.sin(time * 2 + i * 0.1);
      array[i] += 0.002*jellyWiggle;     // x
      array[i + 1] += 0.0015*jellyWiggle; // y
      array[i + 2] += 0.0001 * Math.cos(time + i * 0.2); // z
    }

    positionAttribute.needsUpdate = true;
  }

  let lastUpdate = 0;
  function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() / 1000;
    deformModelWithMouse();
    if (time - lastUpdate <16) { // Aggiorna ogni ~30 FPS
      pointClouds.forEach((pointCloud) => {
        animateJellyMovement(pointCloud, time);
      });
      lastUpdate = time;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // SUONO SUONO SUONO SUONO SUONO SUONO SUONO SUONO// SUONO SUONO SUONO SUONO SUONO SUONO SUONO SUONO
  let audioContext;
  let gainNode;
  let oscillator;
  let delayNode; // Nodo per il delay
  let convolver; // Nodo per il riverbero
  let patternInterval; // Per gestire il loop del pattern

  // Scala araba in La minore
  const arabicScale = [0, 1, 4, 5, 7, 8, 11]; // Intervalli in semitoni
  const baseNote = 220; // Nota base (La3)
  const scaleNotes = arabicScale.map(semitone => baseNote * Math.pow(2, semitone / 12));

  // Funzione per generare un impulso di riverbero (aumentato)
  function generateReverbImpulse(audioContext, duration = 3.0, decay = 2.0) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }

    return impulse;
  }
  // Funzione per applicare un envelope ADSR
  function applyADSR(gainNode, attack = 1.0, decay = 0.5, sustain = 0.2, release = 4.0) {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now); // Inizio a 0
    gainNode.gain.linearRampToValueAtTime(0.5, now + attack); // Attacco con volume massimo ridotto
    gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay); // Decadimento
    gainNode.gain.setTargetAtTime(0, now + attack + decay + sustain, release); // Rilascio lungo
  }


  function playMicroPattern(scaleNotes, interval = 200, duration = 5000) {
    if (!audioContext || !oscillator || !gainNode) {
      console.error("AudioContext, Oscillator o GainNode non inizializzati.");
      return;
    }

    let noteIndex = 0;

    // Cancella eventuali pattern precedenti
    if (patternInterval) {
      clearInterval(patternInterval);
    }

    // Avvia un nuovo pattern
    patternInterval = setInterval(() => {
      const frequency = scaleNotes[noteIndex % scaleNotes.length]; // Cicla attraverso la scala
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      // Applica un breve envelope ADSR per ogni nota
      applyADSR(gainNode, 0.05, 0.1, 0.2, 0.3);

      noteIndex++;
    }, interval);

    // Imposta un timeout per fermare il pattern
    setTimeout(() => {
      clearInterval(patternInterval);
      patternInterval = null;

      // Applica un rilascio morbido al suono
      if (gainNode) {
        applyADSR(gainNode, 0, 0, 0.2, 1.0); // Solo rilascio lungo
      }
    }, duration);
  }
  // Funzione per suonare una nota con timeout
  function playNoteWithTimeout(frequency) {
    if (!audioContext || !gainNode || !oscillator) return;

    // Cambia la frequenza dell'oscillatore
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Applica un envelope ADSR
    applyADSR(gainNode, 0.1, 0.2, 0.3, 0.5); // Envelope breve

    // Imposta un timeout per fermare il suono dopo 3 secondi
    setTimeout(() => {
      if (gainNode) {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.5); // Rilascio morbido
      }
    }, 3000);
  }
  // Listener per attivare il suono al primo click
  window.addEventListener('click', (e) => {
    if (!audioContext) {
      // Inizializza AudioContext e nodi audio
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      delayNode = audioContext.createDelay();
      delayNode.delayTime.value = 0.3;

      convolver = audioContext.createConvolver();
      convolver.buffer = generateReverbImpulse(audioContext, 3.0, 2.0); // Riverbero aumentato

      const feedbackGain = audioContext.createGain();
      feedbackGain.gain.setValueAtTime(0.1, audioContext.currentTime);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);

      gainNode.connect(delayNode);
      delayNode.connect(convolver);
      convolver.connect(audioContext.destination);

      oscillator = audioContext.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(110, audioContext.currentTime); // Nota base (A3)
      oscillator.connect(gainNode);
      oscillator.start();
    } else if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Suona una nota con timeout
    const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    playNoteWithTimeout(randomNote);
  });
  window.addEventListener('click', () => {
    if (!audioContext) {
      // Inizializza AudioContext e nodi audio se non già inizializzati
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

      oscillator = audioContext.createOscillator();
      oscillator.type = 'sine'; // Puoi cambiare il tipo di onda (sine, square, sawtooth, triangle)
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
    }

    // Avvia il micro-pattern con un timeout di 5 secondi
    playMicroPattern(scaleNotes, 200, 5000); // 200ms di intervallo, 5 secondi di durata
  });
  // Listener per il movimento del mouse
  window.addEventListener('mousemove', (e) => {
    if (!audioContext || audioContext.state !== 'running') return;

    // Normalizza le coordinate del mouse rispetto alla finestra
    const normalizedX = e.clientX / window.innerWidth; // Normalizza X tra 0 e 1
    const normalizedY = e.clientY / window.innerHeight; // Normalizza Y tra 0 e 1

    // Calcola la frequenza in base alla posizione X
    const noteIndex = Math.floor(normalizedX * scaleNotes.length);
    const frequency = scaleNotes[noteIndex % scaleNotes.length]; // Cicla attraverso la scala

    // Cambia la frequenza dell'oscillatore
    if (oscillator) {
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    }

    // Cambia il ritardo del delay in base alla posizione Y
    if (delayNode) {
      delayNode.delayTime.setValueAtTime(normalizedY * 0.5, audioContext.currentTime); // Ritardo tra 0 e 500ms
    }
  });
  // Listener per terminare il suono al rilascio del mouse
  window.addEventListener('mouseup', () => {
    if (patternInterval) {
      clearInterval(patternInterval);
      patternInterval = null;
    }
    // Applica un rilascio morbido al suono
    if (gainNode) {
      applyADSR(gainNode, 0, 0, 0.2, 1.0); // Solo rilascio lungo
    }
  });
  // SUONO SUONO SUONO SUONO SUONO SUONO SUONO SUONO// SUONO SUONO SUONO SUONO SUONO SUONO SUONO SUONO// SUONO SUONO SUONO SUONO SUONO SUONO SUONO SUONO



  /// ——————————
  // CONFIG ZONE
  // ——————————
  const zoneConfigs = [
    { id: 'zn_1', type: 'type1', size: 0.09, color: 0xff0000, count: 5 },
    { id: 'zn_2', type: 'type2', size: 0.09, color: 0x00ff00, count: 5 },
    { id: 'zn_3', type: 'type3', size: 0.09, color: 0x0000ff, count: 5 },
    { id: 'zn_4', type: 'type4', size: 0.09, color: 0xffff00, count: 5 },
    { id: 'zn_5', type: 'type5', size: 0.09, color: 0xff00ff, count: 5 }
  ];

  const clickZones = [];   // Mesh invisibili per il raycast
  const pointCloudZones = [];  // Points visibili

  function createPointCloudZones(pointClouds, zoneConfigs) {
    // Pulisce la scena se già presenti
    clickZones.forEach(mesh => scene.remove(mesh));
    pointCloudZones.forEach(p => scene.remove(p));
    clickZones.length = 0;
    pointCloudZones.length = 0;

    const positions = [];
    const colors = [];
    const zoneData = [];

    let destinationCounter = 1; // Contatore per URL incrementale

    zoneConfigs.forEach(cfg => {
      for (let i = 0; i < cfg.count; i++) {
        const pc = pointClouds[i % pointClouds.length];
        const posAttr = pc.geometry.attributes.position;
        const idx = Math.floor(Math.random() * posAttr.count);
        const center = new THREE.Vector3().fromBufferAttribute(posAttr, idx);
        const radius = cfg.size;

        for (let p = 0; p < 100; p++) { // Riduci il numero di punti
          let point;
          do {
            point = new THREE.Vector3(
              (Math.random() * 2 - 1),
              (Math.random() * 2 - 1),
              (Math.random() * 2 - 1)
            );
          } while (point.length() > 1);

          point.multiplyScalar(radius).add(center);
          positions.push(point.x, point.y, point.z);

          const color = new THREE.Color(cfg.color);
          colors.push(color.r, color.g, color.b);
        }

        // Mesh invisibile per il raycast (super semplice)
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 2, 2), // Riduci i segmenti
          new THREE.MeshBasicMaterial({ visible: false })
        );
        sphere.position.copy(center);
        sphere.userData = {
          id: `${cfg.id}_${i + 1}`,
          type: cfg.type,
          color: cfg.color,
          center: center.clone(),
          radius,
          destination: `https://jonathans-stunning-site-778d47.webflow.io/zona-${destinationCounter}`, // URL unico
          zoneType: 'zona'
        };
        destinationCounter++; // Incrementa per la prossima zona
        scene.add(sphere);
        scene.add(sphere);
        clickZones.push(sphere);
      }
    });
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Disegna un cerchio
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
    
    const circleTexture = new THREE.CanvasTexture(canvas);
    // Unico point cloud
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: true, // Attenua la dimensione in base alla distanza
    map: circleTexture, // Usa una texture circolare
    blending: THREE.AdditiveBlending // 💥 Glow effect
  });

    const pointCloud = new THREE.Points(geo, mat);
    scene.add(pointCloud);
    pointCloudZones.push(pointCloud);
  }

  function setupClickHandler(camera, controls, renderer) {
    const raycaster = new THREE.Raycaster(); // Correctly reference THREE.Raycaster
    const mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', event => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickZones);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        //focusZoneById(target.userData.id);

        if (target.userData.zoneType === 'zona') {
        const { id, destination } = target.userData;
        const customEvent = new CustomEvent('zoneClicked', {
          detail: { zoneId: id, destination }
        });
      rootElement.dispatchEvent(customEvent);
      }
    }

     
    });
  }

      // 🔵 Movimento morbido verso la zona
    function focusZoneById(id) {
      const zone = clickZones.find(z => z.userData.id === id);
      if (!zone) return;

      const { center, radius } = zone.userData;

      const dir = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();

      const newCamPos = center.clone().add(dir.multiplyScalar(radius * 6));

      gsap.to(camera.position, {
        duration: 1.2,
        x: newCamPos.x,
        y: newCamPos.y,
        z: newCamPos.z,
        ease: 'power2.inOut',
        onUpdate: () => camera.updateMatrixWorld()
      });

      gsap.to(controls.target, {
        duration: 1.2,
        x: center.x,
        y: center.y,
        z: center.z,
        ease: 'power2.inOut',
        onUpdate: () => controls.update()
      });
    }
  /*window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'activateZone') {
        const zoneId = event.data.zoneId;

        const zone = clickZones.find((z) => z.userData.id === zoneId);
        if (zone) {
          const activateEvent = new CustomEvent('activateZone', {
            detail: { zoneId: zone.userData.id }
          });
          zone.dispatchEvent(activateEvent);
          console.log ("Zona attivata: ${zone.userData.id}");
        } else {
          console.warn('Zona non trovata:', zoneId);
        }
      }
    });

  // Aggiungi un listener per il CustomEvent su ogni zona cliccabile
  clickZones.forEach((zone) => {
    zone.addEventListener('activateZone', (event) => {
      const { zoneId } = event.detail;
      console.log(`CustomEvent ricevuto per zona: ${zoneId}`);
      // Logica per gestire l'attivazione della zona
      // (esempio: cambiare colore, eseguire un'animazione, ecc.)
    });
  }); */

  setTimeout(() => {
    createPointCloudZones(pointClouds, zoneConfigs);
    setupClickHandler(camera, controls, renderer, rootElement);
    animate();
  }, 2000);



  /*window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    const { type, zoneId } = event.data;

    if (type === 'focusZone' && typeof zoneId === 'string') {
      focusZoneById(zoneId); // Usa la funzione esistente per focalizzare la zona
    }
  }); */

  rootElement.addEventListener('zoneClicked', (e) => {
  console.log('Evento ricevuto! Zona:', e.detail.zoneId, 'Destination:', e.detail.destination);
  focusZoneById(e.detail.zoneId);

  Turbo.visit(e.detail.destination, { frame: 'menu' });  // Carica la pagina nel turbo-frame
});
  

  /*/ ——————————
  // CREA ZONE POINT CLOUD
  // ——————————
  function createPointCloudZones(pointClouds, zoneConfigs) {
    clickZones.length = 0;
    pointCloudZones.length = 0;

    zoneConfigs.forEach(cfg => {
      for (let i = 0; i < cfg.count; i++) {
        // Scegli un punto casuale come centro
        const pc = pointClouds[i % pointClouds.length];
        const posArr = pc.geometry.attributes.position.array;
        const idx = Math.floor(Math.random() * (posArr.length / 3)) * 3;
        const center = new THREE.Vector3(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
        const radius = cfg.size;

        // Genera punti sferici per la zone point cloud
        const positions = [];
        const colors = [];
        const numPoints = 500;  // quanti punti per zona

        for (let p = 0; p < numPoints; p++) {
          // Punto casuale dentro sfera
          let point;
          do {
            point = new THREE.Vector3(
              (Math.random() * 2 - 1),
              (Math.random() * 2 - 1),
              (Math.random() * 2 - 1)
            );
          } while (point.length() > 1);

          point.multiplyScalar(radius);
          point.add(center);

          positions.push(point.x, point.y, point.z);

          const color = new THREE.Color(cfg.color);
          colors.push(color.r, color.g, color.b);
        }

        // BufferGeometry point cloud visibile
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
          size: radius * 0.05,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          depthWrite: false
        });

        const points = new THREE.Points(geo, mat);
        scene.add(points);
        pointCloudZones.push(points);

        // Mesh invisibile per raycast (sphere)
        const sphereGeo = new THREE.SphereGeometry(radius, 6, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ visible: false });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.position.copy(center);
        sphereMesh.userData = {
          id: `${cfg.id}_${i + 1}`,
          type: cfg.type,
          color: cfg.color,
          center: center.clone(),
          radius: radius
        };
        scene.add(sphereMesh);
        clickZones.push(sphereMesh);
      }
    });
  }

  // ——————————
  // PARTICLE EMITTER AL CLICK
  // ——————————
  const activeParticles = [];
  function emitParticles(center, color) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const geom = new THREE.SphereGeometry(0.005, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const p = new THREE.Mesh(geom, mat);
      p.position.copy(center);
      p.userData.velocity = new THREE.Vector3(
        (Math.random() * 2 - 1) * 0.02,
        (Math.random() * 2 - 1) * 0.02,
        (Math.random() * 2 - 1) * 0.02
      );
      scene.add(p);
      activeParticles.push(p);
    }
  }

  // ——————————
  // CLICK E INQUADRATURA CAMERA
  // ——————————
  function setupClickHandler(camera, controls, renderer) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let originalCamPos = camera.position.clone();
    let originalTarget = controls.target.clone();
    let zoomedZone = null;

    renderer.domElement.addEventListener('click', e => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickZones, false);

      if (intersects.length) {
        const zone = intersects[0].object;
        const { center, radius, color, id } = zone.userData;

        console.log('Zona cliccata:', id);

        emitParticles(center, color);

        if (!zoomedZone) {
          originalCamPos.copy(camera.position);
          originalTarget.copy(controls.target);
        }
        zoomedZone = id;

        const fov = camera.fov * (Math.PI / 180);
        const dist = radius / Math.sin(fov / 2) * 1.2;
        const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
        const newCamPos = center.clone().add(dir.multiplyScalar(dist));

        controls.enabled = false;
        gsap.to(camera.position, {
          x: newCamPos.x,
          y: newCamPos.y,
          z: newCamPos.z,
          duration: 1.5,
          ease: 'power2.inOut'
        });
        gsap.to(controls.target, {
          x: center.x,
          y: center.y,
          z: center.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onComplete: () => (controls.enabled = true)
        });
      } else if (zoomedZone) {
        zoomedZone = null;
        controls.enabled = false;
        gsap.to(camera.position, {
          x: originalCamPos.x,
          y: originalCamPos.y,
          z: originalCamPos.z,
          duration: 1.5,
          ease: 'power2.inOut'
        });
        gsap.to(controls.target, {
          x: originalTarget.x,
          y: originalTarget.y,
          z: originalTarget.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onComplete: () => (controls.enabled = true)
        });
      }
    });
  }*/
});
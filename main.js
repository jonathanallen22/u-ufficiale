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
      url: 'Medusa_def/rosa.glb',
      points: 10000,
      baseColor: new THREE.Color(0x13A6EB),
      duplicateColor: new THREE.Color(0xEB137C),
      scale: 5                           // scala personalizzata
    },
    {
      url: 'https://medusa-definitiva.netlify.app/mod/calotta_ext.glb',
      points: 50000,
      baseColor: new THREE.Color(0x13A6EB),
      duplicateColor: new THREE.Color(0xEB137C),
      scale: 5                           // scala personalizzata
    },
    {
      url: 'https://medusa-definitiva.netlify.app/mod/calotta_int.glb',
      points: 19000,
      baseColor: new THREE.Color(0xA73FEB),
      duplicateColor: new THREE.Color(0xEB413B),
      scale: 5                            // scala personalizzata
    },
  ];

  // === CONFIGURAZIONE UNICA PER TUTTI I MODELLI TNT ===
  const tntModels = [
    'https://medusa-definitiva.netlify.app/mod/tnt_gr/gr_1.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_gr/gr_2.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_gr/gr_3.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_gr/gr_4.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_md/md_1.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_md/md_2.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_md/md_3.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_md/md_4.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_ond/ond_1.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_ond/ond_3.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_ond/ond_2.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_ond/ond_4.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_pcc/pcc_1.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_pcc/pcc_2.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_pcc/pcc_3.glb',
    'https://medusa-definitiva.netlify.app/mod/tnt_pcc/pcc_4.glb',
    
  ];

  const tntConfig = {
    points: 3000,
    baseColor: new THREE.Color(0x4682EB),
    duplicateColor: new THREE.Color(0xAD46EB),
    scale:5
  };
  //________—_____————__——_—————————————————————————————__///

  const pointClouds = [];
  let pointCloud; // <--- aggiungi questa riga fuori da qualsiasi funzione
  let pointTypes = []; // <--- aggiungi questa riga fuori da qualsiasi funzione

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
  loader.load('https://medusa-definitiva.netlify.app/mod/calotta_ext.glb', (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        modules.push(child); // Aggiungi solo le mesh
        child.visible = false;
      }
    });
    scene.add(gltf.scene);
  });

  loader.load('https://medusa-definitiva.netlify.app/mod/calotta_int.glb', (gltf) => {
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
    {
      type: 'type1',
      color: 0x4682EB,
      size: 0.2,    // Base size for zone radius
      count: 5,     // Number of zones of this type
      destination: '#'
    },
    { id: 'zn_2', type: 'type2', size: 0.2, color: 0x00ff00, count: 5, opacity: 0.4 },
    { id: 'zn_3', type: 'type3', size: 0.2, color: 0x0000ff, count: 5, opacity: 0.4 },
    { id: 'zn_4', type: 'type4', size: 0.2, color: 0xffff00, count: 5, opacity: 0.4 },
    { id: 'zn_5', type: 'type5', size: 0.2, color: 0xff00ff, count: 5, opacity: 0.4 }
  ];

  const clickZones = [];   // Mesh invisibili per il raycast
  const pointCloudZones = [];  // Points visibili
  const pointCloudsByType = {}; // { type1: THREE.Points, ... }

  function getUniqueCenters(modelPositions, totalZones) {
    const shuffled = [...modelPositions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, totalZones);
  }

  function createZone(cfg, center, index) {
    const positions = [];
    const colors = [];
    const zoneRadius = cfg.size || 0.5; // Default radius if not specified
    
    for (let p = 0; p < 100; p++) {
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const u = Math.random();
      const theta = Math.acos(costheta);
      const radius = Math.cbrt(u) * zoneRadius;
      
      const x = center.x + radius * Math.sin(theta) * Math.cos(phi);
      const y = center.y + radius * Math.sin(theta) * Math.sin(phi);
      const z = center.z + radius * Math.cos(theta);

      positions.push(x, y, z);
      const color = new THREE.Color(cfg.color);
      colors.push(color.r, color.g, color.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    points.userData = {
      type: cfg.type,
      zoneType: 'zona',
      id: `zone_${cfg.type}_${index}`,
      destination: cfg.destination || '#',
      center: center,
      radius: zoneRadius
    };
    
    return points;
  }

  function createPointCloudZones(pointClouds, zoneConfigs) {
    // Pulisce la scena se già presenti
    clickZones.forEach(mesh => scene.remove(mesh));
    pointCloudZones.forEach(p => scene.remove(p));
    clickZones.length = 0;
    pointCloudZones.length = 0;

    // Dopo aver creato la point cloud del modello:
    const modelPositions = [];
    pointClouds.forEach(pc => {
      const posAttr = pc.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        modelPositions.push({
          x: posAttr.getX(i),
          y: posAttr.getY(i),
          z: posAttr.getZ(i)
        });
      }
    });

    const totalZones = zoneConfigs.reduce((sum, cfg) => sum + cfg.count, 0);
    const uniqueCenters = getUniqueCenters(modelPositions, totalZones);

    let centerIdx = 0;
    zoneConfigs.forEach(cfg => {
      for (let i = 0; i < cfg.count; i++) {
        const center = uniqueCenters[centerIdx++];
        const points = createZone(cfg, center, i);
        scene.add(points);
        pointCloudZones.push(points);
        clickZones.push(points); // Add to clickZones for raycasting
        
        if (!pointCloudsByType[cfg.type]) pointCloudsByType[cfg.type] = [];
        pointCloudsByType[cfg.type].push(points);
      }
    });

    const sitemapLinks = [
      'https://wddc-cintaincoccodrillo.webflow.io/tour2',
      'https://wddc-cintaincoccodrillo.webflow.io/studio', 
      'https://wddc-cintaincoccodrillo.webflow.io/casa',
      'https://wddc-cintaincoccodrillo.webflow.io/festival',
      'https://wddc-cintaincoccodrillo.webflow.io/radio'
    ];

    // Dopo aver creato tutte le zone:
    clickZones.forEach((zone, idx) => {
      zone.userData.destination = sitemapLinks[idx] || '/404';
    });
  }

  function setupClickHandler(camera, controls, renderer, rootElement) {
    renderer.domElement.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const raycastObjects = clickZones.filter(obj => obj.raycastable);
      const intersects = raycaster.intersectObjects(raycastObjects);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        if (target.userData.zoneType === 'zona') {
          const { id, destination } = target.userData;
          console.log(`Zona cliccata: ${id}, link sitemap associato: ${destination}`); // <-- AGGIUNTO
          const customEvent = new CustomEvent('zoneClicked', {
            detail: { zoneId: id, destination }
          });
          rootElement.dispatchEvent(customEvent);

          Turbo.visit(destination);
        }
      }
    });
  }

      // 🔵 Movimento morbido verso la zona
    function focusZoneById(id) {
      const zone = clickZones.find(z => z.userData.id === id);
      if (!zone) return;

      const { center, radius } = zone.userData;
      const centerVec = center.clone ? center.clone() : new THREE.Vector3(center.x, center.y, center.z);

      const dir = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();

      const newCamPos = centerVec.clone().add(dir.multiplyScalar(radius * 6));

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
        x: centerVec.x,
        y: centerVec.y,
        z: centerVec.z,
        ease: 'power2.inOut',
        onUpdate: () => controls.update()
      });
    }


  /*let clickLockedType = null;*/

// Funzioni per visibilità point cloud
function showOnlyType(type) {
  Object.entries(pointCloudsByType).forEach(([t, pointsArr]) => {
    pointsArr.forEach(points => {
      if (points && points.material) {
        gsap.to(points.material, {
          opacity: t === type ? 0.3 : 0,
          duration: 0.5,
          overwrite: true
        });
        points.raycastable = (t === type);
        points.visible = true;
      }
    });
  });
}

function showAllTypes() {
  Object.values(pointCloudsByType).forEach(pointsArr => {
    pointsArr.forEach(points => {
      if (points && points.material) {
        gsap.to(points.material, {
          opacity: 0.3,
          duration: 0.5,
          overwrite: true
        });
        points.raycastable = true;
        points.visible = true;
      }
    });
  });
}

document.addEventListener('mouseenter', function(e) {
  if (e.target.classList.contains('zone-btn')) {
    const type = e.target.dataset.type;
    rootElement.dispatchEvent(new CustomEvent('hoverZoneType', { detail: { type } }));
  }
}, true);

document.addEventListener('mouseleave', function(e) {
  if (e.target.classList.contains('zone-btn')) {
    rootElement.dispatchEvent(new CustomEvent('hoverOutZoneType'));
  }
}, true);

// All zones accese di default all'avvio
showAllTypes();



// Gestione bottoni
document.querySelectorAll('.zone-btn').forEach(btn => {
  const type = btn.dataset.type;

  btn.addEventListener('mouseenter', () => {
    showOnlyType(type);
  });

  btn.addEventListener('mouseleave', () => {
    showAllTypes();
  });
});

// All zones accese di default all'avvio
showAllTypes();


setTimeout(() => {
  createPointCloudZones(pointClouds, zoneConfigs);
  showAllTypes(); // <-- chiama qui, DOPO la creazione delle zone!
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
  

});
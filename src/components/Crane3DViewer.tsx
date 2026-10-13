import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CraneModel, LiftConfiguration, LiftCalculationResult } from '../types/crane';
import { Eye, Layers, Compass, Maximize2, ShieldAlert, Sun, Moon } from 'lucide-react';

interface Crane3DViewerProps {
  crane: CraneModel;
  config: LiftConfiguration;
  calculation: LiftCalculationResult;
}

export const Crane3DViewer: React.FC<Crane3DViewerProps> = ({
  crane,
  config,
  calculation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groundGridRef = useRef<THREE.GridHelper | null>(null);
  
  // Dynamic animated parts references
  const slewDeckRef = useRef<THREE.Group | null>(null);
  const boomPivotRef = useRef<THREE.Group | null>(null);
  const boomMeshRef = useRef<THREE.Group | null>(null);
  const hookGroupRef = useRef<THREE.Group | null>(null);
  const hoistLineRef = useRef<THREE.Line | null>(null);
  const radiusCircleRef = useRef<THREE.LineLoop | null>(null);
  const outriggerPadsRef = useRef<THREE.Mesh[]>([]);
  const obstacleMeshRef = useRef<THREE.Mesh | null>(null);

  const [showObstacle, setShowObstacle] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<'iso' | 'top' | 'side' | 'front'>('iso');
  const [isLightMode, setIsLightMode] = useState<boolean>(true);

  // Orbit controls state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4, radius: 45 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xf1f5f9 : 0x0c0f17);
    scene.fog = new THREE.FogExp2(isLightMode ? 0xf1f5f9 : 0x0c0f17, 0.010);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    cameraRef.current = camera;
    updateCameraPosition('iso');

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLightMode ? 1.1 : 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isLightMode ? 1.6 : 1.3);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    const d = 40;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    const blueFillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    blueFillLight.position.set(-30, 20, -30);
    scene.add(blueFillLight);

    // 5. Site Ground & Grid
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isLightMode ? 0xe2e8f0 : 0x141824,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(
      100,
      50,
      isLightMode ? 0x2563eb : 0x38bdf8,
      isLightMode ? 0xcbd5e1 : 0x1f293d
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    groundGridRef.current = gridHelper;

    // 6. Build Crane Object Group
    const craneGroup = new THREE.Group();
    scene.add(craneGroup);

    buildCraneGeometry(scene, craneGroup);

    // 7. Mouse drag rotation interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      applyCameraAngle();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(
        15,
        Math.min(95, cameraAngleRef.current.radius + e.deltaY * 0.04)
      );
      applyCameraAngle();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // 8. Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isLightMode]);

  const applyCameraAngle = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, Math.max(2, y), z);
    cameraRef.current.lookAt(0, 10, 0);
  };

  const updateCameraPosition = (view: 'iso' | 'top' | 'side' | 'front') => {
    setCameraView(view);
    if (!cameraRef.current) return;
    if (view === 'iso') {
      cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 4.5, radius: 45 };
    } else if (view === 'top') {
      cameraAngleRef.current = { theta: 0, phi: 0.08, radius: 50 };
    } else if (view === 'side') {
      cameraAngleRef.current = { theta: Math.PI / 2, phi: Math.PI / 2.2, radius: 45 };
    } else if (view === 'front') {
      cameraAngleRef.current = { theta: 0, phi: Math.PI / 2.2, radius: 45 };
    }
    applyCameraAngle();
  };

  const buildCraneGeometry = (scene: THREE.Scene, rootGroup: THREE.Group) => {
    while (rootGroup.children.length > 0) {
      rootGroup.remove(rootGroup.children[0]);
    }
    outriggerPadsRef.current = [];

    const yellowCraneMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.5,
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.6,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6,
    });

    if (crane.category === 'mobile') {
      // 1. Carrier Truck
      const chassisGeo = new THREE.BoxGeometry(3.0, 1.4, 9.5);
      const chassis = new THREE.Mesh(chassisGeo, darkMetalMat);
      chassis.position.set(0, 1.1, 0);
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      rootGroup.add(chassis);

      // Cab
      const cabGeo = new THREE.BoxGeometry(2.8, 1.6, 2.5);
      const cab = new THREE.Mesh(cabGeo, yellowCraneMat);
      cab.position.set(0, 1.9, 3.8);
      cab.castShadow = true;
      rootGroup.add(cab);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      for (let z = -3.8; z <= 3.8; z += 1.8) {
        const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
        leftWheel.rotation.z = Math.PI / 2;
        leftWheel.position.set(-1.6, 0.65, z);
        leftWheel.castShadow = true;
        rootGroup.add(leftWheel);

        const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
        rightWheel.rotation.z = Math.PI / 2;
        rightWheel.position.set(1.6, 0.65, z);
        rightWheel.castShadow = true;
        rootGroup.add(rightWheel);
      }

      // Outriggers
      const spanX = crane.outriggerSpreadWidth / 2;
      const spanZ = crane.outriggerSpreadLength / 2;
      const padSize = config.outriggerPadSizeM;

      const outriggerPositions = [
        { x: -spanX, z: spanZ, name: 'FL' },
        { x: spanX, z: spanZ, name: 'FR' },
        { x: -spanX, z: -spanZ, name: 'RL' },
        { x: spanX, z: -spanZ, name: 'RR' },
      ];

      outriggerPositions.forEach((pos) => {
        const beamGeo = new THREE.BoxGeometry(Math.abs(pos.x) - 1.2, 0.35, 0.4);
        const beam = new THREE.Mesh(beamGeo, yellowCraneMat);
        beam.position.set(pos.x > 0 ? (pos.x + 1.2) / 2 : (pos.x - 1.2) / 2, 1.1, pos.z);
        beam.castShadow = true;
        rootGroup.add(beam);

        const jackGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 12);
        const jack = new THREE.Mesh(jackGeo, darkMetalMat);
        jack.position.set(pos.x, 0.55, pos.z);
        jack.castShadow = true;
        rootGroup.add(jack);

        const padGeo = new THREE.BoxGeometry(padSize, 0.15, padSize);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.6,
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(pos.x, 0.08, pos.z);
        pad.receiveShadow = true;
        rootGroup.add(pad);
        outriggerPadsRef.current.push(pad);
      });

      // 2. Slew Deck
      const slewDeck = new THREE.Group();
      slewDeck.position.set(0, 2.0, -0.6);
      rootGroup.add(slewDeck);
      slewDeckRef.current = slewDeck;

      const deckPlatGeo = new THREE.BoxGeometry(2.6, 0.5, 3.8);
      const deckPlat = new THREE.Mesh(deckPlatGeo, darkMetalMat);
      deckPlat.position.set(0, 0.25, -0.4);
      deckPlat.castShadow = true;
      slewDeck.add(deckPlat);

      const opCabGeo = new THREE.BoxGeometry(1.2, 1.8, 2.2);
      const opCab = new THREE.Mesh(opCabGeo, yellowCraneMat);
      opCab.position.set(-1.1, 1.2, 0.6);
      opCab.castShadow = true;
      slewDeck.add(opCab);

      const opGlassGeo = new THREE.BoxGeometry(1.15, 1.1, 1.2);
      const opGlass = new THREE.Mesh(opGlassGeo, glassMat);
      opGlass.position.set(-1.1, 1.4, 1.0);
      slewDeck.add(opGlass);

      const cwGeo = new THREE.BoxGeometry(2.4, 1.5, 1.2);
      const cw = new THREE.Mesh(cwGeo, darkMetalMat);
      cw.position.set(0, 1.1, -1.8);
      cw.castShadow = true;
      slewDeck.add(cw);

      const boomPivot = new THREE.Group();
      boomPivot.position.set(0, 0.8, 0.8);
      slewDeck.add(boomPivot);
      boomPivotRef.current = boomPivot;

      const boomGroup = new THREE.Group();
      boomPivot.add(boomGroup);
      boomMeshRef.current = boomGroup;

      const boomLen = config.boomLength;
      const baseGeo = new THREE.BoxGeometry(0.9, 1.1, boomLen);
      const baseBoom = new THREE.Mesh(baseGeo, yellowCraneMat);
      baseBoom.position.set(0, 0, boomLen / 2);
      baseBoom.castShadow = true;
      boomGroup.add(baseBoom);

      const headGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
      const head = new THREE.Mesh(headGeo, darkMetalMat);
      head.rotation.z = Math.PI / 2;
      head.position.set(0, 0, boomLen);
      boomGroup.add(head);

      const cylGeo = new THREE.CylinderGeometry(0.2, 0.2, 3.5, 12);
      const cylinder = new THREE.Mesh(cylGeo, darkMetalMat);
      cylinder.rotation.x = Math.PI / 3;
      cylinder.position.set(0, 0.5, 0.3);
      slewDeck.add(cylinder);

    } else {
      // Tower Crane
      const mastHeight = config.towerMastHeight || crane.towerHeightUnderHook || 45.0;
      const jibLen = config.boomLength || crane.towerJibLength || 55.0;

      const baseGeo = new THREE.BoxGeometry(crane.outriggerSpreadWidth, 1.0, crane.outriggerSpreadLength);
      const base = new THREE.Mesh(baseGeo, darkMetalMat);
      base.position.set(0, 0.5, 0);
      base.castShadow = true;
      rootGroup.add(base);

      const mastGeo = new THREE.BoxGeometry(2.0, mastHeight, 2.0);
      const mast = new THREE.Mesh(mastGeo, yellowCraneMat);
      mast.position.set(0, mastHeight / 2 + 1.0, 0);
      mast.castShadow = true;
      rootGroup.add(mast);

      const slewDeck = new THREE.Group();
      slewDeck.position.set(0, mastHeight + 1.0, 0);
      rootGroup.add(slewDeck);
      slewDeckRef.current = slewDeck;

      const cabGeo = new THREE.BoxGeometry(1.6, 2.0, 2.2);
      const cab = new THREE.Mesh(cabGeo, yellowCraneMat);
      cab.position.set(1.4, 1.2, 0.5);
      slewDeck.add(cab);

      const counterJibLen = 16.0;
      const cJibGeo = new THREE.BoxGeometry(1.2, 1.2, counterJibLen);
      const cJib = new THREE.Mesh(cJibGeo, darkMetalMat);
      cJib.position.set(0, 1.5, -counterJibLen / 2);
      cJib.castShadow = true;
      slewDeck.add(cJib);

      const cwGeo = new THREE.BoxGeometry(2.2, 1.8, 3.0);
      const cw = new THREE.Mesh(cwGeo, darkMetalMat);
      cw.position.set(0, 2.2, -counterJibLen + 2.0);
      cw.castShadow = true;
      slewDeck.add(cw);

      const boomPivot = new THREE.Group();
      boomPivot.position.set(0, 1.5, 0);
      slewDeck.add(boomPivot);
      boomPivotRef.current = boomPivot;

      const boomGroup = new THREE.Group();
      boomPivot.add(boomGroup);
      boomMeshRef.current = boomGroup;

      const jibGeo = new THREE.BoxGeometry(1.4, 1.4, jibLen);
      const jib = new THREE.Mesh(jibGeo, yellowCraneMat);
      jib.position.set(0, 0, jibLen / 2);
      jib.castShadow = true;
      boomGroup.add(jib);
    }

    // Hook & Load
    const hookGroup = new THREE.Group();
    rootGroup.add(hookGroup);
    hookGroupRef.current = hookGroup;

    const blockGeo = new THREE.BoxGeometry(0.7, 0.9, 0.5);
    const block = new THREE.Mesh(blockGeo, darkMetalMat);
    hookGroup.add(block);

    const hookCurve = new THREE.TorusGeometry(0.35, 0.08, 12, 24, Math.PI * 1.3);
    const hookMesh = new THREE.Mesh(hookCurve, darkMetalMat);
    hookMesh.rotation.z = Math.PI / 1.1;
    hookMesh.position.set(0, -0.65, 0);
    hookGroup.add(hookMesh);

    const slingMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
    const slingGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.7, 0),
      new THREE.Vector3(-1.2, -2.2, 1.5),
      new THREE.Vector3(0, -0.7, 0),
      new THREE.Vector3(1.2, -2.2, 1.5),
      new THREE.Vector3(0, -0.7, 0),
      new THREE.Vector3(-1.2, -2.2, -1.5),
      new THREE.Vector3(0, -0.7, 0),
      new THREE.Vector3(1.2, -2.2, -1.5),
    ]);
    const slings = new THREE.LineSegments(slingGeo, slingMat);
    hookGroup.add(slings);

    // Suspended Load Crate (Escalator Truss)
    const loadGeo = new THREE.BoxGeometry(2.4, 1.4, 4.0);
    const loadMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.35,
      metalness: 0.3,
    });
    const loadMesh = new THREE.Mesh(loadGeo, loadMat);
    loadMesh.position.set(0, -2.9, 0);
    loadMesh.castShadow = true;
    hookGroup.add(loadMesh);

    const cablePoints = [new THREE.Vector3(0, 20, 10), new THREE.Vector3(0, 5, 10)];
    const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    const hoistLine = new THREE.Line(cableGeo, new THREE.LineBasicMaterial({ color: 0x475569 }));
    rootGroup.add(hoistLine);
    hoistLineRef.current = hoistLine;

    // Working Radius Ground Circle
    const radiusPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      radiusPts.push(new THREE.Vector3(Math.cos(theta), 0.05, Math.sin(theta)));
    }
    const radCircleGeo = new THREE.BufferGeometry().setFromPoints(radiusPts);
    const radCircleMat = new THREE.LineBasicMaterial({
      color: calculation.isOverload ? 0xdc2626 : calculation.isCriticalLift ? 0xd97706 : 0x16a34a,
      linewidth: 2,
    });
    const radiusCircle = new THREE.LineLoop(radCircleGeo, radCircleMat);
    rootGroup.add(radiusCircle);
    radiusCircleRef.current = radiusCircle;

    // Obstacle Building
    const obsGeo = new THREE.BoxGeometry(8, 16, 12);
    const obsMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const obstacle = new THREE.Mesh(obsGeo, obsMat);
    obstacle.position.set(16, 8, 12);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacleMeshRef.current = obstacle;
  };

  useEffect(() => {
    if (!slewDeckRef.current || !boomPivotRef.current || !hookGroupRef.current) return;

    const slewRad = (config.slewAngleDeg * Math.PI) / 180;
    slewDeckRef.current.rotation.y = slewRad;

    if (crane.category === 'mobile') {
      const boomAngleRad = (calculation.boomAngleDeg * Math.PI) / 180;
      boomPivotRef.current.rotation.x = -boomAngleRad;
    } else {
      boomPivotRef.current.rotation.x = 0;
    }

    const radius = config.workingRadius;
    const loadX = radius * Math.sin(slewRad);
    const loadZ = radius * Math.cos(slewRad);
    const tipY = calculation.tipHeightM;
    const hookY = Math.max(3.5, calculation.hookElevationM);

    hookGroupRef.current.position.set(loadX, hookY, loadZ);

    if (hoistLineRef.current) {
      hoistLineRef.current.geometry.setFromPoints([
        new THREE.Vector3(loadX, tipY, loadZ),
        new THREE.Vector3(loadX, hookY, loadZ),
      ]);
    }

    if (radiusCircleRef.current) {
      radiusCircleRef.current.scale.set(radius, 1, radius);
      const circleMat = radiusCircleRef.current.material as THREE.LineBasicMaterial;
      if (calculation.isOverload) {
        circleMat.color.setHex(0xdc2626);
      } else if (calculation.isCriticalLift) {
        circleMat.color.setHex(0xd97706);
      } else {
        circleMat.color.setHex(0x16a34a);
      }
    }

    if (outriggerPadsRef.current.length === 4) {
      const reactions = [
        calculation.outriggerForces.frontLeftTon,
        calculation.outriggerForces.frontRightTon,
        calculation.outriggerForces.rearLeftTon,
        calculation.outriggerForces.rearRightTon,
      ];
      const maxReact = calculation.outriggerForces.maxReactionTon;
      const isSoilSafe = calculation.outriggerForces.isSoilSafe;

      outriggerPadsRef.current.forEach((pad, idx) => {
        const mat = pad.material as THREE.MeshStandardMaterial;
        const val = reactions[idx];
        if (!isSoilSafe && val === maxReact) {
          mat.color.setHex(0xdc2626);
        } else if (val >= maxReact * 0.8) {
          mat.color.setHex(0xd97706);
        } else {
          mat.color.setHex(0x16a34a);
        }
      });
    }

    if (obstacleMeshRef.current) {
      obstacleMeshRef.current.visible = showObstacle;
    }
  }, [crane, config, calculation, showObstacle]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shadow-sm flex flex-col">
      {/* Top Header / View Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Crane model info badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 shadow-md">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              calculation.isOverload
                ? 'bg-rose-500 animate-pulse'
                : calculation.isCriticalLift
                ? 'bg-amber-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs font-bold text-slate-800">
            3D CAD Simulation: {crane.modelCode}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono-num font-bold border border-slate-200">
            {crane.category === 'mobile' ? 'Mobile Telescopic' : 'Tower Crane'}
          </span>
        </div>

        {/* Camera Views & Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-md text-xs">
          <button
            onClick={() => updateCameraPosition('iso')}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              cameraView === 'iso'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3D Orbit
          </button>
          <button
            onClick={() => updateCameraPosition('top')}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              cameraView === 'top'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plan (Top)
          </button>
          <button
            onClick={() => updateCameraPosition('side')}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              cameraView === 'side'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side
          </button>
          <button
            onClick={() => updateCameraPosition('front')}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              cameraView === 'front'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Front
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Theme toggle between Clean Light and Dark CAD */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Light / Dark 3D Viewport"
            className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          <button
            onClick={() => setShowObstacle(!showObstacle)}
            title="Toggle Obstacle Building"
            className={`p-1.5 rounded transition ${
              showObstacle ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Floating HUD telemetry overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap items-end justify-between gap-3">
        {/* Real-time telemetry cards */}
        <div className="pointer-events-auto grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 text-xs shadow-lg">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Working Radius (R)
            </div>
            <div className="text-sm font-bold text-blue-700 font-mono-num">
              {config.workingRadius.toFixed(1)} m
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Boom Angle (θ)
            </div>
            <div className="text-sm font-bold text-amber-700 font-mono-num">
              {calculation.boomAngleDeg.toFixed(1)}°
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Tip Height (H)
            </div>
            <div className="text-sm font-bold text-emerald-700 font-mono-num">
              {calculation.tipHeightM.toFixed(1)} m
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Slew Rotation
            </div>
            <div className="text-sm font-bold text-purple-700 font-mono-num">
              {config.slewAngleDeg}°
            </div>
          </div>
        </div>

        {/* Ground Reaction HUD */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 text-xs shadow-lg min-w-[200px]">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
            <span>MAX OUTRIGGER REACTION</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono-num font-bold ${
                calculation.outriggerForces.isSoilSafe
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {calculation.outriggerForces.groundBearingPressureKPa} kPa
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold font-mono-num text-slate-900">
              {calculation.outriggerForces.maxReactionTon.toFixed(2)}{' '}
              <span className="text-xs text-slate-500">Tons</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Soil: {calculation.outriggerForces.allowablePressureKPa} kPa
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calculation.outriggerForces.isSoilSafe ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, calculation.outriggerForces.pressureUtilizationPercent)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

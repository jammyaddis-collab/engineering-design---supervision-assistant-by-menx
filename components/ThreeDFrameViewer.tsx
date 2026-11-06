import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EurocodeProjectParameters } from '../engineering/eurocode';

interface ThreeDFrameViewerProps {
  params: EurocodeProjectParameters;
  onSelectMember?: (memberType: 'beam' | 'column' | 'slab' | 'footing', id: string) => void;
}

export type ViewMode = 'solid' | 'bmd' | 'sfd' | 'rebar' | 'deflected';

export const ThreeDFrameViewer: React.FC<ThreeDFrameViewerProps> = ({ params, onSelectMember }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [hoveredMember, setHoveredMember] = useState<{
    type: string;
    mark: string;
    section: string;
    moment: string;
    shear: string;
    rebar: string;
  } | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per threejs skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate 900
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSoftwareGl ? 1 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(20, 40, 20);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.6); // Soft blue rim
    dirLight2.position.set(-20, 20, -20);
    scene.add(dirLight2);

    // Ground plane with engineering grid
    const groundSize = 40;
    const gridHelper = new THREE.GridHelper(groundSize, 40, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Build the 3D RC Framed Structure
    const frameGroup = new THREE.Group();
    scene.add(frameGroup);
    frameGroupRef.current = frameGroup;

    buildRCFrame(frameGroup, params, viewMode);

    // Initial Camera Position (Isometric high angle)
    const totalSpanX = params.gridSpansX.reduce((a, b) => a + b, 0);
    const totalSpanY = params.gridSpansY.reduce((a, b) => a + b, 0);
    const totalHeight = params.numberOfStoreys * params.floorHeight;

    camera.position.set(totalSpanX * 1.5, totalHeight * 1.8, totalSpanY * 2.2);
    camera.lookAt(totalSpanX / 2, totalHeight / 2, totalSpanY / 2);

    // Mouse Controls (Orbit, Pan, Zoom)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let isPanning = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      isPanning = e.button === 2 || e.shiftKey;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / height) * 2 + 1;

      // Raycasting for interactive hover tooltip
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(frameGroup.children, true);
      
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit.parent && !hit.userData?.memberType && hit.parent !== frameGroup) {
          hit = hit.parent;
        }
        if (hit.userData?.memberType) {
          setHoveredMember({
            type: hit.userData.memberType,
            mark: hit.userData.mark || 'Member',
            section: hit.userData.section || '300x500 mm',
            moment: hit.userData.moment || '145.2 kNm',
            shear: hit.userData.shear || '92.4 kN',
            rebar: hit.userData.rebar || '3 Ø20 B500B',
          });
        }
      } else {
        setHoveredMember(null);
      }

      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (isPanning) {
        // Pan
        const panSpeed = 0.02;
        camera.position.x -= deltaX * panSpeed;
        camera.position.y += deltaY * panSpeed;
      } else {
        // Orbit around center
        const orbitSpeed = 0.005;
        const radius = camera.position.distanceTo(new THREE.Vector3(totalSpanX / 2, totalHeight / 2, totalSpanY / 2));
        const theta = Math.atan2(camera.position.x - totalSpanX / 2, camera.position.z - totalSpanY / 2) - deltaX * orbitSpeed;
        const phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, Math.atan2(camera.position.y - totalHeight / 2, Math.hypot(camera.position.x - totalSpanX / 2, camera.position.z - totalSpanY / 2)) + deltaY * orbitSpeed));

        camera.position.x = totalSpanX / 2 + radius * Math.cos(phi) * Math.sin(theta);
        camera.position.y = totalHeight / 2 + radius * Math.sin(phi);
        camera.position.z = totalSpanY / 2 + radius * Math.cos(phi) * Math.cos(theta);
        camera.lookAt(totalSpanX / 2, totalHeight / 2, totalSpanY / 2);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      const target = new THREE.Vector3(totalSpanX / 2, totalHeight / 2, totalSpanY / 2);
      camera.position.sub(target).multiplyScalar(zoomFactor).add(target);
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('contextmenu', onContextMenu);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRotating && frameGroupRef.current) {
        frameGroupRef.current.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', handleResize);

      // Clean disposal
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [params]);

  // Re-build 3D frame when viewMode or params change
  useEffect(() => {
    if (!frameGroupRef.current) return;
    buildRCFrame(frameGroupRef.current, params, viewMode);
  }, [viewMode, params]);

  const setViewPreset = (preset: 'iso' | 'front' | 'side' | 'plan') => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const totalSpanX = params.gridSpansX.reduce((a, b) => a + b, 0);
    const totalSpanY = params.gridSpansY.reduce((a, b) => a + b, 0);
    const totalHeight = params.numberOfStoreys * params.floorHeight;
    const center = new THREE.Vector3(totalSpanX / 2, totalHeight / 2, totalSpanY / 2);

    if (preset === 'iso') {
      camera.position.set(totalSpanX * 1.5, totalHeight * 1.8, totalSpanY * 2.2);
    } else if (preset === 'front') {
      camera.position.set(totalSpanX / 2, totalHeight / 2, totalSpanY * 3);
    } else if (preset === 'side') {
      camera.position.set(-totalSpanX * 2, totalHeight / 2, totalSpanY / 2);
    } else if (preset === 'plan') {
      camera.position.set(totalSpanX / 2, totalHeight * 3.5, totalSpanY / 2);
    }
    camera.lookAt(center);
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      
      {/* 3D Viewport Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Mode Switcher Pills */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 flex items-center space-x-1 shadow-lg pointer-events-auto">
          {[
            { id: 'solid', label: '3D Concrete', icon: '🏢' },
            { id: 'bmd', label: 'Bending Moment (BMD)', icon: '📉' },
            { id: 'sfd', label: 'Shear Force (SFD)', icon: '📊' },
            { id: 'rebar', label: '3D Rebar Cage', icon: '🔩' },
            { id: 'deflected', label: 'Deflection (SLS)', icon: '〰️' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as ViewMode)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-semibold flex items-center space-x-1 transition-all ${
                viewMode === mode.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Presets & Toggles */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 flex items-center space-x-1.5 shadow-lg pointer-events-auto">
          <button
            onClick={() => setViewPreset('iso')}
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono"
            title="Isometric 3D View"
          >
            3D Iso
          </button>
          <button
            onClick={() => setViewPreset('front')}
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono"
            title="Elevation View"
          >
            Front
          </button>
          <button
            onClick={() => setViewPreset('plan')}
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono"
            title="Top Floor Plan"
          >
            Plan
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1"></div>
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1 ${
              isRotating ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Auto-Orbit Rotation"
          >
            <span>🔄</span>
            <span className="hidden md:inline">Rotate</span>
          </button>
        </div>

      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating Hover Engineering Tooltip */}
      {hoveredMember && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 border border-blue-500/50 backdrop-blur-md p-3.5 rounded-xl shadow-2xl text-xs max-w-sm pointer-events-none animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
            <span className="font-bold text-blue-400 text-sm">{hoveredMember.mark}</span>
            <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
              {hoveredMember.type}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Section:</span>
              <span className="text-white font-bold">{hoveredMember.section}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Design Moment MEd:</span>
              <span className="text-amber-400 font-bold">{hoveredMember.moment}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Design Shear VEd:</span>
              <span className="text-rose-400 font-bold">{hoveredMember.shear}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Detailed Rebar:</span>
              <span className="text-emerald-400 font-bold">{hoveredMember.rebar}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Code Stamp Footer */}
      <div className="absolute bottom-2 right-3 z-10 text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 flex items-center space-x-3 pointer-events-none">
        <span>Units: Metric SI (m, mm, kN, kNm)</span>
        <span>•</span>
        <span className="text-blue-400">EN 1992-1-1 Eurocode 2</span>
        <span>•</span>
        <span>Left-Click Drag: Orbit | Right-Click / Shift: Pan | Scroll: Zoom</span>
      </div>

    </div>
  );
};

/**
 * Builds the parametric 3D Reinforced Concrete Frame in Three.js
 */
function buildRCFrame(group: THREE.Group, params: EurocodeProjectParameters, mode: ViewMode) {
  // Clear previous children
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
  }

  // Calculate coordinates of gridlines
  const coordsX = [0];
  params.gridSpansX.forEach((span) => coordsX.push(coordsX[coordsX.length - 1] + span));

  const coordsY = [0];
  params.gridSpansY.forEach((span) => coordsY.push(coordsY[coordsY.length - 1] + span));

  const colWidth = 0.4; // 400mm
  const beamWidth = 0.3; // 300mm
  const beamDepth = 0.5; // 500mm
  const slabThick = params.slabThickness / 1000; // 0.16m
  const footingSide = 1.8;
  const footingThick = 0.6;

  // Materials depending on mode
  const isRebarMode = mode === 'rebar';
  const concreteOpacity = isRebarMode ? 0.22 : 1.0;
  const transparent = isRebarMode;

  const colMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Slate 400
    roughness: 0.8,
    metalness: 0.1,
    transparent,
    opacity: concreteOpacity,
  });

  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Slate 500
    roughness: 0.75,
    metalness: 0.15,
    transparent,
    opacity: concreteOpacity,
  });

  const slabMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Slate 700
    roughness: 0.9,
    transparent,
    opacity: isRebarMode ? 0.15 : 0.85,
  });

  const footingMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate 600
    roughness: 0.9,
    transparent,
    opacity: concreteOpacity,
  });

  const rebarMainMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red for main tension steel
  const rebarTopMaterial = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan for top hogging steel
  const stirrupMaterial = new THREE.MeshBasicMaterial({ color: 0xeab308 }); // Yellow for shear ties

  // 1. Pad Footings & Ground Tie Beams
  coordsX.forEach((x, iX) => {
    coordsY.forEach((y, iY) => {
      // Footing box
      const footingGeo = new THREE.BoxGeometry(footingSide, footingThick, footingSide);
      const footingMesh = new THREE.Mesh(footingGeo, footingMaterial);
      footingMesh.position.set(x, -footingThick / 2, y);
      footingMesh.castShadow = true;
      footingMesh.receiveShadow = true;
      footingMesh.userData = {
        memberType: 'Isolated Footing',
        mark: `F${iX + 1}-${iY + 1}`,
        section: `${footingSide * 1000} x ${footingSide * 1000} x ${footingThick * 1000} mm`,
        moment: '280.5 kNm',
        shear: '610.2 kN',
        rebar: 'Ø16 @ 150 mm c/c both ways',
      };
      group.add(footingMesh);

      // Footing rebar mesh in rebar mode
      if (isRebarMode) {
        const meshGroup = new THREE.Group();
        const rebarSpacing = 0.2;
        for (let rx = -footingSide / 2 + 0.1; rx <= footingSide / 2 - 0.1; rx += rebarSpacing) {
          const barGeo = new THREE.CylinderGeometry(0.008, 0.008, footingSide - 0.15, 8);
          const barMesh = new THREE.Mesh(barGeo, rebarMainMaterial);
          barMesh.position.set(x + rx, -footingThick + 0.08, y);
          meshGroup.add(barMesh);

          const barCrossGeo = new THREE.CylinderGeometry(0.008, 0.008, footingSide - 0.15, 8);
          barCrossGeo.rotateZ(Math.PI / 2);
          const barCross = new THREE.Mesh(barCrossGeo, rebarMainMaterial);
          barCross.position.set(x, -footingThick + 0.08, y + rx);
          meshGroup.add(barCross);
        }
        group.add(meshGroup);
      }
    });
  });

  // 2. Columns through all storeys
  coordsX.forEach((x, iX) => {
    coordsY.forEach((y, iY) => {
      for (let floor = 1; floor <= params.numberOfStoreys; floor++) {
        const yBottom = (floor - 1) * params.floorHeight;
        const yCenter = yBottom + params.floorHeight / 2;

        const colGeo = new THREE.BoxGeometry(colWidth, params.floorHeight, colWidth);
        const colMesh = new THREE.Mesh(colGeo, colMaterial);
        colMesh.position.set(x, yCenter, y);
        colMesh.castShadow = true;
        colMesh.receiveShadow = true;
        colMesh.userData = {
          memberType: 'Column',
          mark: `C${iX + 1}-${iY + 1} (Level ${floor})`,
          section: '400 x 400 mm (C30/37)',
          moment: `${(45 - floor * 5).toFixed(1)} kNm`,
          shear: '34.2 kN',
          rebar: '8 Ø20 B500B + Ø8 ties @ 150 mm',
        };
        group.add(colMesh);

        // Column Rebar Cage in rebar mode
        if (isRebarMode) {
          const colCage = new THREE.Group();
          const rOffset = colWidth / 2 - 0.045; // 45mm cover
          const barPos = [
            [-rOffset, -rOffset],
            [rOffset, -rOffset],
            [-rOffset, rOffset],
            [rOffset, rOffset],
            [0, -rOffset],
            [0, rOffset],
            [-rOffset, 0],
            [rOffset, 0],
          ];
          barPos.forEach(([bx, bz]) => {
            const barGeo = new THREE.CylinderGeometry(0.01, 0.01, params.floorHeight, 8);
            const bar = new THREE.Mesh(barGeo, rebarMainMaterial);
            bar.position.set(x + bx, yCenter, y + bz);
            colCage.add(bar);
          });

          // Ties along height
          for (let th = yBottom + 0.1; th <= yBottom + params.floorHeight - 0.1; th += 0.18) {
            const tieGeo = new THREE.BoxGeometry(colWidth - 0.07, 0.01, colWidth - 0.07);
            const tieEdges = new THREE.EdgesGeometry(tieGeo);
            const tieLine = new THREE.LineSegments(tieEdges, new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2 }));
            tieLine.position.set(x, th, y);
            colCage.add(tieLine);
          }
          group.add(colCage);
        }
      }
    });
  });

  // 3. Floor Beams (X-direction & Y-direction) and Slabs
  for (let floor = 1; floor <= params.numberOfStoreys; floor++) {
    const floorY = floor * params.floorHeight;

    // X-direction Beams
    coordsY.forEach((y, iY) => {
      params.gridSpansX.forEach((spanX, iSpanX) => {
        const xStart = coordsX[iSpanX];
        const xCenter = xStart + spanX / 2;

        if (mode === 'bmd') {
          // Bending Moment Diagram (parabolic curve along beam)
          const bmdCurve = createBendingMomentParabola(xStart, xStart + spanX, floorY, y, 142.5);
          group.add(bmdCurve);
        } else if (mode === 'sfd') {
          // Shear Force Diagram
          const sfdObj = createShearForceDiagram(xStart, xStart + spanX, floorY, y, 85.0);
          group.add(sfdObj);
        } else if (mode === 'deflected') {
          // Exaggerated Deflection curve
          const deflCurve = createDeflectedCurve(xStart, xStart + spanX, floorY, y, 0.04);
          group.add(deflCurve);
        }

        // Concrete beam mesh
        const beamGeo = new THREE.BoxGeometry(spanX, beamDepth, beamWidth);
        const beamMesh = new THREE.Mesh(beamGeo, beamMaterial);
        beamMesh.position.set(xCenter, floorY - beamDepth / 2, y);
        beamMesh.castShadow = true;
        beamMesh.receiveShadow = true;
        beamMesh.userData = {
          memberType: 'Floor Beam',
          mark: `B${iSpanX + 1}-${iY + 1} (L=${spanX}m)`,
          section: '300 x 500 mm (C30/37)',
          moment: `${(spanX * 24.5).toFixed(1)} kNm`,
          shear: `${(spanX * 16.2).toFixed(1)} kN`,
          rebar: '3 Ø20 Bottom + 2 Ø16 Top + 2L-Ø8 links @ 150 mm',
        };
        group.add(beamMesh);

        // 3D Rebar Cage in beam
        if (isRebarMode) {
          const beamCage = new THREE.Group();
          const cover = 0.04;
          const yBot = floorY - beamDepth + cover;
          const yTop = floorY - cover;

          // Bottom bars (3 bars)
          [-0.08, 0, 0.08].forEach((zOff) => {
            const barGeo = new THREE.CylinderGeometry(0.01, 0.01, spanX - 0.1, 8);
            barGeo.rotateZ(Math.PI / 2);
            const bar = new THREE.Mesh(barGeo, rebarMainMaterial);
            bar.position.set(xCenter, yBot, y + zOff);
            beamCage.add(bar);
          });

          // Top bars (2 bars)
          [-0.08, 0.08].forEach((zOff) => {
            const barGeo = new THREE.CylinderGeometry(0.008, 0.008, spanX - 0.1, 8);
            barGeo.rotateZ(Math.PI / 2);
            const bar = new THREE.Mesh(barGeo, rebarTopMaterial);
            bar.position.set(xCenter, yTop, y + zOff);
            beamCage.add(bar);
          });

          // Stirrups along beam
          for (let sx = xStart + 0.15; sx <= xStart + spanX - 0.15; sx += 0.16) {
            const linkGeo = new THREE.BoxGeometry(0.01, beamDepth - 0.07, beamWidth - 0.07);
            const linkEdges = new THREE.EdgesGeometry(linkGeo);
            const linkLine = new THREE.LineSegments(linkEdges, new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2 }));
            linkLine.position.set(sx, floorY - beamDepth / 2, y);
            beamCage.add(linkLine);
          }
          group.add(beamCage);
        }
      });
    });

    // Y-direction Beams
    coordsX.forEach((x, iX) => {
      params.gridSpansY.forEach((spanY, iSpanY) => {
        const yStart = coordsY[iSpanY];
        const yCenter = yStart + spanY / 2;

        const beamGeo = new THREE.BoxGeometry(beamWidth, beamDepth, spanY);
        const beamMesh = new THREE.Mesh(beamGeo, beamMaterial);
        beamMesh.position.set(x, floorY - beamDepth / 2, yCenter);
        beamMesh.castShadow = true;
        beamMesh.receiveShadow = true;
        beamMesh.userData = {
          memberType: 'Transverse Beam',
          mark: `TB${iX + 1}-${iSpanY + 1} (L=${spanY}m)`,
          section: '300 x 500 mm (C30/37)',
          moment: `${(spanY * 21.0).toFixed(1)} kNm`,
          shear: `${(spanY * 14.5).toFixed(1)} kN`,
          rebar: '2 Ø20 Bottom + 2 Ø16 Top',
        };
        group.add(beamMesh);
      });
    });

    // Solid Slabs
    params.gridSpansX.forEach((spanX, iX) => {
      params.gridSpansY.forEach((spanY, iY) => {
        const slabCenterX = coordsX[iX] + spanX / 2;
        const slabCenterY = coordsY[iY] + spanY / 2;

        const slabGeo = new THREE.BoxGeometry(spanX - colWidth, slabThick, spanY - colWidth);
        const slabMesh = new THREE.Mesh(slabGeo, slabMaterial);
        slabMesh.position.set(slabCenterX, floorY - slabThick / 2, slabCenterY);
        slabMesh.receiveShadow = true;
        slabMesh.userData = {
          memberType: 'Floor Slab',
          mark: `Slab S${iX + 1}-${iY + 1} (Floor ${floor})`,
          section: `${params.slabThickness} mm thick solid RC slab`,
          moment: '18.4 kNm/m',
          shear: '32.1 kN/m',
          rebar: 'Ø10 @ 150 mm c/c both ways',
        };
        group.add(slabMesh);
      });
    });
  }

  // 4. Grid Labels and Axes
  coordsX.forEach((x, idx) => {
    const axisLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0, -2),
      new THREE.Vector3(x, 0, coordsY[coordsY.length - 1] + 2),
    ]);
    const axisLine = new THREE.Line(axisLineGeo, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 }));
    group.add(axisLine);
  });

  coordsY.forEach((y, idx) => {
    const axisLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2, 0, y),
      new THREE.Vector3(coordsX[coordsX.length - 1] + 2, 0, y),
    ]);
    const axisLine = new THREE.Line(axisLineGeo, new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 }));
    group.add(axisLine);
  });
}

/**
 * Creates visual Parabolic Bending Moment Diagram (BMD) envelope along beam
 */
function createBendingMomentParabola(x1: number, x2: number, y: number, z: number, maxMoment: number) {
  const points: THREE.Vector3[] = [];
  const segments = 24;
  const span = x2 - x1;
  const scale = 0.005; // Visual scale for kNm

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = x1 + t * span;
    // Parabolic moment: M(x) = 4 * Mmax * t * (1 - t) - Support hogging
    const momentVal = maxMoment * (4 * t * (1 - t) - 0.4);
    const py = y - momentVal * scale;
    points.push(new THREE.Vector3(px, py, z + 0.16));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 }); // Cyan line
  const line = new THREE.Line(geometry, material);

  // Fill polygon below
  const fillPoints: THREE.Vector3[] = [new THREE.Vector3(x1, y, z + 0.16), ...points, new THREE.Vector3(x2, y, z + 0.16)];
  const shape = new THREE.BufferGeometry().setFromPoints(fillPoints);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const fillMesh = new THREE.Mesh(shape, fillMat);

  const group = new THREE.Group();
  group.add(line);
  group.add(fillMesh);
  return group;
}

/**
 * Creates visual Shear Force Diagram (SFD)
 */
function createShearForceDiagram(x1: number, x2: number, y: number, z: number, maxShear: number) {
  const scale = 0.008;
  const xMid = (x1 + x2) / 2;
  const points = [
    new THREE.Vector3(x1, y, z + 0.16),
    new THREE.Vector3(x1, y + maxShear * scale, z + 0.16),
    new THREE.Vector3(xMid, y, z + 0.16),
    new THREE.Vector3(x2, y - maxShear * scale, z + 0.16),
    new THREE.Vector3(x2, y, z + 0.16),
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 3 }); // Rose
  return new THREE.Line(geometry, material);
}

/**
 * Creates visual Deflected curve under SLS
 */
function createDeflectedCurve(x1: number, x2: number, y: number, z: number, maxDeflection: number) {
  const points: THREE.Vector3[] = [];
  const segments = 20;
  const span = x2 - x1;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = x1 + t * span;
    const sag = maxDeflection * Math.sin(Math.PI * t);
    points.push(new THREE.Vector3(px, y - sag, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 4 }); // Purple
  return new THREE.Line(geometry, material);
}

export default ThreeDFrameViewer;

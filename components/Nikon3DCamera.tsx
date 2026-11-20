"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

interface Nikon3DCameraProps {
  className?: string;
  showBadges?: boolean;
}

export function Nikon3DCamera({ className = "" }: Nikon3DCameraProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Interaction & Visibility refs
  const isDragging = useRef(false);
  const isVisible = useRef(true);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rotTarget = useRef({ x: 0.12, y: -0.42 });
  const rotCurrent = useRef({ x: 0.12, y: -0.42 });

  // Stringent contingency: Strictly desktop-only (>= 1024px) & non-touch devices
  useEffect(() => {
    const checkEnvironment = () => {
      const isLarge = window.innerWidth >= 1024;
      const canHover = window.matchMedia("(hover: hover)").matches;
      setIsDesktop(isLarge && canHover);
    };
    checkEnvironment();
    window.addEventListener("resize", checkEnvironment);
    return () => window.removeEventListener("resize", checkEnvironment);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    let isDisposed = false;

    // --- Scene, Camera, Renderer ---
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 1, 2000);
    camera.position.set(0, 8, 410);

    const EXPLODE_TRAVEL = {
      x: 20,
      y: 18,
      zBack: 72,
      zFront: 118,
    };

    const BASE_DISTANCE = 410;
    const BASE_FOV = 36;

    const fitCameraToModel = () => {
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;

      const savedRot = cameraGroup.rotation.clone();
      const savedPos = cameraGroup.position.clone();
      cameraGroup.rotation.set(0, 0, 0);
      cameraGroup.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(cameraGroup);
      cameraGroup.rotation.copy(savedRot);
      cameraGroup.position.copy(savedPos);

      if (box.isEmpty()) return;

      box.min.x -= EXPLODE_TRAVEL.x;
      box.max.x += EXPLODE_TRAVEL.x;
      box.min.y -= EXPLODE_TRAVEL.y;
      box.max.y += EXPLODE_TRAVEL.y;
      box.min.z -= EXPLODE_TRAVEL.zBack;
      box.max.z += EXPLODE_TRAVEL.zFront;

      const radius =
        Math.hypot(
          Math.max(Math.abs(box.min.x), Math.abs(box.max.x)),
          Math.max(Math.abs(box.min.y), Math.abs(box.max.y)),
          Math.max(Math.abs(box.min.z), Math.abs(box.max.z))
        ) + 4;

      const halfHeightAtBase = BASE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2));
      const scale = Math.max(1, radius / halfHeightAtBase);

      camera.fov = THREE.MathUtils.radToDeg(
        2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * scale)
      );
      camera.aspect = w / h;
      camera.position.z = BASE_DISTANCE;
      camera.updateProjectionMatrix();

      cameraGroup.userData.centerOffsetZ = (EXPLODE_TRAVEL.zFront - EXPLODE_TRAVEL.zBack) / 2;
      renderer.setSize(w * scale, h * scale);
      renderer.domElement.style.marginLeft = `${-((w * scale - w) / 2)}px`;
      renderer.domElement.style.marginTop = `${-((h * scale - h) / 2)}px`;
    };

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // --- Studio Lighting ---
    const ambientLight = new THREE.AmbientLight(0xfff6ec, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(160, 220, 240);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc9a96e, 3.4);
    rimLight.position.set(-180, 140, -160);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xecd8b4, 1.2);
    fillLight.position.set(0, -120, 160);
    scene.add(fillLight);

    // --- Root Assembly Group ---
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);

    // Soft radial ground shadow disc
    const canvasShadow = document.createElement("canvas");
    canvasShadow.width = 128;
    canvasShadow.height = 128;
    const shadowCtx = canvasShadow.getContext("2d");
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(20, 16, 12, 0.48)");
      grad.addColorStop(0.45, "rgba(20, 16, 12, 0.22)");
      grad.addColorStop(1, "rgba(20, 16, 12, 0)");
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(canvasShadow);
    const shadowGeo = new THREE.PlaneGeometry(260, 170);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -50;
    scene.add(shadowMesh);

    // --- Materials for Falcon P-35 ---
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x181614,
      roughness: 0.42,
      metalness: 0.52,
    });

    const slideMaterial = new THREE.MeshStandardMaterial({
      color: 0x22201e,
      roughness: 0.35,
      metalness: 0.7,
    });

    const lensGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.28,
      metalness: 0.88,
    });

    const lensCapMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1a18,
      roughness: 0.38,
      metalness: 0.6,
    });

    // Optical Glass Front Element (Multi-coated photographic glass)
    const glassGeo = new THREE.CylinderGeometry(31.8, 31.8, 1.8, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1420,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.75,
      transparent: true,
      opacity: 0.9,
      ior: 1.52,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.rotation.x = Math.PI / 2;
    glassMesh.position.set(0, 0, 72.0);
    cameraGroup.add(glassMesh);

    // Optical Aperture Blades Ring
    const irisRingGeo = new THREE.RingGeometry(10, 26, 32);
    const irisRingMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      side: THREE.DoubleSide,
    });
    const irisMesh = new THREE.Mesh(irisRingGeo, irisRingMat);
    irisMesh.position.set(0, 0, 54.0);
    cameraGroup.add(irisMesh);

    // Golden Accent Ring around Front Element
    const goldRingGeo = new THREE.TorusGeometry(32.4, 1.2, 16, 48);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf3d692,
      roughness: 0.2,
      metalness: 0.95,
    });
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRingMesh.position.set(0, 0, 73.0);
    cameraGroup.add(goldRingMesh);

    // --- Authentic Prealigned Falcon P-35 CAD Parts ---
    const loadedParts: { [key: string]: THREE.Mesh } = {};
    const partsToLoad = [
      { key: "body", file: "part_body.stl", mat: bodyMaterial },
      { key: "filmBackFront", file: "part_film_back_front.stl", mat: bodyMaterial },
      { key: "filmBackBody", file: "part_film_back_body.stl", mat: bodyMaterial },
      { key: "filmBackSlide", file: "part_film_back_slide.stl", mat: slideMaterial },
      { key: "lensOuter", file: "part_lens_outer.stl", mat: lensGoldMaterial },
      { key: "lensMid", file: "part_lens_mid.stl", mat: lensGoldMaterial },
      { key: "lensInner", file: "part_lens_inner.stl", mat: lensGoldMaterial },
      { key: "lensCap", file: "part_lens_cap.stl", mat: lensCapMaterial },
    ];

    const stlLoader = new STLLoader();

    // Fast parallel multiplexed streaming (Zero blocking overlay)
    Promise.all(
      partsToLoad.map(async (p) => {
        try {
          const res = await fetch(`/models/falcon-camera/anim/${p.file}`);
          if (!res.ok) return;
          const arrayBuf = await res.arrayBuffer();
          if (isDisposed) return;
          const geo = stlLoader.parse(arrayBuf);
          geo.computeVertexNormals();
          const mesh = new THREE.Mesh(geo, p.mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          cameraGroup.add(mesh);
          loadedParts[p.key] = mesh;
        } catch (err) {
          console.warn(`[Falcon Camera] Failed to stream ${p.file}:`, err);
        }
      })
    ).then(() => {
      if (!isDisposed) {
        fitCameraToModel();
        setIsReady(true);
      }
    });

    // --- Performance Controller: Auto-pause when scrolled away or tab hidden ---
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const resizeObserver = new ResizeObserver(() => {
      if (!container || isDisposed) return;
      fitCameraToModel();
    });
    resizeObserver.observe(container);

    // --- Mouse Rotation Controls ---
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      rotTarget.current.y += dx * 0.008;
      rotTarget.current.x = Math.max(-0.45, Math.min(0.45, rotTarget.current.x + dy * 0.006));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const domEl = renderer.domElement;
    domEl.style.pointerEvents = "none";

    const dragTarget = container.parentElement ?? container;
    dragTarget.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // --- Smooth 12-Second Optical Disassembly & Reassembly Cycle ---
    const getExplodeFactor = (t: number) => {
      const period = 12;
      const cycleTime = t % period;
      const progress = cycleTime / period;

      if (progress < 0.25) return 0;
      if (progress < 0.5) {
        const p = (progress - 0.25) / 0.25;
        return 0.5 - 0.5 * Math.cos(p * Math.PI);
      }
      if (progress < 0.75) return 1;
      const p = (progress - 0.75) / 0.25;
      return 0.5 + 0.5 * Math.cos(p * Math.PI);
    };

    // --- High-Efficiency Render Loop ---
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isDisposed) return;

      // Heavy efficiency: Completely pause WebGL computations and draw calls when offscreen
      if (!isVisible.current) return;

      time += 0.014;

      // 1. Calculate disassembly factor
      const factor = getExplodeFactor(time);

      // 2. Animate exploded positions along optical Z axis with balanced spacing
      if (loadedParts.lensOuter) loadedParts.lensOuter.position.z = 28 * factor;
      if (loadedParts.lensMid) loadedParts.lensMid.position.z = 58 * factor;
      if (loadedParts.lensInner) loadedParts.lensInner.position.z = 88 * factor;
      if (loadedParts.lensCap) loadedParts.lensCap.position.z = 118 * factor;

      glassMesh.position.z = 72.0 + 118 * factor;
      goldRingMesh.position.z = 73.0 + 118 * factor;
      irisMesh.position.z = 54.0 + 74 * factor;

      if (loadedParts.filmBackFront) loadedParts.filmBackFront.position.z = -36 * factor;
      if (loadedParts.filmBackBody) loadedParts.filmBackBody.position.z = -72 * factor;
      if (loadedParts.filmBackSlide) {
        loadedParts.filmBackSlide.position.z = -22 * factor;
        loadedParts.filmBackSlide.position.y = 18 * factor;
      }

      // Camera depth and shadow scale during exploded state
      camera.position.z = 410 + 40 * factor;
      cameraGroup.position.x = 20 * factor;
      shadowMesh.scale.set(1 + 0.2 * factor, 1 + 0.3 * factor, 1);

      // 3. Smooth inertial damping & gentle idle float
      if (!isDragging.current) {
        const idleX = Math.sin(time * 0.6) * 0.035;
        const idleY = Math.cos(time * 0.45) * 0.055;
        rotCurrent.current.x += (rotTarget.current.x + idleX - rotCurrent.current.x) * 0.06;
        rotCurrent.current.y += (rotTarget.current.y + idleY - rotCurrent.current.y) * 0.06;
      } else {
        rotCurrent.current.x += (rotTarget.current.x - rotCurrent.current.x) * 0.15;
        rotCurrent.current.y += (rotTarget.current.y - rotCurrent.current.y) * 0.15;
      }

      cameraGroup.rotation.x = rotCurrent.current.x;
      cameraGroup.rotation.y = rotCurrent.current.y;
      cameraGroup.position.y = Math.sin(time * 0.8) * 3.5;

      const offsetZ = ((EXPLODE_TRAVEL.zFront - EXPLODE_TRAVEL.zBack) / 2) * factor;
      cameraGroup.position.z = -offsetZ;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      dragTarget.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (container && domEl.parentNode === container) {
        container.removeChild(domEl);
      }
      renderer.dispose();
      bodyMaterial.dispose();
      slideMaterial.dispose();
      lensGoldMaterial.dispose();
      lensCapMaterial.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      irisRingGeo.dispose();
      irisRingMat.dispose();
      goldRingGeo.dispose();
      goldRingMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();

      Object.values(loadedParts).forEach((mesh) => {
        if (mesh && mesh.geometry) mesh.geometry.dispose();
      });
    };
  }, [isDesktop]);

  if (!isDesktop) {
    return null;
  }

  const triggerShutter = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 240);
  };

  return (
    <div
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
        isReady ? "opacity-100" : "opacity-0"
      } ${className}`}
      onClick={triggerShutter}
      title="Hover and drag to inspect Falcon P-35 optics in 3D"
    >
      <div ref={mountRef} className="w-full h-full" />
      {shutterFlash && (
        <div className="absolute inset-0 bg-white/95 pointer-events-none rounded-2xl animate-fade-out z-30 transition-opacity duration-200" />
      )}
    </div>
  );
}

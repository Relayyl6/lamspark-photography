"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Nikon3DCameraProps {
  className?: string;
  showBadges?: boolean;
}

export function Nikon3DCamera({ className = "" }: Nikon3DCameraProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Interaction refs
  const isDragging = useRef(false);
  const isIntersecting = useRef(true);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const rotTarget = useRef({ x: 0.12, y: -0.42 });
  const rotCurrent = useRef({ x: 0.12, y: -0.42 });

  // Stringent contingency: only activate 3D WebGL engine on desktop with hover capability
  useEffect(() => {
    const checkEnvironment = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      const canHover = window.matchMedia("(hover: hover)").matches;
      setIsDesktop(isLargeScreen && canHover);
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
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 1, 2000);
    camera.position.set(0, 8, 410);

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

    // --- Materials for Assembled Parts ---
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

    // Front Optical Element
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

    // Golden Accent Ring
    const goldRingGeo = new THREE.TorusGeometry(32.4, 1.2, 16, 48);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf3d692,
      roughness: 0.2,
      metalness: 0.95,
    });
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRingMesh.position.set(0, 0, 73.0);
    cameraGroup.add(goldRingMesh);

    // --- Ultra-Efficient Procedural Camera Components (0 network latency) ---
    const proceduralParts: { [key: string]: THREE.Mesh } = {};

    // 1. Camera Body Box
    const bodyGeo = new THREE.BoxGeometry(82, 64, 46);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.position.set(0, 0, 0);
    cameraGroup.add(bodyMesh);
    proceduralParts["body"] = bodyMesh;

    // Viewfinder Top Housing
    const prismGeo = new THREE.CylinderGeometry(18, 24, 16, 4);
    prismGeo.rotateY(Math.PI / 4);
    const prismMesh = new THREE.Mesh(prismGeo, bodyMaterial);
    prismMesh.position.set(0, 38, -4);
    bodyMesh.add(prismMesh);

    // 2. Film Back Body
    const filmBackBodyGeo = new THREE.BoxGeometry(80, 60, 24);
    const filmBackBodyMesh = new THREE.Mesh(filmBackBodyGeo, bodyMaterial);
    filmBackBodyMesh.position.set(0, 0, -35);
    cameraGroup.add(filmBackBodyMesh);
    proceduralParts["filmBackBody"] = filmBackBodyMesh;

    // 3. Film Back Slide
    const slideGeo = new THREE.BoxGeometry(6, 68, 20);
    const slideMesh = new THREE.Mesh(slideGeo, slideMaterial);
    slideMesh.position.set(43, 0, -32);
    cameraGroup.add(slideMesh);
    proceduralParts["filmBackSlide"] = slideMesh;

    // 4. Lens Outer Barrel
    const lensOuterGeo = new THREE.CylinderGeometry(34, 35, 18, 32);
    lensOuterGeo.rotateX(Math.PI / 2);
    const lensOuterMesh = new THREE.Mesh(lensOuterGeo, lensGoldMaterial);
    lensOuterMesh.position.set(0, 0, 30);
    cameraGroup.add(lensOuterMesh);
    proceduralParts["lensOuter"] = lensOuterMesh;

    // 5. Lens Mid Barrel
    const lensMidGeo = new THREE.CylinderGeometry(30, 31, 24, 32);
    lensMidGeo.rotateX(Math.PI / 2);
    const lensMidMesh = new THREE.Mesh(lensMidGeo, lensGoldMaterial);
    lensMidMesh.position.set(0, 0, 48);
    cameraGroup.add(lensMidMesh);
    proceduralParts["lensMid"] = lensMidMesh;

    // 6. Lens Cap Bezel
    const lensCapGeo = new THREE.CylinderGeometry(34, 34, 6, 32);
    lensCapGeo.rotateX(Math.PI / 2);
    const lensCapMesh = new THREE.Mesh(lensCapGeo, lensCapMaterial);
    lensCapMesh.position.set(0, 0, 66);
    cameraGroup.add(lensCapMesh);
    proceduralParts["lensCap"] = lensCapMesh;

    // --- Visibility Observer (Pause render loop when scrolled offscreen) ---
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

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

    const dragTarget = container.parentElement ?? container;
    dragTarget.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // --- Gentle Float & Render Loop ---
    let time = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isDisposed) return;

      // Heavy efficiency: do not render or calculate if scrolled offscreen
      if (!isIntersecting.current) return;

      time += 0.016;

      // Smooth damping rotation
      rotCurrent.current.x += (rotTarget.current.x - rotCurrent.current.x) * 0.08;
      rotCurrent.current.y += (rotTarget.current.y - rotCurrent.current.y) * 0.08;

      // Gentle floating animation
      cameraGroup.position.y = Math.sin(time * 1.2) * 4;
      cameraGroup.rotation.x = rotCurrent.current.x + Math.cos(time * 0.9) * 0.03;
      cameraGroup.rotation.y = rotCurrent.current.y + Math.sin(time * 0.7) * 0.04;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      intersectionObserver.disconnect();
      window.removeEventListener("resize", handleResize);

      dragTarget.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
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

      Object.values(proceduralParts).forEach((mesh) => {
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
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing ${className}`}
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

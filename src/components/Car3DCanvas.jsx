import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function Car3DCanvas() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // --- SCENE, CAMERA, RENDERER ---
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xf8fafc, 0.012);

        const camera = new THREE.PerspectiveCamera(
            34,
            container.clientWidth / container.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 1.6, 7.8);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(renderer.domElement);

        // --- PHOTOREALISTIC HDR ENVIRONMENT MAP (RoomEnvironment) ---
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const roomEnv = new RoomEnvironment();
        const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
        scene.environment = envTexture;
        roomEnv.dispose();

        // --- LIGHTING (Studio Photoreal Lighting) ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        // Key Light with soft realistic shadows
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
        keyLight.position.set(6, 12, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0001;
        keyLight.shadow.normalBias = 0.02;
        scene.add(keyLight);

        // Sky Blue Metallic Edge Rim Light
        const skyBlueLight = new THREE.DirectionalLight(0x0ea5e9, 3.6);
        skyBlueLight.position.set(-8, 7, -6);
        scene.add(skyBlueLight);

        // Front-Left Soft Cool Fill Light
        const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
        fillLight.position.set(-6, 3, 6);
        scene.add(fillLight);

        // Ground bounce fill
        const bounceLight = new THREE.DirectionalLight(0xf1f5f9, 1.0);
        bounceLight.position.set(0, -5, 0);
        scene.add(bounceLight);

        // --- PHOTOREALISTIC PBR MATERIALS ---
        const skyBluePowderCoat = new THREE.MeshPhysicalMaterial({
            color: 0x0284c7, // Vibrant Sky Blue
            roughness: 0.15,
            metalness: 0.35,
            clearcoat: 0.9,
            clearcoatRoughness: 0.06,
            reflectivity: 0.95,
        });

        const brushedSteelMaterial = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.26,
            metalness: 0.88,
        });

        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.03,
            metalness: 1.0,
        });

        const foxBronzeMaterial = new THREE.MeshStandardMaterial({
            color: 0x6e4a2c,
            roughness: 0.22,
            metalness: 0.9,
        });

        const foxBlueMaterial = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.18,
            metalness: 0.92,
        });

        const whiteRimMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.16,
            metalness: 0.15,
            clearcoat: 0.8,
            clearcoatRoughness: 0.08,
        });

        const rubberTireMaterial = new THREE.MeshStandardMaterial({
            color: 0x14181c,
            roughness: 0.88,
            metalness: 0.04,
        });

        const whiteCompositeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf8fafc,
            roughness: 0.32,
            metalness: 0.05,
            clearcoat: 0.45,
        });

        const rubberTrimMaterial = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.75,
            metalness: 0.05,
        });

        const darkHardwareMaterial = new THREE.MeshStandardMaterial({
            color: 0x24272c,
            roughness: 0.45,
            metalness: 0.75,
        });

        const brakeRotorMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4d4d8,
            roughness: 0.18,
            metalness: 0.95,
        });

        // --- 3D VEHICLE ASSEMBLY ---
        const carRoot = new THREE.Group();
        scene.add(carRoot);

        const frameGroup = new THREE.Group();
        carRoot.add(frameGroup);

        const addTube = (start, end, radius = 0.032, mat = skyBluePowderCoat) => {
            const vStart = new THREE.Vector3(...start);
            const vEnd = new THREE.Vector3(...end);
            const dist = vStart.distanceTo(vEnd);
            const geom = new THREE.CylinderGeometry(radius, radius, dist, 16);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            const midpoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
            mesh.position.copy(midpoint);
            mesh.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                vEnd.clone().sub(vStart).normalize()
            );
            frameGroup.add(mesh);
            return mesh;
        };

        // ==========================================
        // 1. SKY-BLUE TUBULAR ROLL CAGE & CHASSIS
        // ==========================================
        const hoopTopY = 1.38;
        const hoopWidth = 0.46;
        addTube([-hoopWidth, hoopTopY, -0.25], [hoopWidth, hoopTopY, -0.25], 0.034);
        addTube([-hoopWidth, hoopTopY, -0.25], [-0.58, 0.0, -0.25], 0.034);
        addTube([hoopWidth, hoopTopY, -0.25], [0.58, 0.0, -0.25], 0.034);

        // Top Square Loop
        const loopH = 0.22;
        const loopW = 0.20;
        addTube([-loopW, hoopTopY, -0.25], [-loopW, hoopTopY + loopH, -0.25], 0.022);
        addTube([loopW, hoopTopY, -0.25], [loopW, hoopTopY + loopH, -0.25], 0.022);
        addTube([-loopW, hoopTopY + loopH, -0.25], [loopW, hoopTopY + loopH, -0.25], 0.022);

        // Front Windshield Upper Bar
        const frontTopY = 1.26;
        const frontTopZ = 0.45;
        const frontTopW = 0.40;
        addTube([-frontTopW, frontTopY, frontTopZ], [frontTopW, frontTopY, frontTopZ], 0.032);

        // Roof Bars
        addTube([-frontTopW, frontTopY, frontTopZ], [-hoopWidth, hoopTopY, -0.25], 0.032);
        addTube([frontTopW, frontTopY, frontTopZ], [hoopWidth, hoopTopY, -0.25], 0.032);

        // A-Pillars
        const dashY = 0.48;
        const dashZ = 0.85;
        const dashW = 0.52;
        addTube([-frontTopW, frontTopY, frontTopZ], [-dashW, dashY, dashZ], 0.034);
        addTube([frontTopW, frontTopY, frontTopZ], [dashW, dashY, dashZ], 0.034);
        addTube([-dashW, dashY, dashZ], [dashW, dashY, dashZ], 0.032);

        // Front Crash Box
        const noseY = 0.35;
        const noseZ = 1.65;
        const noseW = 0.42;
        addTube([-noseW, noseY, noseZ], [noseW, noseY, noseZ], 0.034);
        addTube([-noseW, 0.05, noseZ], [noseW, 0.05, noseZ], 0.034);
        addTube([-noseW, 0.05, noseZ], [-noseW, noseY, noseZ], 0.032);
        addTube([noseW, 0.05, noseZ], [noseW, noseY, noseZ], 0.032);

        addTube([-dashW, dashY, dashZ], [-noseW, noseY, noseZ], 0.032);
        addTube([dashW, dashY, dashZ], [noseW, noseY, noseZ], 0.032);
        addTube([-0.58, 0.05, dashZ], [-noseW, 0.05, noseZ], 0.034);
        addTube([0.58, 0.05, dashZ], [noseW, 0.05, noseZ], 0.034);

        addTube([0, noseY, noseZ], [0, dashY, dashZ], 0.026);
        addTube([-dashW, dashY, dashZ], [0.58, 0.05, dashZ], 0.024);
        addTube([dashW, dashY, dashZ], [-0.58, 0.05, dashZ], 0.024);

        // Lower Frame Rails
        const rearRailZ = -1.15;
        addTube([-0.58, 0.05, dashZ], [-0.58, 0.05, rearRailZ], 0.034);
        addTube([0.58, 0.05, dashZ], [0.58, 0.05, rearRailZ], 0.034);
        addTube([-0.58, 0.05, rearRailZ], [0.58, 0.05, rearRailZ], 0.034);
        addTube([-0.58, 0.05, 0.0], [0.58, 0.05, 0.0], 0.03);

        const waistY = 0.42;
        addTube([-0.58, waistY, dashZ], [-0.58, waistY, -0.25], 0.03);
        addTube([0.58, waistY, dashZ], [0.58, waistY, -0.25], 0.03);
        addTube([-0.58, waistY, dashZ], [-0.58, 0.05, -0.25], 0.026);
        addTube([0.58, waistY, dashZ], [0.58, 0.05, -0.25], 0.026);

        addTube([-hoopWidth, hoopTopY, -0.25], [-0.48, 0.45, rearRailZ], 0.032);
        addTube([hoopWidth, hoopTopY, -0.25], [0.48, 0.45, rearRailZ], 0.032);
        addTube([-0.48, 0.45, rearRailZ], [0.48, 0.45, rearRailZ], 0.03);
        addTube([-0.48, 0.45, rearRailZ], [-0.58, 0.05, rearRailZ], 0.03);
        addTube([0.48, 0.45, rearRailZ], [0.58, 0.05, rearRailZ], 0.03);

        // Steering Console & Wheel
        const dashPlateGeom = new THREE.BoxGeometry(0.38, 0.22, 0.015);
        const dashPlate = new THREE.Mesh(dashPlateGeom, skyBluePowderCoat);
        dashPlate.position.set(0, 0.58, 0.72);
        dashPlate.rotation.x = -0.55;
        dashPlate.castShadow = true;
        carRoot.add(dashPlate);

        const steerCol = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.35, 12),
            darkHardwareMaterial
        );
        steerCol.position.set(0, 0.65, 0.58);
        steerCol.rotation.x = 0.6;
        carRoot.add(steerCol);

        const steerWheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.13, 0.016, 10, 24),
            darkHardwareMaterial
        );
        steerWheel.position.set(0, 0.74, 0.44);
        steerWheel.rotation.x = -0.6;
        carRoot.add(steerWheel);

        // ==========================================
        // 2. WHITE COMPOSITE FIREWALL / SEATBACK PANEL
        // ==========================================
        const seatGroup = new THREE.Group();
        seatGroup.position.set(0, 0.66, -0.22);
        seatGroup.rotation.x = -0.18;

        const panelShape = new THREE.Shape();
        const pW = 0.44;
        const pH = 1.04;
        const rad = 0.12;
        panelShape.moveTo(-pW + rad, 0);
        panelShape.lineTo(pW - rad, 0);
        panelShape.quadraticCurveTo(pW, 0, pW, rad);
        panelShape.lineTo(pW * 0.76, pH - rad);
        panelShape.quadraticCurveTo(pW * 0.76, pH, pW * 0.76 - rad, pH);
        panelShape.lineTo(-pW * 0.76 + rad, pH);
        panelShape.quadraticCurveTo(-pW * 0.76, pH, -pW * 0.76, pH - rad);
        panelShape.lineTo(-pW, rad);
        panelShape.quadraticCurveTo(-pW, 0, -pW + rad, 0);

        const extrudeSettings = { depth: 0.018, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.008, bevelThickness: 0.008 };
        const firewallGeom = new THREE.ExtrudeGeometry(panelShape, extrudeSettings);
        firewallGeom.center();
        const firewallMesh = new THREE.Mesh(firewallGeom, whiteCompositeMaterial);
        firewallMesh.castShadow = true;
        firewallMesh.receiveShadow = true;
        seatGroup.add(firewallMesh);

        const trimMesh = new THREE.Mesh(firewallGeom, rubberTrimMaterial);
        trimMesh.scale.set(1.025, 1.025, 0.85);
        trimMesh.position.z = -0.004;
        seatGroup.add(trimMesh);

        const createHarnessSlot = (x) => {
            const slotGeom = new THREE.BoxGeometry(0.09, 0.035, 0.03);
            const slotMesh = new THREE.Mesh(slotGeom, rubberTrimMaterial);
            slotMesh.position.set(x, 0.14, 0.01);
            return slotMesh;
        };
        seatGroup.add(createHarnessSlot(-0.11));
        seatGroup.add(createHarnessSlot(0.11));
        carRoot.add(seatGroup);

        // Battery Box & Floor Pan
        const batteryBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.12, 0.42),
            darkHardwareMaterial
        );
        batteryBox.position.set(0, 0.14, 0.12);
        batteryBox.castShadow = true;
        carRoot.add(batteryBox);

        const floorPan = new THREE.Mesh(
            new THREE.BoxGeometry(0.96, 0.015, 1.35),
            brushedSteelMaterial
        );
        floorPan.position.set(0, 0.05, 0.25);
        floorPan.receiveShadow = true;
        carRoot.add(floorPan);

        // ==========================================
        // 3. SUSPENSION A-ARMS & FOX AIR SHOCKS
        // ==========================================
        const frontHubLeft = [-0.94, 0.08, 1.15];
        const frontHubRight = [0.94, 0.08, 1.15];

        addTube([-0.45, 0.06, 1.35], frontHubLeft, 0.022, brushedSteelMaterial);
        addTube([-0.45, 0.06, 0.95], frontHubLeft, 0.022, brushedSteelMaterial);
        addTube([0.45, 0.06, 1.35], frontHubRight, 0.022, brushedSteelMaterial);
        addTube([0.45, 0.06, 0.95], frontHubRight, 0.022, brushedSteelMaterial);

        const upperHubLeft = [-0.90, 0.28, 1.15];
        const upperHubRight = [0.90, 0.28, 1.15];
        addTube([-0.42, 0.32, 1.25], upperHubLeft, 0.020, brushedSteelMaterial);
        addTube([-0.42, 0.32, 0.95], upperHubLeft, 0.020, brushedSteelMaterial);
        addTube([0.42, 0.32, 1.25], upperHubRight, 0.020, brushedSteelMaterial);
        addTube([0.42, 0.32, 0.95], upperHubRight, 0.020, brushedSteelMaterial);

        const createFoxAirShock = (isLeft = true) => {
            const shockGroup = new THREE.Group();
            const sign = isLeft ? -1 : 1;

            const bodyGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.36, 16);
            const shockBody = new THREE.Mesh(bodyGeom, foxBronzeMaterial);
            shockBody.position.y = 0.16;
            shockBody.castShadow = true;
            shockGroup.add(shockBody);

            const capGeom = new THREE.CylinderGeometry(0.038, 0.038, 0.04, 16);
            const topCap = new THREE.Mesh(capGeom, foxBlueMaterial);
            topCap.position.y = 0.34;
            const bottomCap = new THREE.Mesh(capGeom, foxBlueMaterial);
            bottomCap.position.y = -0.02;
            shockGroup.add(topCap);
            shockGroup.add(bottomCap);

            const shaftGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.32, 16);
            const shockShaft = new THREE.Mesh(shaftGeom, chromeMaterial);
            shockShaft.position.y = -0.14;
            shockGroup.add(shockShaft);

            const canGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.18, 14);
            const shockCan = new THREE.Mesh(canGeom, darkHardwareMaterial);
            shockCan.position.set(0.046 * sign, 0.2, 0.02);
            shockCan.castShadow = true;
            shockGroup.add(shockCan);

            return shockGroup;
        };

        const flShock = createFoxAirShock(true);
        flShock.position.set(-0.68, 0.36, 1.12);
        flShock.rotation.z = -0.42;
        flShock.rotation.x = 0.18;
        carRoot.add(flShock);

        const frShock = createFoxAirShock(false);
        frShock.position.set(0.68, 0.36, 1.12);
        frShock.rotation.z = 0.42;
        frShock.rotation.x = 0.18;
        carRoot.add(frShock);

        const rearHubLeft = [-0.98, 0.12, -0.95];
        const rearHubRight = [0.98, 0.12, -0.95];
        addTube([-0.55, 0.08, -0.3], rearHubLeft, 0.026, brushedSteelMaterial);
        addTube([0.55, 0.08, -0.3], rearHubRight, 0.026, brushedSteelMaterial);

        const rlShock = createFoxAirShock(true);
        rlShock.position.set(-0.72, 0.42, -0.85);
        rlShock.rotation.z = -0.32;
        rlShock.rotation.x = -0.15;
        carRoot.add(rlShock);

        const rrShock = createFoxAirShock(false);
        rrShock.position.set(0.72, 0.42, -0.85);
        rrShock.rotation.z = 0.32;
        rrShock.rotation.x = -0.15;
        carRoot.add(rrShock);

        // ==========================================
        // 4. 4 KNOBBY ATV TIRES & WHITE STEEL RIMS
        // ==========================================
        const wheels = [];

        const createBajaWheel = (isFront = true) => {
            const wheelUnit = new THREE.Group();

            const tireRadius = isFront ? 0.42 : 0.46;
            const tireWidth = isFront ? 0.28 : 0.34;
            const rimRadius = tireRadius * 0.58;

            const tireGeom = new THREE.CylinderGeometry(
                tireRadius,
                tireRadius,
                tireWidth,
                32
            );
            const tireMesh = new THREE.Mesh(tireGeom, rubberTireMaterial);
            tireMesh.rotation.z = Math.PI / 2;
            tireMesh.castShadow = true;
            tireMesh.receiveShadow = true;
            wheelUnit.add(tireMesh);

            const treadCount = 16;
            const treadGroup = new THREE.Group();
            for (let i = 0; i < treadCount; i++) {
                const angle = (i / treadCount) * Math.PI * 2;
                const lugGeom = new THREE.BoxGeometry(tireWidth * 0.44, 0.045, 0.068);
                const lugLeft = new THREE.Mesh(lugGeom, rubberTireMaterial);
                lugLeft.position.set(
                    -tireWidth * 0.22,
                    Math.sin(angle) * (tireRadius + 0.016),
                    Math.cos(angle) * (tireRadius + 0.016)
                );
                lugLeft.rotation.x = angle;
                lugLeft.rotation.y = 0.26;
                lugLeft.castShadow = true;
                treadGroup.add(lugLeft);

                const lugRight = new THREE.Mesh(lugGeom, rubberTireMaterial);
                lugRight.position.set(
                    tireWidth * 0.22,
                    Math.sin(angle + 0.1) * (tireRadius + 0.016),
                    Math.cos(angle + 0.1) * (tireRadius + 0.016)
                );
                lugRight.rotation.x = angle + 0.1;
                lugRight.rotation.y = -0.26;
                lugRight.castShadow = true;
                treadGroup.add(lugRight);
            }
            wheelUnit.add(treadGroup);

            const rimGeom = new THREE.CylinderGeometry(
                rimRadius,
                rimRadius * 0.86,
                tireWidth + 0.02,
                24
            );
            const rimMesh = new THREE.Mesh(rimGeom, whiteRimMaterial);
            rimMesh.rotation.z = Math.PI / 2;
            rimMesh.castShadow = true;
            wheelUnit.add(rimMesh);

            const rotorGeom = new THREE.CylinderGeometry(
                rimRadius * 0.72,
                rimRadius * 0.72,
                0.015,
                24
            );
            const brakeRotor = new THREE.Mesh(rotorGeom, brakeRotorMaterial);
            brakeRotor.position.set(-0.06, 0, 0);
            brakeRotor.rotation.z = Math.PI / 2;
            wheelUnit.add(brakeRotor);

            const caliper = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.07, 0.1),
                skyBluePowderCoat
            );
            caliper.position.set(-0.06, rimRadius * 0.5, 0.02);
            wheelUnit.add(caliper);

            const hubGeom = new THREE.CylinderGeometry(0.08, 0.08, tireWidth + 0.038, 16);
            const hubMesh = new THREE.Mesh(hubGeom, darkHardwareMaterial);
            hubMesh.rotation.z = Math.PI / 2;
            wheelUnit.add(hubMesh);

            for (let b = 0; b < 4; b++) {
                const bAngle = (b / 4) * Math.PI * 2;
                const bolt = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.016, 0.016, tireWidth + 0.044, 6),
                    chromeMaterial
                );
                bolt.position.set(
                    0,
                    Math.sin(bAngle) * (rimRadius * 0.52),
                    Math.cos(bAngle) * (rimRadius * 0.52)
                );
                bolt.rotation.z = Math.PI / 2;
                wheelUnit.add(bolt);
            }

            return { group: wheelUnit, tireMesh, treadGroup };
        };

        const wheelPositions = [
            { pos: [-0.94, 0.08, 1.15], isFront: true, isLeft: true },
            { pos: [0.94, 0.08, 1.15], isFront: true, isLeft: false },
            { pos: [-1.02, 0.12, -0.95], isFront: false, isLeft: true },
            { pos: [1.02, 0.12, -0.95], isFront: false, isLeft: false },
        ];

        wheelPositions.forEach(({ pos, isFront, isLeft }) => {
            const wheelObj = createBajaWheel(isFront);
            wheelObj.group.position.set(...pos);
            if (!isLeft) {
                wheelObj.group.rotation.y = Math.PI;
            }
            carRoot.add(wheelObj.group);
            wheels.push(wheelObj);
        });

        // Soft Ground Contact Shadow
        const createShadowCanvas = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
            grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
            grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.18)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);
            return canvas;
        };

        const shadowTex = new THREE.CanvasTexture(createShadowCanvas());
        const shadowPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(4.0, 4.6),
            new THREE.MeshBasicMaterial({
                map: shadowTex,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
            })
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.52;
        carRoot.add(shadowPlane);

        // --- PROMINENT PARALLAX INTERACTION STATE ---
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;
        let scrollRatio = 0;

        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            targetMouseX = x * 0.85; // Prominent mouse parallax
            targetMouseY = y * 0.65;
        };

        const handleScroll = () => {
            const currentY = window.scrollY || window.pageYOffset;
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            scrollRatio = Math.min(1, Math.max(0, currentY / maxScroll));
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });

        let animationFrameId;
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // Smooth high-inertia lerping for mouse parallax
            mouseX += (targetMouseX - mouseX) * 0.055;
            mouseY += (targetMouseY - mouseY) * 0.055;

            const isMobile = window.innerWidth < 768;
            const aspect = container.clientWidth / (container.clientHeight || 1);
            
            // Dramatic section staging with prominent 3D parallax shifts
            let targetX, targetY, targetZ, targetRotY, targetRotX, targetRotZ, targetScale;

            if (scrollRatio < 0.12) {
                // Section 0: Hero Stage (Positioned to the right with subtle overlap with left team name)
                const t = scrollRatio / 0.12;
                const heroRightX = isMobile ? 0.32 : Math.min(2.1, Math.max(1.55, aspect * 0.96));
                targetX = heroRightX - t * 0.25;
                targetY = isMobile ? -0.16 : 0.02;
                targetZ = 0.28;
                targetRotY = -0.48 + t * 0.22;
                targetRotX = 0.12;
                targetRotZ = -0.02;
                targetScale = isMobile ? 1.0 : 1.48; // Large prominent presence
            } else if (scrollRatio < 0.32) {
                // Section 1: Mission Statement (Sweeps dynamically across viewport)
                const t = (scrollRatio - 0.12) / 0.20;
                targetX = isMobile ? 0 : (1.45 - t * 0.6);
                targetY = 0.12 - t * 0.1;
                targetZ = -0.1;
                targetRotY = -0.17 + t * 0.95;
                targetRotX = 0.12 - t * 0.04;
                targetRotZ = 0.03;
                targetScale = isMobile ? 0.98 : 1.36;
            } else if (scrollRatio < 0.58) {
                // Section 2: Tuning & Gauges (Full dramatic 90-degree Side Profile for suspension)
                const t = (scrollRatio - 0.32) / 0.26;
                targetX = isMobile ? 0 : (1.35 + Math.sin(t * Math.PI) * 0.3);
                targetY = 0.06;
                targetZ = 0.15;
                targetRotY = Math.PI * 0.48 + t * 0.35;
                targetRotX = 0.08;
                targetRotZ = -0.03;
                targetScale = isMobile ? 0.96 : 1.38;
            } else if (scrollRatio < 0.82) {
                // Section 3: Materials & Terrains (Aggressive 3/4 Front Zoom)
                const t = (scrollRatio - 0.58) / 0.24;
                targetX = isMobile ? 0 : (1.15 - Math.sin(t * Math.PI) * 0.4);
                targetY = -0.06;
                targetZ = 0.1;
                targetRotY = -0.62 + t * 0.85;
                targetRotX = 0.16;
                targetRotZ = 0.02;
                targetScale = isMobile ? 0.95 : 1.32;
            } else {
                // Section 4: Sponsors & Footer (Grand Centered Finale)
                const t = (scrollRatio - 0.82) / 0.18;
                targetX = isMobile ? 0 : 0.5 * (1 - t);
                targetY = -0.05 + t * 0.1;
                targetZ = 0.25;
                targetRotY = -0.32 + t * 0.15;
                targetRotX = 0.12;
                targetRotZ = 0;
                targetScale = isMobile ? 1.0 : 1.42;
            }

            // Natural micro-hover floating
            const floatY = Math.sin(elapsedTime * 1.3) * 0.045 + Math.cos(elapsedTime * 0.8) * 0.02;
            const floatRotZ = Math.sin(elapsedTime * 1.0) * 0.012;

            // Apply Prominent Parallax (Position + Rotation)
            carRoot.scale.set(targetScale, targetScale, targetScale);
            carRoot.position.x = targetX + mouseX * 0.65; // Prominent horizontal cursor tracking
            carRoot.position.y = targetY + floatY + mouseY * 0.45; // Prominent vertical cursor tracking
            carRoot.position.z = targetZ;

            carRoot.rotation.y = targetRotY + mouseX * 0.55; // Prominent 3D yaw tilt on mouse
            carRoot.rotation.x = targetRotX - mouseY * 0.35; // Prominent 3D pitch tilt on mouse
            carRoot.rotation.z = targetRotZ + floatRotZ + (mouseX * -0.15);

            // Wheel rotation
            wheels.forEach(({ group }) => {
                group.rotation.x += 0.008;
            });

            camera.lookAt(carRoot.position.x * 0.18, carRoot.position.y * 0.25, 0);

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);

            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full fixed inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
        />
    );
}

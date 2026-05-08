class Renderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.initLights();
        this.initTable();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 0.8);
        spotLight.position.set(0, 15, 0);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    initTable() {
        const tableGeo = new THREE.PlaneGeometry(20, 20);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x076324 }); // Green felt
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.rotation.x = -Math.PI / 2;
        table.receiveShadow = true;
        this.scene.add(table);

        // Add a rim or some detail
        const rimGeo = new THREE.BoxGeometry(21, 0.5, 21);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f }); // Wooden rim
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = -0.3;
        this.scene.add(rim);
    }

    createDominoMesh(v1, v2) {
        const group = new THREE.Group();

        // Main body
        const bodyGeo = new THREE.BoxGeometry(1, 0.2, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Divider
        const dividerGeo = new THREE.BoxGeometry(0.9, 0.05, 0.05);
        const dividerMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.y = 0.11;
        group.add(divider);

        // Dots (simplified as small cylinders or spheres)
        this.addDots(group, v1, -0.5);
        this.addDots(group, v2, 0.5);

        return group;
    }

    addDots(group, value, offsetZ) {
        const dotGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

        const dotPositions = {
            0: [],
            1: [[0, 0]],
            2: [[-0.25, -0.25], [0.25, 0.25]],
            3: [[-0.25, -0.25], [0, 0], [0.25, 0.25]],
            4: [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]],
            5: [[-0.25, -0.25], [0.25, -0.25], [0, 0], [-0.25, 0.25], [0.25, 0.25]],
            6: [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0], [0.25, 0], [-0.25, 0.25], [0.25, 0.25]]
        };

        dotPositions[value].forEach(pos => {
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.set(pos[0], 0.11, offsetZ + pos[1]);
            group.add(dot);
        });
    }

    animateTile(mesh, targetPos, targetRot, duration = 500) {
        const startPos = mesh.position.clone();
        const startRot = mesh.rotation.clone();
        const startTime = performance.now();

        const update = () => {
            const now = performance.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Ease out quad
            const ease = 1 - (1 - progress) * (1 - progress);

            mesh.position.lerpVectors(startPos, targetPos, ease);
            mesh.rotation.set(
                startRot.x + (targetRot.x - startRot.x) * ease,
                startRot.y + (targetRot.y - startRot.y) * ease,
                startRot.z + (targetRot.z - startRot.z) * ease
            );

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

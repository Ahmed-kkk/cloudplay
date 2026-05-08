
let scene, camera, renderer, table;
let dominoMeshes = [];

function init3D(containerId) {
    const container = document.getElementById(containerId);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a14);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 30, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directLight.position.set(10, 20, 10);
    directLight.castShadow = true;
    scene.add(directLight);

    // Table
    const tableGeo = new THREE.BoxGeometry(60, 1, 60);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a });
    table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.5;
    table.receiveShadow = true;
    scene.add(table);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function createDominoMesh(v1, v2) {
    const group = new THREE.Group();

    // Domino body
    const bodyGeo = new THREE.BoxGeometry(2, 0.5, 4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Divider line
    const lineGeo = new THREE.PlaneGeometry(1.8, 0.05);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0.26;
    group.add(line);

    // Pips (circles)
    addPips(group, v1, -1);
    addPips(group, v2, 1);

    return group;
}

function addPips(group, value, zOffset) {
    const pipGeo = new THREE.CircleGeometry(0.15, 16);
    const pipMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const positions = {
        1: [[0, 0]],
        2: [[-0.5, 0.5], [0.5, -0.5]],
        3: [[-0.5, 0.5], [0, 0], [0.5, -0.5]],
        4: [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]],
        5: [[-0.5, 0.5], [0.5, 0.5], [0, 0], [-0.5, -0.5], [0.5, -0.5]],
        6: [[-0.5, 0.5], [0.5, 0.5], [-0.5, 0], [0.5, 0], [-0.5, -0.5], [0.5, -0.5]]
    };

    if (positions[value]) {
        positions[value].forEach(p => {
            const pip = new THREE.Mesh(pipGeo, pipMat);
            pip.rotation.x = -Math.PI / 2;
            pip.position.set(p[0], 0.26, zOffset + p[1]);
            group.add(pip);
        });
    }
}

// Export for usage in index.html
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let playerHandMeshes = [];
let boardMeshes = [];

let handClickHandler = null;

function updateHand(hand, onClick) {
    // Clear old hand
    playerHandMeshes.forEach(m => scene.remove(m));
    playerHandMeshes = [];

    const spacing = 3;
    const startX = -(hand.length - 1) * spacing / 2;

    hand.forEach((tile, i) => {
        const mesh = createDominoMesh(tile.v1, tile.v2);
        mesh.position.set(startX + i * spacing, 2, 15);
        mesh.rotation.x = -Math.PI / 4; // Tilt towards player
        mesh.userData = { type: 'hand', index: i, tile };
        scene.add(mesh);
        playerHandMeshes.push(mesh);
    });

    if (handClickHandler) {
        window.removeEventListener('click', handClickHandler);
    }
    handClickHandler = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(playerHandMeshes, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.userData.type !== 'hand') obj = obj.parent;
            if (obj.userData.type === 'hand') {
                onClick(obj.userData.index);
            }
        }
    };
    window.addEventListener('click', handClickHandler);
}

function renderBoard(board) {
    // This function will be called whenever the board changes
    boardMeshes.forEach(m => scene.remove(m));
    boardMeshes = [];

    if (!board.center) return;

    // Center tile
    const centerMesh = createDominoMesh(board.center.tile.v1, board.center.tile.v2);
    centerMesh.rotation.y = Math.PI / 2; // Horizontal for double
    scene.add(centerMesh);
    boardMeshes.push(centerMesh);

    // Render sides
    renderSide(board.top, 0, 1, 0); // direction vector
    renderSide(board.bottom, 0, -1, 0);
    renderSide(board.left, -1, 0, 0);
    renderSide(board.right, 1, 0, 0);
}

function renderSide(sideArray, dx, dz, rotation) {
    let currentPos = new THREE.Vector3(dx * 3, 0, dz * 3);
    sideArray.forEach((item, i) => {
        const mesh = createDominoMesh(item.tile.v1, item.tile.v2);
        mesh.position.copy(currentPos);
        // Determine rotation based on side and values
        // For simplicity, just align with the axis
        if (dx !== 0) mesh.rotation.y = Math.PI / 2;
        scene.add(mesh);
        boardMeshes.push(mesh);
        currentPos.add(new THREE.Vector3(dx * 4.2, 0, dz * 4.2));
    });
}

window.init3D = init3D;
window.createDominoMesh = createDominoMesh;
window.updateHand = updateHand;
window.renderBoard = renderBoard;

/**
 * JS ClawHub - Three.js Background Animation
 * Extracted from agent-js ui/land.html
 * Black wireframe geometries with mouse parallax
 */

function initThreeJS(containerId) {
    const container = document.getElementById(containerId || 'canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Group to hold all geometries
    const group = new THREE.Group();
    scene.add(group);

    // Material: Black Wireframe
    const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    // Geometry 1: Icosahedron
    const geo1 = new THREE.IcosahedronGeometry(8, 0);
    const mesh1 = new THREE.Mesh(geo1, material);
    mesh1.position.x = -15;
    group.add(mesh1);

    // Geometry 2: Torus Knot
    const geo2 = new THREE.TorusKnotGeometry(5, 1.5, 64, 8);
    const mesh2 = new THREE.Mesh(geo2, material);
    mesh2.position.x = 15;
    group.add(mesh2);

    // Geometry 3: Grid Helper (Floor)
    const gridHelper = new THREE.GridHelper(100, 20, 0x000000, 0x000000);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -10;
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Animation Loop
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    const animate = () => {
        requestAnimationFrame(animate);

        // Mechanical Rotation
        mesh1.rotation.x += 0.005;
        mesh1.rotation.y += 0.005;

        mesh2.rotation.x -= 0.005;
        mesh2.rotation.y -= 0.005;

        // Subtle grid movement
        gridHelper.rotation.z += 0.001;

        // Parallax
        group.rotation.y = mouseX * 0.2;
        group.rotation.x = mouseY * 0.2;

        renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Auto-init if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('canvas-container')) {
        initThreeJS();
    }
});

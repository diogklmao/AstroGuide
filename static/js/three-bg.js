// Fundo 3D partilhado — campo de estrelas, planetas em órbita e parallax suave
(function () {
    const canvas = document.getElementById("three-bg");
    if (!canvas || typeof THREE === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        canvas.style.display = "none";
        return;
    }

    const theme = document.body.dataset.bgTheme || "menu";
    const isMenu = theme === "menu";

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isMenu ? 0x030510 : 0x020408, isMenu ? 0.022 : 0.032);

    const camera = new THREE.PerspectiveCamera(
        58,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );
    camera.position.set(0, 0, 26);

    const starCount = 3500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const cA = new THREE.Color(isMenu ? 0xb8d4ff : 0x88ccff);
    const cB = new THREE.Color(isMenu ? 0xffc8e8 : 0x5577ff);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 140;
        positions[i3 + 1] = (Math.random() - 0.5) * 90;
        positions[i3 + 2] = (Math.random() - 0.5) * 140 - 25;
        const mix = Math.random();
        const c = cA.clone().lerp(cB, mix);
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starField = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
            size: isMenu ? 0.12 : 0.14,
            vertexColors: true,
            transparent: true,
            opacity: isMenu ? 0.75 : 0.92,
            sizeAttenuation: true,
            depthWrite: false,
        })
    );
    scene.add(starField);

    const planetGroup = new THREE.Group();
    const configs = isMenu
        ? [
              { color: 0xff9955, r: 0.55, orbit: 7, speed: 0.28 },
              { color: 0x99bbff, r: 0.38, orbit: 11, speed: 0.18 },
              { color: 0xdd99ff, r: 0.28, orbit: 15, speed: 0.12 },
          ]
        : [
              { color: 0xffcc66, r: 0.5, orbit: 8, speed: 0.25 },
              { color: 0x66ddff, r: 0.36, orbit: 12, speed: 0.16 },
              { color: 0x8899ff, r: 0.26, orbit: 16, speed: 0.11 },
          ];

    const planets = configs.map((cfg, i) => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(cfg.r, 20, 20),
            new THREE.MeshStandardMaterial({
                color: cfg.color,
                emissive: cfg.color,
                emissiveIntensity: 0.4,
                metalness: 0.35,
                roughness: 0.45,
                transparent: true,
                opacity: 0.88,
            })
        );
        mesh.userData = { ...cfg, angle: (i / configs.length) * Math.PI * 2 };
        planetGroup.add(mesh);
        return mesh;
    });
    scene.add(planetGroup);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(13, 0.025, 6, 80),
        new THREE.MeshBasicMaterial({
            color: isMenu ? 0x5577cc : 0x33bbee,
            transparent: true,
            opacity: 0.22,
        })
    );
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);

    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(4, 32, 32),
        new THREE.MeshBasicMaterial({
            color: isMenu ? 0x3344aa : 0x115588,
            transparent: true,
            opacity: 0.06,
        })
    );
    scene.add(glow);

    scene.add(new THREE.AmbientLight(0x223355, 0.55));
    const point = new THREE.PointLight(isMenu ? 0x9988ff : 0x44ddff, 1.1, 90);
    point.position.set(12, 6, 18);
    scene.add(point);

    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener(
        "mousemove",
        (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        },
        { passive: true }
    );

    let t = 0;
    function animate() {
        requestAnimationFrame(animate);
        t += 0.007;

        starField.rotation.y += 0.00035;
        starField.rotation.x = Math.sin(t * 0.25) * 0.015;

        planets.forEach((mesh) => {
            const { orbit, speed, angle } = mesh.userData;
            const a = angle + t * speed;
            mesh.position.set(
                Math.cos(a) * orbit,
                Math.sin(a * 2) * 0.7,
                Math.sin(a) * orbit
            );
            mesh.rotation.y += 0.012;
        });

        planetGroup.rotation.y += 0.0008;
        ring.rotation.z += 0.0015;
        glow.scale.setScalar(1 + Math.sin(t * 0.8) * 0.08);

        camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.018;
        camera.position.y += (-mouseY * 1.4 - camera.position.y) * 0.018;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.body.classList.add("three-ready");
})();

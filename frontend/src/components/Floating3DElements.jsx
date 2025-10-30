import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Floating3DElements = () => {
  const mountRef = useRef(null);
  const animationRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Theme-based lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.6 : 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(
      isDarkMode ? 0x9333ea : 0x6366f1, 
      isDarkMode ? 1 : 0.8, 
      100
    );
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(
      isDarkMode ? 0xec4899 : 0xf43f5e, 
      isDarkMode ? 1 : 0.8, 
      100
    );
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(
      isDarkMode ? 0xfbbf24 : 0xf59e0b, 
      isDarkMode ? 0.8 : 1, 
      100
    );
    pointLight3.position.set(0, 10, -10);
    scene.add(pointLight3);

    // Theme-based materials
    const createMaterial = (darkColor, lightColor) => {
      const color = isDarkMode ? darkColor : lightColor;
      return new THREE.MeshStandardMaterial({ 
        color: color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: isDarkMode ? 0.2 : 0.1,
        transparent: true,
        opacity: isDarkMode ? 0.9 : 0.8
      });
    };

    const materials = {
      purple: createMaterial(0x9333ea, 0x6366f1),
      pink: createMaterial(0xec4899, 0xf43f5e),
      yellow: createMaterial(0xfbbf24, 0xf59e0b),
      blue: createMaterial(0x3b82f6, 0x0ea5e9)
    };

    // Create paw print shape
    const createPawPrint = () => {
      const group = new THREE.Group();
      
      // Main pad
      const mainPad = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        materials.purple
      );
      mainPad.scale.set(1.2, 1, 1);
      group.add(mainPad);

      // Toe pads
      const toePositions = [
        [-0.3, 0.5, 0],
        [-0.1, 0.6, 0],
        [0.1, 0.6, 0],
        [0.3, 0.5, 0]
      ];

      toePositions.forEach(pos => {
        const toe = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          materials.purple
        );
        toe.position.set(...pos);
        group.add(toe);
      });

      return group;
    };

    // Create bone shape
    const createBone = () => {
      const group = new THREE.Group();
      
      // Shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16),
        materials.pink
      );
      shaft.rotation.z = Math.PI / 2;
      group.add(shaft);

      // End spheres
      const end1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        materials.pink
      );
      end1.position.x = -0.75;
      group.add(end1);

      const end2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        materials.pink
      );
      end2.position.x = 0.75;
      group.add(end2);

      return group;
    };

    // Create ball shape
    const createBall = () => {
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        materials.yellow
      );
      return ball;
    };

    // Create heart shape
    const createHeart = () => {
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0, 0);
      heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
      heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0, 1);
      heartShape.bezierCurveTo(0, 0.6, 0.6, 0.3, 0.6, 0);
      heartShape.bezierCurveTo(0.6, -0.3, 0, -0.3, 0, 0);

      const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.1,
        bevelThickness: 0.1
      };

      const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
      const heart = new THREE.Mesh(geometry, materials.pink);
      heart.scale.set(0.4, 0.4, 0.4);
      return heart;
    };

    // Create star shape
    const createStar = () => {
      const starGeometry = new THREE.OctahedronGeometry(0.5);
      const star = new THREE.Mesh(starGeometry, materials.blue);
      return star;
    };

    // Floating objects array
    const floatingObjects = [];
    const elementCount = 45; // medium density
    const speedMultiplier = 1.5; // normal speed

    const createFunctions = [
      createPawPrint,
      createBone,
      createBall,
      createHeart,
      createStar
    ];

    // Create floating elements
    for (let i = 0; i < elementCount; i++) {
      const createFunc = createFunctions[Math.floor(Math.random() * createFunctions.length)];
      const element = createFunc();
      
      element.position.x = (Math.random() - 0.5) * 50;
      element.position.y = (Math.random() - 0.5) * 50;
      element.position.z = (Math.random() - 0.5) * 40 - 10;
      
      element.rotation.x = Math.random() * Math.PI * 2;
      element.rotation.y = Math.random() * Math.PI * 2;
      element.rotation.z = Math.random() * Math.PI * 2;
      
      const scale = 0.5 + Math.random() * 1;
      element.scale.set(scale, scale, scale);
      
      element.userData = {
        velocity: {
          x: (Math.random() - 0.5) * 0.02 * speedMultiplier,
          y: (Math.random() - 0.5) * 0.02 * speedMultiplier,
          z: (Math.random() - 0.5) * 0.02 * speedMultiplier
        },
        rotation: {
          x: (Math.random() - 0.5) * 0.02 * speedMultiplier,
          y: (Math.random() - 0.5) * 0.02 * speedMultiplier,
          z: (Math.random() - 0.5) * 0.02 * speedMultiplier
        }
      };
      
      scene.add(element);
      floatingObjects.push(element);
    }

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Update floating objects
      floatingObjects.forEach(obj => {
        // Move
        obj.position.x += obj.userData.velocity.x;
        obj.position.y += obj.userData.velocity.y;
        obj.position.z += obj.userData.velocity.z;

        // Rotate
        obj.rotation.x += obj.userData.rotation.x;
        obj.rotation.y += obj.userData.rotation.y;
        obj.rotation.z += obj.userData.rotation.z;

        // Boundary check and wrap around
        if (obj.position.x > 25) obj.position.x = -25;
        if (obj.position.x < -25) obj.position.x = 25;
        if (obj.position.y > 25) obj.position.y = -25;
        if (obj.position.y < -25) obj.position.y = 25;
        if (obj.position.z > 20) obj.position.z = -20;
        if (obj.position.z < -20) obj.position.z = 20;

        // Mouse interaction - subtle push away
        const distance = Math.sqrt(
          Math.pow(obj.position.x - mouseX * 10, 2) +
          Math.pow(obj.position.y - mouseY * 10, 2)
        );

        if (distance < 5) {
          const angle = Math.atan2(
            obj.position.y - mouseY * 10,
            obj.position.x - mouseX * 10
          );
          obj.position.x += Math.cos(angle) * 0.1;
          obj.position.y += Math.sin(angle) * 0.1;
        }
      });

      // Rotate lights for dynamic effect
      const time = Date.now() * 0.0005;
      pointLight1.position.x = Math.sin(time) * 10;
      pointLight1.position.z = Math.cos(time) * 10;
      
      pointLight2.position.x = Math.cos(time * 0.7) * 10;
      pointLight2.position.y = Math.sin(time * 0.7) * 10;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isDarkMode]);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default Floating3DElements;
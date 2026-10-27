import { useEffect, useRef } from 'react'

export default function HeroWordmark() {
  const host = useRef(null)

  useEffect(() => {
    const element = host.current
    let disposed = false
    let teardown = () => {}

    async function initialize() {
      const [THREE, { FontLoader }, { TextGeometry }, { default: fontData }] = await Promise.all([
        import('three'),
        import('three/addons/loaders/FontLoader.js'),
        import('three/addons/geometries/TextGeometry.js'),
        import('../assets/helvetiker_bold.typeface.json'),
      ])
      if (disposed) return

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
      renderer.setClearColor(0x080809, 0)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.domElement.setAttribute('aria-hidden', 'true')
      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
      camera.position.set(0, 0, 20)

      const environment = new THREE.Scene()
      environment.background = new THREE.Color('#07090d')
      const panels = [
        ['#a4ffdc', -5, 5, 3, 5, 2],
        ['#ff743e', 4, 4, 2, 4, 1],
        ['#85b9ff', -6, -2, 2, 3, 5],
        ['#ff92ba', 6, 0, 3, 3, 4],
        ['#edffad', 0, -4, 4, 8, 1],
        ['#f4f4ed', 0, 7, -2, 10, 0.5],
      ].map(([color, positionX, positionY, positionZ, width, height]) => {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
        )
        panel.position.set(positionX, positionY, positionZ)
        panel.lookAt(0, 0, 0)
        environment.add(panel)
        return panel
      })
      const generator = new THREE.PMREMGenerator(renderer)
      const environmentMap = generator.fromScene(environment, 0.035)
      scene.environment = environmentMap.texture
      generator.dispose()
      panels.forEach((panel) => {
        panel.geometry.dispose()
        panel.material.dispose()
      })

      const face = new THREE.MeshPhysicalMaterial({
        color: '#252a30',
        metalness: 0.65,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.15,
      })
      const edge = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 surfaceNormal;
          varying vec3 surfacePosition;
          varying vec3 viewDirection;
          void main() {
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            surfaceNormal = normalize(normalMatrix * normal);
            surfacePosition = position;
            viewDirection = -viewPosition.xyz;
            gl_Position = projectionMatrix * viewPosition;
          }
        `,
        fragmentShader: `
          varying vec3 surfaceNormal;
          varying vec3 surfacePosition;
          varying vec3 viewDirection;
          void main() {
            vec3 normal = normalize(surfaceNormal);
            float angle = dot(normal, normalize(viewDirection));
            float band = surfacePosition.y * 1.35 + surfacePosition.x * 0.22 + angle * 0.8;
            vec3 spectrum = 0.5 + 0.5 * cos(6.28318 * band + vec3(0.0, 2.1, 4.2));
            spectrum = mix(spectrum, vec3(0.94, 1.0, 0.96), 0.08);
            float lighting = 0.55 + 0.45 * abs(dot(normal, normalize(vec3(-0.4, 0.8, 0.6))));
            gl_FragColor = vec4(spectrum * lighting, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
      scene.add(new THREE.HemisphereLight('#b4e6f4', '#07090d', 1.8))
      const light = new THREE.DirectionalLight('#d4fff0', 3)
      light.position.set(-3, 5, 6)
      scene.add(light)
      const word = new THREE.Group()
      const font = new FontLoader().parse(fontData)
      const letters = [...'BRICKWEEL'].map((letter, index) => {
        const geometry = new TextGeometry(letter, {
          font,
          size: 1.8,
          depth: 1.15,
          curveSegments: 10,
          bevelEnabled: true,
          bevelThickness: 0.025,
          bevelSize: 0.018,
          bevelSegments: 3,
        })
        geometry.computeBoundingBox()
        const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x
        geometry.center()
        geometry.scale(1, 1.15, 1)
        const mesh = new THREE.Mesh(geometry, [face, edge])
        mesh.userData.width = width
        mesh.rotation.set(-0.12, [-0.28, 0.22, -0.18][index % 3], [0.08, -0.12, 0.04][index % 3])
        word.add(mesh)
        return mesh
      })
      word.rotation.set(0.12, -0.12, -0.035)
      scene.add(word)

      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      const target = { x: 0, y: 0 }
      const current = { x: 0, y: 0 }
      let frame = 0
      let visible = true
      let previousTime = 0

      function render(time) {
        frame = 0
        const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60
        previousTime = time
        const smoothing = 1 - Math.exp(-8 * elapsed)
        current.x += (target.x - current.x) * smoothing
        current.y += (target.y - current.y) * smoothing
        word.rotation.y = -0.12 + current.x * 0.28
        word.rotation.x = 0.12 - current.y * 0.22
        word.position.set(current.x * 0.16, -current.y * 0.08, 0)
        light.position.x = -3 + current.x * 5
        renderer.render(scene, camera)
        if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.001) schedule()
      }

      function schedule() {
        if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render)
      }

      function reset() {
        target.x = 0
        target.y = 0
        if (media.matches) {
          current.x = 0
          current.y = 0
        }
        schedule()
      }

      function move(event) {
        if (media.matches || event.pointerType === 'touch') return
        const bounds = element.getBoundingClientRect()
        if (event.clientY < bounds.top || event.clientY > bounds.bottom) {
          reset()
          return
        }
        target.x = THREE.MathUtils.clamp(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          -1,
          1,
        )
        target.y = THREE.MathUtils.clamp(
          ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
          -1,
          1,
        )
        schedule()
      }

      function resize() {
        const { width, height } = element.getBoundingClientRect()
        if (!width || !height) return
        renderer.setSize(width, height)
        const portrait = width / height < 1.1
        const verticalScale = portrait ? Math.max(1, (height / width) * 0.85) : 1
        const rows = portrait
          ? [letters.slice(0, 3), letters.slice(3, 6), letters.slice(6)]
          : [letters.slice(0, 5), letters.slice(5)]
        let widestRow = 0
        rows.forEach((row, rowIndex) => {
          const rowWidth = row.reduce(
            (total, letter) => total + letter.userData.width + 0.12,
            -0.12,
          )
          widestRow = Math.max(widestRow, rowWidth)
          let offset = -rowWidth / 2
          row.forEach((letter, column) => {
            letter.scale.y = verticalScale
            letter.position.set(
              offset + letter.userData.width / 2 + (rowIndex % 2 ? 0.2 : -0.12),
              (((rows.length - 1) / 2 - rowIndex) * 2.15 + [0.18, -0.18, 0.12][column % 3]) *
                verticalScale,
              [0.12, -0.2, 0.22][column % 3],
            )
            offset += letter.userData.width + 0.12
          })
        })
        const viewWidth = Math.max(
          widestRow * 0.91,
          ((rows.length === 3 ? 5.7 : 3.8) * width) / height,
        )
        camera.left = -viewWidth / 2
        camera.right = viewWidth / 2
        camera.top = (viewWidth * height) / width / 2
        camera.bottom = -camera.top
        camera.updateProjectionMatrix()
        schedule()
      }

      function visibilityChanged() {
        if (document.hidden) {
          cancelAnimationFrame(frame)
          frame = 0
        } else reset()
      }

      function contextLost(event) {
        event.preventDefault()
        element.classList.remove('is-ready')
        visible = false
        cancelAnimationFrame(frame)
        frame = 0
      }

      function contextRestored() {
        visible = true
        resize()
        element.classList.add('is-ready')
      }

      const resizeObserver = new ResizeObserver(resize)
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible) reset()
        else {
          cancelAnimationFrame(frame)
          frame = 0
        }
      })
      element.append(renderer.domElement)
      resizeObserver.observe(element)
      intersectionObserver.observe(element)
      const site = element.closest('.night-site')
      site.addEventListener('pointermove', move)
      site.addEventListener('pointerleave', reset)
      window.addEventListener('blur', reset)
      document.addEventListener('visibilitychange', visibilityChanged)
      media.addEventListener('change', reset)
      renderer.domElement.addEventListener('webglcontextlost', contextLost)
      renderer.domElement.addEventListener('webglcontextrestored', contextRestored)
      resize()
      renderer.render(scene, camera)
      element.classList.add('is-ready')

      teardown = () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
        site.removeEventListener('pointermove', move)
        site.removeEventListener('pointerleave', reset)
        window.removeEventListener('blur', reset)
        document.removeEventListener('visibilitychange', visibilityChanged)
        media.removeEventListener('change', reset)
        renderer.domElement.removeEventListener('webglcontextlost', contextLost)
        renderer.domElement.removeEventListener('webglcontextrestored', contextRestored)
        letters.forEach((letter) => letter.geometry.dispose())
        face.dispose()
        edge.dispose()
        environmentMap.dispose()
        renderer.dispose()
        renderer.domElement.remove()
        element.classList.remove('is-ready')
      }
    }

    initialize().catch(() => {
      if (!disposed) teardown()
    })
    return () => {
      disposed = true
      teardown()
    }
  }, [])

  return (
    <h1 id="hero-title" className="hero-wordmark" ref={host} aria-label="BRICKWEEL" translate="no">
      <svg className="wordmark-fallback" viewBox="0 0 1200 240" aria-hidden="true">
        <text x="600" y="185" textAnchor="middle" textLength="1150" lengthAdjust="spacingAndGlyphs">
          BRICKWEEL
        </text>
      </svg>
    </h1>
  )
}

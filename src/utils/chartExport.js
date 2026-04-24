function sanitizeFilenamePart(value) {
  return String(value || 'chart')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function triggerDownload(href, filename) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function getChartNodes(panel) {
  return Array.from(panel.querySelectorAll('svg, canvas')).filter((node) => {
    const rect = node.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })
}

function getLargestChartNode(panel) {
  return getChartNodes(panel)
    .sort((left, right) => {
      const leftRect = left.getBoundingClientRect()
      const rightRect = right.getBoundingClientRect()
      return (rightRect.width * rightRect.height) - (leftRect.width * leftRect.height)
    })[0] || null
}

function exportCanvasNode(canvasNode, filename) {
  const dataUrl = canvasNode.toDataURL('image/png')
  triggerDownload(dataUrl, filename)
  return true
}

function exportSvgNode(svgNode, filename) {
  const rect = svgNode.getBoundingClientRect()
  const width = Math.max(1, Math.ceil(rect.width))
  const height = Math.max(1, Math.ceil(rect.height))
  const clone = svgNode.cloneNode(true)

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('viewBox', clone.getAttribute('viewBox') || `0 0 ${width} ${height}`)

  const svgMarkup = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const objectUrl = URL.createObjectURL(svgBlob)

  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2

      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(objectUrl)
        resolve(false)
        return
      }

      context.scale(2, 2)
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      triggerDownload(canvas.toDataURL('image/png'), filename)
      URL.revokeObjectURL(objectUrl)
      resolve(true)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(false)
    }

    image.src = objectUrl
  })
}

export async function exportChartPanel(panel, title = 'chart') {
  if (!panel || typeof document === 'undefined') return false

  const chartNode = getLargestChartNode(panel)
  if (!chartNode) return false

  const filename = `${sanitizeFilenamePart(title)}.png`

  if (chartNode instanceof HTMLCanvasElement) {
    return exportCanvasNode(chartNode, filename)
  }

  if (chartNode instanceof SVGElement) {
    return exportSvgNode(chartNode, filename)
  }

  return false
}

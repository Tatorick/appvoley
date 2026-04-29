/**
 * Compresses an image file using the Canvas API before upload.
 * - Resizes to maxWidth/maxHeight (default 400px) maintaining aspect ratio.
 * - Converts to JPEG at the specified quality (default 0.75).
 * - Typical result: phone photo 3-8MB → ~30-60KB (95%+ reduction).
 *
 * @param {File} file - Original image file from input
 * @param {number} maxSize - Max width/height in pixels (default 400)
 * @param {number} quality - JPEG quality 0–1 (default 0.75)
 * @returns {Promise<Blob>} Compressed image blob
 */
export function compressImage(file, maxSize = 400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions keeping aspect ratio
        let { width, height } = img
        const ratio = Math.min(maxSize / width, maxSize / height, 1) // never upscale
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        // Fill white background (important for transparent PNGs)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Error al comprimir la imagen'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Error al cargar la imagen'))
      img.src = event.target.result
    }

    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}

/**
 * Returns consistent initials-based avatar background color from a name.
 * @param {string} name
 * @returns {string} Tailwind background class
 */
export function getAvatarColor(name = '') {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
    'bg-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Returns player initials (up to 2 characters).
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export function getInitials(firstName = '', lastName = '') {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

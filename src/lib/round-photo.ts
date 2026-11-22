export async function prepareRoundPhoto(file: File): Promise<Blob> {
  const image = await createImageBitmap(file)
  try {
    return await encodeRoundPhoto(image, image.width, image.height)
  } finally {
    image.close()
  }
}

export async function encodeRoundPhoto(image: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const scale = Math.min(1, 1600 / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) throw new Error('Não foi possível preparar a foto.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const photo = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!photo || photo.size > 2 * 1024 * 1024) throw new Error('A foto precisa ter até 2 MB. Tente outra imagem.')
  return photo
}

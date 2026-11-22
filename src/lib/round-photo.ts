export async function prepareRoundPhoto(file: File): Promise<Blob> {
  const image = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d', { alpha: false })
  try {
    if (!context) throw new Error('Não foi possível preparar a foto.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  } finally {
    image.close()
  }
  const photo = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!photo || photo.size > 2 * 1024 * 1024) throw new Error('A foto precisa ter até 2 MB. Tente outra imagem.')
  return photo
}

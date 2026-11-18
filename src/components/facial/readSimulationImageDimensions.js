export default async function readSimulationImageDimensions(file) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Não foi possível ler as dimensões da foto."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}